import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { createClient, Session } from '@supabase/supabase-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

type ExtraConfig = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  easProjectId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
const supabase = createClient(extra.supabaseUrl ?? '', extra.supabasePublishableKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const COLORS = {
  primary: '#5132A8',
  primarySoft: '#F2EEFF',
  gold: '#E6A700',
  green: '#169B62',
  greenSoft: '#EAF9F1',
  orange: '#C75B12',
  orangeSoft: '#FFF4E8',
  ink: '#172036',
  muted: '#69738A',
  border: '#E5E8F0',
  background: '#F6F7FB',
  white: '#FFFFFF',
};

const SOUND_KEY = 'prestasi-kita-notification-sound';
let foregroundSoundEnabled = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: foregroundSoundEnabled,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Registration = {
  id: string;
  full_name: string;
  token: string;
  kind: string;
  email: string;
  extra: Record<string, unknown> | null;
};

type Payment = {
  id: string;
  registration_id: string;
  amount: number;
  status: string;
  provider: string | null;
  created_at: string;
  registration?: Registration;
};

const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const paymentDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const kindLabel = (kind?: string) => {
  const map: Record<string, string> = {
    prestasi: 'Prestasi',
    ekonomi: 'Ekonomi',
    umum: 'Umum',
    yatim: 'Yatim',
  };
  return map[kind ?? ''] ?? kind ?? '-';
};

async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('payments_sound', {
    name: 'Pembayaran dengan suara',
    description: 'Notifikasi ketika pembayaran peserta berhasil diverifikasi.',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 150, 350],
    lightColor: COLORS.primary,
    sound: 'default',
    enableVibrate: true,
  });
  await Notifications.setNotificationChannelAsync('payments_silent', {
    name: 'Pembayaran tanpa suara',
    description: 'Notifikasi pembayaran tanpa bunyi.',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: null,
    sound: null,
    enableVibrate: false,
  });
}

async function saveDeviceToken(userId: string, soundEnabled: boolean) {
  if (!Device.isDevice || !extra.easProjectId) return null;
  await ensureChannels();
  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const pushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId: extra.easProjectId })
  ).data;
  const { error } = await supabase.from('admin_push_devices').upsert(
    {
      user_id: userId,
      push_token: pushToken,
      platform: Platform.OS,
      sound_enabled: soundEnabled,
      active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'push_token' },
  );
  if (error) throw error;
  return pushToken;
}

function LoginScreen({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);

  const login = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Data belum lengkap', 'Masukkan email dan kata sandi administrator.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.session) {
      setLoading(false);
      Alert.alert('Login gagal', error?.message ?? 'Sesi tidak ditemukan.');
      return;
    }
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.session.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!role) {
      await supabase.auth.signOut();
      setLoading(false);
      Alert.alert('Akses ditolak', 'Akun ini bukan administrator Prestasi Kita.');
      return;
    }
    setLoading(false);
    onLogin(data.session);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginPage}>
      <StatusBar style="dark" />
      <View style={styles.brandMark}>
        <Ionicons name="trophy" size={34} color={COLORS.white} />
      </View>
      <Text style={styles.loginEyebrow}>PRESTASI KITA</Text>
      <Text style={styles.loginTitle}>Pantau pendapatan{`\n`}dalam satu genggaman.</Text>
      <Text style={styles.loginSubtitle}>
        Masuk menggunakan akun administrator yang sama dengan dashboard website.
      </Text>
      <View style={styles.loginCard}>
        <Text style={styles.inputLabel}>Email administrator</Text>
        <View style={styles.inputShell}>
          <Ionicons name="mail-outline" size={19} color={COLORS.muted} />
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="admin@prestasikita.com"
            placeholderTextColor="#A0A7B8"
            style={styles.input}
            value={email}
          />
        </View>
        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Kata sandi</Text>
        <View style={styles.inputShell}>
          <Ionicons name="lock-closed-outline" size={19} color={COLORS.muted} />
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            onSubmitEditing={login}
            placeholder="Masukkan kata sandi"
            placeholderTextColor="#A0A7B8"
            secureTextEntry={hidePassword}
            style={styles.input}
            value={password}
          />
          <Pressable onPress={() => setHidePassword((value) => !value)}>
            <Ionicons name={hidePassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.muted} />
          </Pressable>
        </View>
        <Pressable disabled={loading} onPress={login} style={styles.primaryButton}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : (
            <>
              <Text style={styles.primaryButtonText}>Masuk ke aplikasi</Text>
              <Ionicons name="arrow-forward" size={19} color={COLORS.white} />
            </>
          )}
        </Pressable>
      </View>
      <Text style={styles.secureNote}>Akses khusus administrator</Text>
    </KeyboardAvoidingView>
  );
}

