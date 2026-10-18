import "react-native-url-polyfill/auto";
import { Period, PAID_STATUSES, periodRange, inPeriod, chartPoints } from "./lib/finance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { createClient, Session } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  AppState,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Linking,
  Text,
  TextInput,
  View,
} from "react-native";

type Tab = "home" | "statistics" | "valid" | "participants";
type Registration = {
  id: string;
  full_name: string;
  token: string;
  kind: string;
  email: string;
  created_at: string;
  fast_track: boolean;
  payment_status: string | null;
  status: string | null;
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
type Extra = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  easProjectId?: string;
  hasFirebase?: boolean;
};

const X = (Constants.expoConfig?.extra ?? {}) as Extra;
const supabase = createClient(X.supabaseUrl ?? "", X.supabasePublishableKey ?? "", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
const C = {
  blue: "#2463EB",
  dark: "#1849B6",
  soft: "#EDF3FF",
  navy: "#14213D",
  text: "#182035",
  muted: "#7B8498",
  line: "#E8EBF2",
  page: "#F3F6FC",
  white: "#FFF",
  green: "#20B77A",
  greenSoft: "#E9FAF3",
  gold: "#F4AE2B",
  goldSoft: "#FFF6E3",
  purple: "#8267DE",
};
const SOUND_KEY = "prestasi-kita-notification-sound";
let soundOn = true;
const displayedPayments = new Set<string>();
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const id = notification.request.content.data?.payment_id as string | undefined;
    const duplicate = Boolean(id && displayedPayments.has(id));
    if (id) {
      displayedPayments.add(id);
      if (displayedPayments.size > 2000)
        displayedPayments.delete(displayedPayments.values().next().value!);
    }
    return {
      shouldPlaySound: !duplicate && soundOn,
      shouldSetBadge: !duplicate,
      shouldShowBanner: !duplicate,
      shouldShowList: !duplicate,
    };
  },
});

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
const kind = (v?: string) =>
  ({ prestasi: "Prestasi", ekonomi: "Ekonomi", umum: "Umum", yatim: "Yatim" })[v ?? ""] ?? v ?? "-";
const tier = (r?: Registration) =>
  !r?.fast_track
    ? "Reguler"
    : r.extra?.fast_track_type === "premium"
      ? "FT Premium"
      : "FT Standard";
const date = (v: string) =>
  new Date(v).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