function StatCard({ icon, label, value, detail, tone }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail: string;
  tone: 'purple' | 'green' | 'gold';
}) {
  const toneStyle = {
    purple: { backgroundColor: COLORS.primarySoft, color: COLORS.primary },
    green: { backgroundColor: COLORS.greenSoft, color: COLORS.green },
    gold: { backgroundColor: COLORS.orangeSoft, color: COLORS.orange },
  }[tone];
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: toneStyle.backgroundColor }]}>
        <Ionicons name={icon} size={21} color={toneStyle.color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const tier = payment.registration?.extra?.fast_track_type === 'premium' ? 'Premium' : 'Standard';
  return (
    <View style={styles.paymentRow}>
      <View style={styles.paymentAvatar}>
        <Text style={styles.paymentAvatarText}>{(payment.registration?.full_name ?? 'P').slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.paymentMain}>
        <Text numberOfLines={1} style={styles.paymentName}>{payment.registration?.full_name ?? 'Peserta'}</Text>
        <Text style={styles.paymentMeta}>{payment.registration?.token ?? '-'} · {kindLabel(payment.registration?.kind)}</Text>
        <Text style={styles.paymentTime}>{paymentDate(payment.created_at)}</Text>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.paymentAmount}>{rupiah(payment.amount)}</Text>
        <View style={tier === 'Premium' ? styles.premiumBadge : styles.standardBadge}>
          <Text style={tier === 'Premium' ? styles.premiumText : styles.standardText}>{tier}</Text>
        </View>
      </View>
    </View>
  );
}

function Dashboard({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushReady, setPushReady] = useState(false);
  const mounted = useRef(true);

  const loadPayments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    since.setHours(0, 0, 0, 0);
    const { data: paymentRows, error } = await supabase
      .from('payments')
      .select('id,registration_id,amount,status,provider,created_at')
      .eq('status', 'paid')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      if (mounted.current) { setLoading(false); setRefreshing(false); }
      Alert.alert('Data gagal dimuat', error.message);
      return;
    }
    const base = (paymentRows ?? []) as Payment[];
    const ids = Array.from(new Set(base.map((row) => row.registration_id).filter(Boolean)));
    const registrations = new Map<string, Registration>();
    for (let index = 0; index < ids.length; index += 200) {
      const { data } = await supabase
        .from('registrations')
        .select('id,full_name,token,kind,email,extra')
        .in('id', ids.slice(index, index + 200));
      (data ?? []).forEach((row) => registrations.set(row.id, row as Registration));
    }
    if (mounted.current) {
      setPayments(base.map((row) => ({ ...row, registration: registrations.get(row.registration_id) })));
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    AsyncStorage.getItem(SOUND_KEY).then(async (stored) => {
      const enabled = stored !== 'false';
      foregroundSoundEnabled = enabled;
      setSoundEnabled(enabled);
      try {
        const token = await saveDeviceToken(session.user.id, enabled);
        if (mounted.current) setPushReady(Boolean(token));
      } catch (error) {
        console.warn('Push registration failed', error);
      }
    });
    ensureChannels();
    loadPayments();
    const channel = supabase
      .channel(`admin-payments-${session.user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments', filter: 'status=eq.paid' }, async (event) => {
        const row = event.new as Payment;
        await loadPayments(true);
        if (AppState.currentState === 'active') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Pembayaran baru masuk 💰',
              body: `${rupiah(Number(row.amount))} telah berhasil diverifikasi.`,
              sound: foregroundSoundEnabled ? 'default' : undefined,
            },
            trigger: null,
          });
        }
      })
      .subscribe();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadPayments(true);
    });
    return () => {
      mounted.current = false;
      appStateSubscription.remove();
      supabase.removeChannel(channel);
    };
  }, [loadPayments, session.user.id]);

  const toggleSound = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    foregroundSoundEnabled = enabled;
    await AsyncStorage.setItem(SOUND_KEY, String(enabled));
    await ensureChannels();
    const { error } = await supabase
      .from('admin_push_devices')
      .update({ sound_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('user_id', session.user.id);
    if (error && pushReady) Alert.alert('Pengaturan belum tersimpan', error.message);
  };

  const now = new Date();
  const today = dayKey(now);
  const todayPayments = payments.filter((row) => dayKey(new Date(row.created_at)) === today);
  const todayIncome = todayPayments.reduce((total, row) => total + Number(row.amount || 0), 0);
  const premiumCount = todayPayments.filter((row) => row.registration?.extra?.fast_track_type === 'premium').length;
  const lastSevenDays = useMemo(() => {
    const points = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date();
      day.setDate(day.getDate() - offset);
      const key = dayKey(day);
      const total = payments
        .filter((row) => dayKey(new Date(row.created_at)) === key)
        .reduce((sum, row) => sum + Number(row.amount || 0), 0);
      points.push({ key, label: day.toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 3), total });
    }
    return points;
  }, [payments]);
  const maxIncome = Math.max(...lastSevenDays.map((point) => point.total), 1);

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.dashboardContent}
        refreshControl={<RefreshControl colors={[COLORS.primary]} onRefresh={() => { setRefreshing(true); loadPayments(true); }} refreshing={refreshing} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>PRESTASI KITA ADMIN</Text>
            <Text style={styles.headerTitle}>Ringkasan Pendapatan</Text>
            <Text style={styles.headerDate}>
              {now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <Pressable onPress={() => Alert.alert('Keluar dari aplikasi?', 'Anda perlu login kembali untuk melihat pendapatan.', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Keluar', style: 'destructive', onPress: onLogout },
          ])} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={21} color={COLORS.primary} />
          </Pressable>
        </View>
        <View style={styles.notificationCard}>
          <View style={styles.notificationIcon}>
            <Ionicons name={soundEnabled ? 'notifications' : 'notifications-off'} size={22} color={COLORS.primary} />
          </View>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Suara notifikasi pembayaran</Text>
            <Text style={styles.notificationSubtitle}>
              {soundEnabled ? 'Aktif saat pembayaran berhasil' : 'Notifikasi masuk tanpa suara'}
              {extra.easProjectId && !pushReady ? ' · Berikan izin notifikasi' : ''}
            </Text>
          </View>
          <Switch onValueChange={toggleSound} thumbColor={COLORS.white} trackColor={{ false: '#CBD0DC', true: COLORS.primary }} value={soundEnabled} />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Mengambil data pembayaran...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard detail="Pembayaran terverifikasi" icon="wallet-outline" label="Pendapatan hari ini" tone="purple" value={rupiah(todayIncome)} />
              <StatCard detail={`${premiumCount} Premium · ${todayPayments.length - premiumCount} Standard`} icon="checkmark-circle-outline" label="Peserta valid hari ini" tone="green" value={String(todayPayments.length)} />
              <StatCard detail="Dalam 30 hari terakhir" icon="people-outline" label="Total peserta valid" tone="gold" value={String(payments.length)} />
            </View>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>Pendapatan 7 Hari</Text>
                  <Text style={styles.sectionSubtitle}>Pergerakan pembayaran terverifikasi</Text>
                </View>
                <Ionicons name="stats-chart" size={21} color={COLORS.primary} />
              </View>
              <View style={styles.chart}>
                {lastSevenDays.map((point, index) => (
                  <View key={point.key} style={styles.chartItem}>
                    <Text style={styles.chartAmount}>{point.total > 0 ? `${Math.round(point.total / 1000)}k` : '0'}</Text>
                    <View style={styles.chartTrack}>
                      <View style={[styles.chartBar, { height: Math.max(5, (point.total / maxIncome) * 86), backgroundColor: index === lastSevenDays.length - 1 ? COLORS.gold : COLORS.primary }]} />
                    </View>
                    <Text style={styles.chartLabel}>{point.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>Pembayaran Terbaru</Text>
                  <Text style={styles.sectionSubtitle}>Data diperbarui otomatis</Text>
                </View>
                <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
              </View>
              {payments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={34} color="#A5ADBF" />
                  <Text style={styles.emptyTitle}>Belum ada pembayaran valid</Text>
                  <Text style={styles.emptyText}>Pembayaran baru akan tampil otomatis di sini.</Text>
                </View>
              ) : payments.slice(0, 20).map((payment) => <PaymentRow key={payment.id} payment={payment} />)}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setInitializing(false); return; }
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', data.session.user.id).eq('role', 'admin').maybeSingle();
      setSession(role ? data.session : null);
      setInitializing(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) setSession(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (initializing) {
    return <View style={styles.splash}><StatusBar style="dark" /><View style={styles.brandMark}><Ionicons name="trophy" size={34} color={COLORS.white} /></View><ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} /></View>;
  }
  if (!session) return <LoginScreen onLogin={setSession} />;
  return <Dashboard session={session} onLogout={async () => {
    await supabase.from('admin_push_devices').update({ active: false, updated_at: new Date().toISOString() }).eq('user_id', session.user.id);
    await supabase.auth.signOut();
    setSession(null);
  }} />;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  loginPage: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: COLORS.background },
  brandMark: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 8 },
  loginEyebrow: { marginTop: 28, color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.6 },
  loginTitle: { marginTop: 9, color: COLORS.ink, fontSize: 31, lineHeight: 38, fontWeight: '900' },
  loginSubtitle: { marginTop: 12, color: COLORS.muted, fontSize: 14, lineHeight: 21 },
  loginCard: { marginTop: 30, padding: 20, backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#202A44', shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  inputLabel: { color: COLORS.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  inputShell: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, paddingHorizontal: 14, backgroundColor: '#FBFBFD' },
  input: { flex: 1, height: '100%', color: COLORS.ink, fontSize: 14 },
  primaryButton: { marginTop: 22, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: COLORS.primary },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  secureNote: { marginTop: 18, textAlign: 'center', color: COLORS.muted, fontSize: 11 },
  dashboardContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 42 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerEyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  headerTitle: { marginTop: 5, color: COLORS.ink, fontSize: 24, fontWeight: '900' },
  headerDate: { marginTop: 4, color: COLORS.muted, fontSize: 12 },
  logoutButton: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  notificationCard: { marginTop: 20, padding: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#DFD7F8' },
  notificationIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primarySoft },
  notificationText: { flex: 1, marginHorizontal: 12 },
  notificationTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  notificationSubtitle: { marginTop: 3, color: COLORS.muted, fontSize: 10.5 },
  loadingBox: { height: 320, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: COLORS.muted, fontSize: 12 },
  statsGrid: { marginTop: 18, gap: 12 },
  statCard: { padding: 17, borderRadius: 21, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statLabel: { marginTop: 14, color: COLORS.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { marginTop: 5, color: COLORS.ink, fontSize: 26, fontWeight: '900' },
  statDetail: { marginTop: 5, color: COLORS.muted, fontSize: 11 },
  sectionCard: { marginTop: 16, padding: 17, borderRadius: 22, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '900' },
  sectionSubtitle: { marginTop: 3, color: COLORS.muted, fontSize: 10.5 },
  chart: { height: 150, marginTop: 18, flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  chartItem: { flex: 1, alignItems: 'center' },
  chartAmount: { height: 16, color: COLORS.muted, fontSize: 8.5, fontWeight: '700' },
  chartTrack: { height: 90, width: '64%', justifyContent: 'flex-end', borderRadius: 7, backgroundColor: '#F0F1F5', overflow: 'hidden' },
  chartBar: { width: '100%', borderRadius: 7 },
  chartLabel: { marginTop: 7, color: COLORS.muted, fontSize: 9, fontWeight: '700' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, backgroundColor: COLORS.greenSoft },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
  liveText: { color: COLORS.green, fontSize: 9, fontWeight: '900' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF0F4' },
  paymentAvatar: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primarySoft },
  paymentAvatarText: { color: COLORS.primary, fontSize: 15, fontWeight: '900' },
  paymentMain: { flex: 1, marginHorizontal: 11 },
  paymentName: { color: COLORS.ink, fontSize: 12.5, fontWeight: '800' },
  paymentMeta: { marginTop: 3, color: COLORS.muted, fontSize: 9.5 },
  paymentTime: { marginTop: 3, color: '#959DAF', fontSize: 9 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { color: COLORS.green, fontSize: 12, fontWeight: '900' },
  standardBadge: { marginTop: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, backgroundColor: '#F1F2F6' },
  standardText: { color: COLORS.muted, fontSize: 8.5, fontWeight: '800' },
  premiumBadge: { marginTop: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, backgroundColor: COLORS.orangeSoft },
  premiumText: { color: COLORS.orange, fontSize: 8.5, fontWeight: '800' },
  emptyState: { paddingVertical: 42, alignItems: 'center' },
  emptyTitle: { marginTop: 11, color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  emptyText: { marginTop: 4, color: COLORS.muted, fontSize: 10.5 },
});