async function channels() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("payments_sound", {
    name: "Pembayaran dengan suara",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 150, 350],
    sound: "default",
    enableVibrate: true,
  });
  await Notifications.setNotificationChannelAsync("payments_silent", {
    name: "Pembayaran tanpa suara",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    enableVibrate: false,
  });
}
type PushState = { remote: boolean; local: boolean; message: string };
async function registerPush(uid: string, enabled: boolean): Promise<PushState> {
  await channels();
  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted" && permission.canAskAgain)
    permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted")
    return {
      remote: false,
      local: false,
      message: "Notifikasi diblokir. Aktifkan izin di Pengaturan Android.",
    };
  if (!Device.isDevice)
    return {
      remote: false,
      local: true,
      message: "Tes push memerlukan perangkat Android dengan Google Play Services.",
    };
  const projectId = X.easProjectId || Constants.easConfig?.projectId;
  if (!projectId || !X.hasFirebase)
    return {
      remote: false,
      local: true,
      message:
        "Notifikasi saat aplikasi tertutup belum aktif: konfigurasi Expo/Firebase belum lengkap.",
    };
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const { error } = await supabase
      .from("admin_push_devices")
      .upsert(
        {
          user_id: uid,
          push_token: token,
          platform: Platform.OS,
          sound_enabled: enabled,
          active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "push_token" },
      );
    if (error) throw error;
    return {
      remote: true,
      local: true,
      message:
        "Perangkat terdaftar untuk push. Pengiriman latar belakang memerlukan kredensial FCM aktif di Expo.",
    };
  } catch (error) {
    return {
      remote: false,
      local: true,
      message: `Pendaftaran push gagal: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function Splash() {
  return (
    <View style={s.splash}>
      <ExpoStatusBar style="dark" />
      <View style={s.splashLogo}>
        <Image source={require("./assets/prestasi-kita-icon.png")} style={s.logo} />
      </View>
      <Text style={s.splashTitle}>Prestasi Kita</Text>
      <Text style={s.splashSub}>Admin Financial Dashboard</Text>
      <ActivityIndicator color={C.blue} size="large" style={{ marginTop: 30 }} />
      <Text style={s.loadingText}>Menyiapkan data terbaru...</Text>
    </View>
  );
}

function Login({ done }: { done: (x: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hide, setHide] = useState(true);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy) return;
    if (!email.trim() || !password)
      return Alert.alert("Data belum lengkap", "Masukkan email dan kata sandi admin.");
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.session) {
      setBusy(false);
      return Alert.alert("Login gagal", error?.message ?? "Sesi tidak ditemukan.");
    }
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      await supabase.auth.signOut();
      setBusy(false);
      return Alert.alert("Akses ditolak", "Akun ini bukan administrator.");
    }
    setBusy(false);
    done(data.session);
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.login}>
      <ExpoStatusBar style="dark" />
      <View style={s.loginLogo}>
        <Image source={require("./assets/prestasi-kita-icon.png")} style={s.logo} />
      </View>
      <Text style={s.loginTitle}>Selamat datang kembali</Text>
      <Text style={s.loginSub}>
        Pantau pendapatan dan peserta Prestasi Kita dalam satu aplikasi.
      </Text>
      <View style={s.loginCard}>
        <Text style={s.inputLabel}>Email administrator</Text>
        <View style={s.inputWrap}>
          <Ionicons name="mail-outline" size={19} color={C.muted} />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="admin@prestasikita.com"
            placeholderTextColor="#A4ABBA"
            style={s.input}
          />
        </View>
        <Text style={[s.inputLabel, { marginTop: 15 }]}>Kata sandi</Text>
        <View style={s.inputWrap}>
          <Ionicons name="lock-closed-outline" size={19} color={C.muted} />
          <TextInput
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            placeholder="Kata sandi"
            placeholderTextColor="#A4ABBA"
            secureTextEntry={hide}
            style={s.input}
          />
          <Pressable onPress={() => setHide((v) => !v)}>
            <Ionicons name={hide ? "eye-outline" : "eye-off-outline"} size={20} color={C.muted} />
          </Pressable>
        </View>
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          onPress={submit}
          style={[s.loginButton, busy && { opacity: 0.65 }]}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={s.loginButtonText}>Masuk</Text>
              <Ionicons name="arrow-forward" size={19} color="white" />
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Segment({ value, set }: { value: Period; set: (v: Period) => void }) {
  return (
    <View style={s.segment}>
      {(["day", "week", "month"] as Period[]).map((v) => (
        <Pressable
          key={v}
          onPress={() => set(v)}
          style={[s.segmentItem, value === v && s.segmentActive]}
        >
          <Text style={[s.segmentText, value === v && s.segmentTextActive]}>
            {v === "day" ? "Harian" : v === "week" ? "Mingguan" : "Bulanan"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function Badge({ r }: { r?: Registration }) {
  const t = tier(r),
    p = t === "FT Premium",
    f = t === "FT Standard";
  return (
    <View style={[s.badge, p ? s.premium : f ? s.standard : s.regular]}>
      <Text style={[s.badgeText, { color: p ? "#B87300" : f ? C.dark : C.muted }]}>{t}</Text>
    </View>
  );
}
function PaymentRow({ p }: { p: Payment }) {
  return (
    <View style={s.row}>
      <View style={[s.avatar, { backgroundColor: C.greenSoft }]}>
        <Ionicons name="checkmark" size={19} color={C.green} />
      </View>
      <View style={s.rowMain}>
        <Text numberOfLines={1} style={s.rowTitle}>
          {p.registration?.full_name ?? "Peserta"}
        </Text>
        <Text numberOfLines={1} style={s.rowSub}>
          {p.registration?.token ?? "-"} · {kind(p.registration?.kind)}
        </Text>
        <Text style={s.rowDate}>{date(p.created_at)}</Text>
      </View>
      <View style={s.rowRight}>
        <Text style={s.income}>+{rupiah(p.amount)}</Text>
        <Badge r={p.registration} />
      </View>
    </View>
  );
}
function RegistrationRow({ r }: { r: Registration }) {
  return (
    <View style={s.row}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{r.full_name?.slice(0, 1).toUpperCase() || "P"}</Text>
      </View>
      <View style={s.rowMain}>
        <Text numberOfLines={1} style={s.rowTitle}>
          {r.full_name}
        </Text>
        <Text numberOfLines={1} style={s.rowSub}>
          {r.token} · {kind(r.kind)}
        </Text>
        <Text style={s.rowDate}>{date(r.created_at)}</Text>
      </View>
      <Badge r={r} />
    </View>
  );
}
function ListHeading({ title, sub, empty }: { title: string; sub: string; empty: boolean }) {
  return (
    <View
      style={[
        s.card,
        { borderBottomLeftRadius: empty ? 24 : 0, borderBottomRightRadius: empty ? 24 : 0 },
      ]}
    >
      <View style={s.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{title}</Text>
          <Text style={s.cardSub}>{sub}</Text>
        </View>
      </View>
      {empty && (
        <View style={s.empty}>
          <Ionicons name="file-tray-outline" size={34} color="#B3BAC8" />
          <Text style={s.emptyText}>Belum ada data</Text>
        </View>
      )}
    </View>
  );
}

function Mini({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={s.mini}>
      <View style={[s.miniIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={s.miniValue}>{value}</Text>
      <Text style={s.miniLabel}>{label}</Text>
    </View>
  );
}

function Chart({ payments, period }: { payments: Payment[]; period: Period }) {
  const pts = chartPoints(payments, period);
  const max = Math.max(...pts.map((p) => p.total), 1);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      contentContainerStyle={{ paddingBottom: 8 }}
    >
      <View style={[s.chart, { width: Math.max(300, pts.length * 42) }]}>
        {pts.map((p, i) => (
          <View key={i} style={s.chartCol}>
            <Text style={s.chartNum}>{p.total ? `${Math.round(p.total / 1000)}k` : "0"}</Text>
            <View style={s.chartTrack}>
              <View
                style={[
                  s.chartBar,
                  {
                    height: Math.max(2, (p.total / max) * 100),
                    backgroundColor: i === pts.length - 1 ? C.gold : C.blue,
                  },
                ]}
              />
            </View>
            <Text style={s.chartLabel}>{p.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Nav({ tab, set }: { tab: Tab; set: (v: Tab) => void }) {
  const items: [Tab, keyof typeof Ionicons.glyphMap, string][] = [
    ["home", "grid", "Dashboard"],
    ["statistics", "stats-chart", "Statistik"],
    ["valid", "shield-checkmark", "Valid"],
    ["participants", "people", "Peserta"],
  ];
  return (
    <View style={s.nav}>
      {items.map(([k, i, l]) => (
        <Pressable
          key={k}
          accessibilityRole="tab"
          accessibilityLabel={l}
          accessibilityState={{ selected: tab === k }}
          onPress={() => set(k)}
          style={s.navItem}
        >
          <View style={[s.navIcon, tab === k && s.navActive]}>
            <Ionicons name={i} size={23} color={tab === k ? "white" : "#9AA3B4"} />
          </View>
          <Text style={[s.navText, tab === k && { color: C.dark }]}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Dashboard({ session, logout }: { session: Session; logout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("day");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [today, setToday] = useState(0);
  const [yesterday, setYesterday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sound, setSound] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useRef(true);
  const [pushState, setPushState] = useState<PushState | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const loadingRef = useRef(false),
    reloadRef = useRef(false),
    baselineRef = useRef(false);
  const seenPayments = useRef(new Set<string>());
  const load = useCallback(async (quiet = false) => {
    if (loadingRef.current) {
      reloadRef.current = true;
      return;
    }
    loadingRef.current = true;
    if (!quiet) setLoading(true);
    try {
      do {
        reloadRef.current = false;
        const now = new Date();
        const month = periodRange("month", now),
          week = periodRange("week", now),
          day = periodRange("day", now);
        const since = new Date(Math.min(month.start.getTime(), week.start.getTime()));
        const all: Payment[] = [];
        let offset = 0;
        const pageSize = 500;
        while (true) {
          const { data, error } = await supabase
            .from("payments")
            .select("id,registration_id,amount,status,provider,created_at")
            .in("status", PAID_STATUSES)
            .gte("created_at", since.toISOString())
            .lte("created_at", now.toISOString())
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(offset, offset + pageSize - 1);
          if (error) throw error;
          all.push(...((data ?? []) as Payment[]));
          if ((data ?? []).length < pageSize) break;
          offset += pageSize;
        }
        const [rr, tr, dr, yr] = await Promise.all([
          supabase
            .from("registrations")
            .select(
              "id,full_name,token,kind,email,created_at,fast_track,payment_status,status,extra",
            )
            .order("created_at", { ascending: false })
            .limit(300),
          supabase.from("registrations").select("id", { count: "exact", head: true }),
          supabase
            .from("registrations")
            .select("id", { count: "exact", head: true })
            .gte("created_at", day.start.toISOString())
            .lt("created_at", day.end.toISOString()),
          supabase
            .from("registrations")
            .select("id", { count: "exact", head: true })
            .gte("created_at", new Date(day.start.getTime() - 86400000).toISOString())
            .lt("created_at", day.start.toISOString()),
        ]);
        for (const result of [rr, tr, dr, yr]) if (result.error) throw result.error;
        const rs = (rr.data ?? []) as Registration[],
          map = new Map(rs.map((r) => [r.id, r]));
        const missing = [
          ...new Set(all.map((p) => p.registration_id).filter((id) => !map.has(id))),
        ];
        for (let i = 0; i < missing.length; i += 200) {
          const { data, error } = await supabase
            .from("registrations")
            .select(
              "id,full_name,token,kind,email,created_at,fast_track,payment_status,status,extra",
            )
            .in("id", missing.slice(i, i + 200));
          if (error) throw error;
          (data ?? []).forEach((r) => map.set(r.id, r as Registration));
        }
        if (!mounted.current) break;
        const mapped = all.map((p) => ({ ...p, registration: map.get(p.registration_id) }));
        const fresh = baselineRef.current
          ? mapped.filter((p) => !seenPayments.current.has(p.id))
          : [];
        mapped.forEach((p) => seenPayments.current.add(p.id));
        baselineRef.current = true;
        setRegs(rs);
        setTotal(tr.count ?? 0);
        setToday(dr.count ?? 0);
        setYesterday(yr.count ?? 0);
        setPayments(mapped);
        setDataError(null);
        setLastSync(new Date());
        // Only payments discovered after the initial snapshot generate local alerts.
        for (const payment of fresh) {
          const message = `${rupiah(Number(payment.amount))} berhasil diverifikasi dari ${payment.registration?.full_name || "Peserta"}.`;
          setNotice(message);
          const permission = await Notifications.getPermissionsAsync();
          if (permission.status === "granted")
            await Notifications.scheduleNotificationAsync({
              identifier: `payment-${payment.id}`,
              content: {
                title: "Pembayaran valid",
                body: message,
                sound: soundOn ? "default" : undefined,
                priority: Notifications.AndroidNotificationPriority.MAX,
                data: {
                  type: "payment_paid",
                  payment_id: payment.id,
                  registration_id: payment.registration_id,
                },
              },
              trigger:
                Platform.OS === "android"
                  ? { channelId: soundOn ? "payments_sound" : "payments_silent" }
                  : null,
            }).catch((error) => console.warn("Notifikasi lokal gagal", error));
        }
      } while (reloadRef.current && mounted.current);
    } catch (error) {
      if (mounted.current)
        setDataError(
          `Sinkronisasi gagal: ${(error as { message?: string }).message ?? String(error)}. Data terakhir tetap ditampilkan.`,
        );
    } finally {
      loadingRef.current = false;
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    const setupPush = async () => {
      const value = await AsyncStorage.getItem(SOUND_KEY);
      if (disposed) return;
      const enabled = value !== "false";
      soundOn = enabled;
      setSound(enabled);
      const result = await registerPush(session.user.id, enabled);
      if (!disposed) setPushState(result);
    };
    const refresh = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        void load(true);
      }, 350);
    };
    void setupPush().catch((error) =>
      setPushState({ local: false, remote: false, message: String(error) }),
    );
    void load();
    const channel = supabase
      .channel(`mobile-admin-${session.user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, refresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refresh();
      });
    const poll = setInterval(() => {
      if (AppState.currentState === "active") void load(true);
    }, 15000);
    const notification = Notifications.addNotificationReceivedListener(refresh);
    const tap = Notifications.addNotificationResponseReceivedListener(() => {
      setTab("valid");
      void load(true);
    });
    const tokenListener = Notifications.addPushTokenListener(() => {
      void setupPush();
    });
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
        void load(true);
        void setupPush();
      } else supabase.auth.stopAutoRefresh();
    });
    return () => {
      disposed = true;
      mounted.current = false;
      if (debounce) clearTimeout(debounce);
      clearInterval(poll);
      app.remove();
      notification.remove();
      tap.remove();
      tokenListener.remove();
      void supabase.removeChannel(channel);
    };
  }, [load, session.user.id]);

  const toggle = async (v: boolean) => {
    setSound(v);
    soundOn = v;
    await AsyncStorage.setItem(SOUND_KEY, String(v));
    await channels();
    await supabase
      .from("admin_push_devices")
      .update({ sound_enabled: v, updated_at: new Date().toISOString() })
      .eq("user_id", session.user.id);
  };
  const { fp, income, standard, premium, validCount } = useMemo(() => {
    const fp = payments.filter((p) => inPeriod(p.created_at, period, lastSync ?? new Date()));
    const unique = new Map<string, Registration>();
    fp.forEach((p) => {
      if (p.registration) unique.set(p.registration.id, p.registration);
    });
    const valid = [...unique.values()];
    return {
      fp,
      income: fp.reduce((a, p) => a + Number(p.amount || 0), 0),
      validCount: unique.size,
      standard: valid.filter((r) => tier(r) === "FT Standard").length,
      premium: valid.filter((r) => tier(r) === "FT Premium").length,
    };
  }, [payments, period, lastSync]);
  const title =
    tab === "home"
      ? "Dashboard Utama"
      : tab === "statistics"
        ? "Statistik Pendapatan"
        : tab === "valid"
          ? "Peserta Valid"
          : "Seluruh Pendaftar";
  const body = () => {
    if (loading)
      return (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={C.blue} />
          <Text style={s.loadingText}>Mengambil data terbaru...</Text>
        </View>
      );
    if (tab === "home")
      return (
        <>
          <View style={s.balance}>
            <View style={s.balanceTop}>
              <Text style={s.balanceLabel}>Total Pendapatan</Text>
              <Text style={s.balanceBrand}>PRESTASI KITA</Text>
            </View>
            <Text style={s.balanceValue}>{rupiah(income)}</Text>
            <View style={s.balanceBottom}>
              <View>
                <Text style={s.balanceSmall}>PESERTA VALID</Text>
                <Text style={s.balanceCount}>{validCount} peserta</Text>
              </View>
              <Ionicons name="wallet" size={29} color="white" />
            </View>
          </View>
          <Segment value={period} set={setPeriod} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.quick}
          >
            <Mini
              icon="people"
              color={C.blue}
              bg={C.soft}
              label="Total Pendaftar"
              value={String(total)}
            />
            <Mini
              icon="person-add"
              color={C.purple}
              bg="#F1EDFF"
              label="Pendaftar Hari Ini"
              value={String(today)}
            />
            <Mini
              icon="time"
              color="#1781A8"
              bg="#E8F7FC"
              label="Pendaftar Kemarin"
              value={String(yesterday)}
            />
            <Mini
              icon="flash"
              color={C.gold}
              bg={C.goldSoft}
              label="FT Standard"
              value={String(standard)}
            />
            <Mini
              icon="diamond"
              color={C.green}
              bg={C.greenSoft}
              label="FT Premium"
              value={String(premium)}
            />
          </ScrollView>
          <ListHeading
            title="Pembayaran Terbaru"
            sub="Transaksi berhasil terbaru"
            empty={!fp.length}
          />
        </>
      );
    if (tab === "statistics")
      return (
        <>
          <Segment value={period} set={setPeriod} />
          <View style={s.card}>
            <View style={s.cardHead}>
              <View>
                <Text style={s.cardTitle}>Grafik Pendapatan</Text>
                <Text style={s.cardSub}>Periode WIB yang sama dengan total pendapatan</Text>
              </View>
              <Ionicons name="analytics" size={23} color={C.blue} />
            </View>
            <Chart payments={payments} period={period} />
          </View>
          <View style={s.summary}>
            <View style={s.summaryBox}>
              <Text style={s.summaryLabel}>TOTAL PENDAPATAN</Text>
              <Text style={s.summaryAmount}>{rupiah(income)}</Text>
            </View>
            <View style={s.summaryBox}>
              <Text style={s.summaryLabel}>TRANSAKSI VALID</Text>
              <Text style={s.summaryNumber}>{fp.length}</Text>
            </View>
          </View>
          <ListHeading
            title="Riwayat Transaksi"
            sub="Transaksi berhasil terbaru"
            empty={!fp.length}
          />
        </>
      );
    if (tab === "valid")
      return (
        <>
          <Segment value={period} set={setPeriod} />
          <View style={s.validHero}>
            <View>
              <Text style={s.heroLabel}>Peserta valid periode ini</Text>
              <Text style={s.heroNumber}>{validCount}</Text>
            </View>
            <View>
              <Text style={s.heroTier}>Standard {standard}</Text>
              <Text style={s.heroTier}>Premium {premium}</Text>
            </View>
          </View>
          <ListHeading
            title="Fast Track Standard & Premium"
            sub="Pembayaran terverifikasi"
            empty={!fp.length}
          />
        </>
      );
    return (
      <>
        <View style={s.partHero}>
          <Text style={s.heroLabel}>Total seluruh pendaftar</Text>
          <Text style={s.partNumber}>{total}</Text>
          <Text style={s.partSub}>
            {today} hari ini · {yesterday} kemarin
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
        >
          {["Reguler", "FT Standard", "FT Premium"].map((t) => (
            <View key={t} style={s.chip}>
              <Text style={s.chipText}>
                {t} {regs.filter((r) => tier(r) === t).length}
              </Text>
            </View>
          ))}
        </ScrollView>
        <ListHeading title="Pendaftar Terbaru" sub="300 pendaftar terbaru" empty={!regs.length} />
      </>
    );
  };
  return (
    <SafeAreaView style={s.page}>
      <ExpoStatusBar style="dark" />
      <FlatList<Payment | Registration>
        data={loading ? [] : tab === "participants" ? regs : fp}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: C.white,
              paddingHorizontal: 17,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: C.line,
            }}
          >
            {"registration_id" in item ? <PaymentRow p={item} /> : <RegistrationRow r={item} />}
          </View>
        )}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={[C.blue]}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
          />
        }
        ListHeaderComponent={
          <>
            {notice && (
              <View style={s.notice}>
                <View style={s.noticeIcon}>
                  <Ionicons name="wallet" size={21} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.noticeTitle}>Pembayaran baru masuk</Text>
                  <Text style={s.noticeBody}>{notice}</Text>
                </View>
                <Pressable onPress={() => setNotice(null)}>
                  <Ionicons name="close" size={20} color="white" />
                </Pressable>
              </View>
            )}
            <View style={s.header}>
              <View style={{ flex: 1 }}>
                <Text style={s.eyebrow}>PRESTASI KITA ADMIN</Text>
                <Text style={s.headerTitle}>{title}</Text>
                <Text style={s.headerDate}>
                  {new Date().toLocaleDateString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <Pressable style={s.headerBtn} onPress={() => setSettingsOpen(true)}>
                <Ionicons
                  name={sound ? "notifications" : "notifications-off"}
                  size={21}
                  color={C.blue}
                />
              </Pressable>
            </View>
            {pushState && !pushState.remote && (
              <Pressable
                onPress={() => setSettingsOpen(true)}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: C.goldSoft,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: C.navy, fontSize: 12 }}>{pushState.message}</Text>
              </Pressable>
            )}
            {dataError && <Text style={{ color: "#B42318", marginBottom: 12 }}>{dataError}</Text>}
            <Text style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>
              {lastSync
                ? `Diperbarui ${lastSync.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB · otomatis saat aplikasi aktif`
                : "Menghubungkan data..."}
            </Text>
            {body()}
          </>
        }
      />
      <Modal
        visible={settingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.35)" }}>
          <View
            style={{
              backgroundColor: "white",
              padding: 24,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              gap: 16,
            }}
          >
            <Text style={s.cardTitle}>Notifikasi pembayaran</Text>
            <Text style={{ color: C.muted }}>
              {pushState?.message ?? "Memeriksa notifikasi..."}
            </Text>
            <Pressable
              style={s.loginButton}
              onPress={async () => {
                await channels();
                const permission = await Notifications.requestPermissionsAsync();
                if (permission.status !== "granted")
                  return Alert.alert(
                    "Izin notifikasi",
                    "Aktifkan izin melalui Pengaturan Android.",
                  );
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: "Tes notifikasi pembayaran",
                    body: "Ikon putih dan notifikasi lokal berhasil ditampilkan.",
                    sound: sound ? "default" : undefined,
                  },
                  trigger:
                    Platform.OS === "android"
                      ? { channelId: sound ? "payments_sound" : "payments_silent" }
                      : null,
                });
              }}
            >
              <Text style={s.loginButtonText}>Tes notifikasi lokal</Text>
            </Pressable>
            <Pressable
              onPress={async () => setPushState(await registerPush(session.user.id, sound))}
            >
              <Text style={{ color: C.blue }}>Daftarkan ulang push</Text>
            </Pressable>
            <Pressable onPress={() => void Linking.openSettings()}>
              <Text style={{ color: C.blue }}>Buka izin notifikasi Android</Text>
            </Pressable>
            <Pressable onPress={() => void toggle(!sound)}>
              <Text style={{ color: C.blue }}>{sound ? "Matikan suara" : "Aktifkan suara"}</Text>
            </Pressable>
            <Pressable onPress={logout}>
              <Text style={{ color: "#B42318" }}>Keluar akun</Text>
            </Pressable>
            <Pressable onPress={() => setSettingsOpen(false)}>
              <Text style={{ fontWeight: "700", paddingVertical: 12 }}>Tutup</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Nav tab={tab} set={setTab} />
    </SafeAreaView>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [init, setInit] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      let valid: Session | null = null;
      if (data.session) {
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (role) valid = data.session;
      }
      setSession(valid);
      setInit(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, n) => {
      if (!n) setSession(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  if (init) return <Splash />;
  if (!session) return <Login done={setSession} />;
  return (
    <Dashboard
      session={session}
      logout={async () => {
        await supabase
          .from("admin_push_devices")
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq("user_id", session.user.id);
        await supabase.auth.signOut();
        setSession(null);
      }}
    />
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.page },
  content: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 14 : 18,
    paddingBottom: 120,
  },
  splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  splashLogo: {
    width: 118,
    height: 118,
    borderRadius: 34,
    overflow: "hidden",
    shadowColor: C.blue,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 8,
  },
  logo: { width: "100%", height: "100%", resizeMode: "cover" },
  splashTitle: { marginTop: 24, color: C.navy, fontSize: 28, fontWeight: "900" },
  splashSub: { marginTop: 5, color: C.muted, fontSize: 12, letterSpacing: 0.8 },
  loadingText: { marginTop: 12, color: C.muted, fontSize: 11 },
  login: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    backgroundColor: C.page,
  },
  loginLogo: { width: 76, height: 76, borderRadius: 24, overflow: "hidden" },
  loginTitle: { marginTop: 24, color: C.navy, fontSize: 28, fontWeight: "900" },
  loginSub: { marginTop: 8, color: C.muted, fontSize: 13, lineHeight: 20 },
  loginCard: {
    marginTop: 25,
    padding: 20,
    borderRadius: 25,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: C.line,
  },
  inputLabel: { marginBottom: 7, color: C.text, fontSize: 11, fontWeight: "800" },
  inputWrap: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 15,
    backgroundColor: "#F9FAFC",
    borderWidth: 1,
    borderColor: C.line,
  },
  input: { flex: 1, height: "100%", color: C.text },
  loginButton: {
    height: 53,
    marginTop: 22,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: C.blue,
  },
  loginButtonText: { color: "white", fontWeight: "900" },
  header: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 17,
  },
  eyebrow: { color: C.blue, fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  headerTitle: { marginTop: 5, color: C.navy, fontSize: 25, fontWeight: "900" },
  headerDate: { marginTop: 4, color: C.muted, fontSize: 11 },
  headerBtn: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: C.line,
  },
  balance: {
    height: 188,
    padding: 21,
    borderRadius: 27,
    backgroundColor: C.blue,
    shadowColor: C.blue,
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 2,
  },
  balanceTop: { flexDirection: "row", justifyContent: "space-between" },
  balanceLabel: { color: "rgba(255,255,255,.82)", fontSize: 12, fontWeight: "700" },
  balanceBrand: { color: "white", fontSize: 11, fontWeight: "900" },
  balanceValue: { marginTop: 20, color: "white", fontSize: 31, fontWeight: "900" },
  balanceBottom: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  balanceSmall: { color: "rgba(255,255,255,.66)", fontSize: 10, fontWeight: "800" },
  balanceCount: { marginTop: 3, color: "white", fontSize: 13, fontWeight: "800" },
  segment: {
    marginTop: 17,
    padding: 4,
    flexDirection: "row",
    borderRadius: 15,
    backgroundColor: "#E9EDF5",
  },
  segmentItem: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  segmentActive: { backgroundColor: "white", elevation: 2 },
  segmentText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  segmentTextActive: { color: C.dark },
  quick: { gap: 11, paddingVertical: 17 },
  mini: {
    width: 126,
    padding: 14,
    borderRadius: 19,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: C.line,
  },
  miniIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  miniValue: { marginTop: 12, color: C.navy, fontSize: 21, fontWeight: "900" },
  miniLabel: { marginTop: 3, color: C.muted, fontSize: 12, fontWeight: "700" },
  card: {
    marginTop: 16,
    padding: 17,
    borderRadius: 24,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: C.line,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: { color: C.navy, fontSize: 15, fontWeight: "900" },
  cardSub: { marginTop: 3, color: C.muted, fontSize: 12 },
  live: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: C.greenSoft,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  liveText: { color: C.green, fontSize: 10, fontWeight: "900" },
  innerList: { maxHeight: 365 },
  row: {
    minHeight: 72,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F6",
  },
  avatar: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.soft,
  },
  avatarText: { color: C.dark, fontWeight: "900" },
  rowMain: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  rowTitle: { color: C.text, fontSize: 14, fontWeight: "900" },
  rowSub: { marginTop: 3, color: C.muted, fontSize: 12 },
  rowDate: { marginTop: 3, color: "#A0A7B6", fontSize: 11 },
  rowRight: { maxWidth: 130, alignItems: "flex-end" },
  income: { marginBottom: 5, color: C.green, fontSize: 10.5, fontWeight: "900" },
  badge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9 },
  premium: { backgroundColor: C.goldSoft },
  standard: { backgroundColor: C.soft },
  regular: { backgroundColor: "#F1F3F6" },
  badgeText: { fontSize: 10, fontWeight: "900" },
  chart: { height: 175, flexDirection: "row", alignItems: "flex-end", gap: 6 },
  chartCol: { flex: 1, alignItems: "center" },
  chartNum: { height: 17, color: C.muted, fontSize: 10, fontWeight: "700" },
  chartTrack: {
    width: "62%",
    height: 105,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#F0F3F8",
  },
  chartBar: { width: "100%", borderRadius: 8 },
  chartLabel: { marginTop: 7, color: C.muted, fontSize: 11, fontWeight: "700" },
  summary: { marginTop: 14, flexDirection: "row", gap: 10 },
  summaryBox: {
    flex: 1,
    minHeight: 95,
    padding: 15,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: C.line,
  },
  summaryLabel: { color: C.muted, fontSize: 10, fontWeight: "900" },
  summaryAmount: { marginTop: 12, color: C.dark, fontSize: 17, fontWeight: "900" },
  summaryNumber: { marginTop: 9, color: C.green, fontSize: 25, fontWeight: "900" },
  validHero: {
    marginTop: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 23,
    backgroundColor: C.navy,
  },
  heroLabel: { color: "rgba(255,255,255,.68)", fontSize: 10 },
  heroNumber: { marginTop: 5, color: "white", fontSize: 32, fontWeight: "900" },
  heroTier: { marginVertical: 4, color: "white", fontSize: 10, fontWeight: "800" },
  partHero: { padding: 21, borderRadius: 24, backgroundColor: C.blue },
  partNumber: { marginTop: 5, color: "white", fontSize: 36, fontWeight: "900" },
  partSub: { marginTop: 5, color: "white", fontSize: 11, fontWeight: "700" },
  chips: { gap: 8, paddingTop: 13 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: C.line,
  },
  chipText: { color: C.text, fontSize: 12, fontWeight: "800" },
  notice: {
    marginBottom: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 18,
    backgroundColor: C.green,
    shadowColor: C.green,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  noticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.18)",
  },
  noticeTitle: { color: "white", fontSize: 12, fontWeight: "900" },
  noticeBody: { marginTop: 3, color: "rgba(255,255,255,.88)", fontSize: 10 },
  nav: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: Platform.OS === "ios" ? 20 : 13,
    height: 76,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: C.navy,
    shadowOpacity: 0.13,
    shadowRadius: 17,
    elevation: 12,
  },
  navItem: { flex: 1, minHeight: 60, justifyContent: "center", alignItems: "center" },
  navIcon: {
    width: 46,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  navActive: { backgroundColor: C.blue },
  navText: { marginTop: 4, color: "#667085", fontSize: 11, fontWeight: "800" },
  loading: { height: 420, alignItems: "center", justifyContent: "center" },
  empty: { height: 160, alignItems: "center", justifyContent: "center" },
  emptyText: { marginTop: 9, color: C.muted, fontSize: 11, fontWeight: "700" },
});
