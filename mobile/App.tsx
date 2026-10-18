import "react-native-url-polyfill/auto";
import {
  PAID_STATUSES,
  periodRange,
  DateFilter,
  matchesDate,
  filterLabel,
  selectionPoints,
  jakartaDay,
} from "./lib/finance";
import {
  Cover,
  HeroCard,
  MetricCard,
  FilterBar,
  DateFilterSheet,
  TrendChart,
  Breakdown,
  BottomNav,
  LoadingCards,
} from "./components/MobileUI";
import { LinearGradient } from "expo-linear-gradient";
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
  blue: "#6554F5",
  dark: "#5045CE",
  soft: "#EEEAFE",
  navy: "#14213D",
  text: "#182035",
  muted: "#7B8498",
  line: "#E8EBF2",
  page: "#F7F8FD",
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
    const { error } = await supabase.from("admin_push_devices").upsert(
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
  return <Cover loading />;
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
          <LinearGradient
            colors={["#806CF7", "#535CE0"]}
            style={{
              height: 53,
              width: "100%",
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
            }}
          >
            {busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={s.loginButtonText}>Masuk ke ruang kendali</Text>
                <Ionicons name="arrow-forward" size={19} color="white" />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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

function Dashboard({ session, logout }: { session: Session; logout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filter, setFilter] = useState<DateFilter>({ period: "day" });
  const [dateSheet, setDateSheet] = useState(false);
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
        const day = periodRange("day", now);
        const all: Payment[] = [];
        const pageSize = 500;
        const loadPayments = async () => {
          let offset = 0;
          while (true) {
            const { data, error } = await supabase
              .from("payments")
              .select("id,registration_id,amount,status,provider,created_at")
              .in("status", PAID_STATUSES)
              .lte("created_at", now.toISOString())
              .order("created_at", { ascending: false })
              .order("id", { ascending: false })
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            all.push(...((data ?? []) as Payment[]));
            if ((data ?? []).length < pageSize) break;
            offset += pageSize;
          }
        };
        const rs: Registration[] = [];
        const loadRegistrations = async () => {
          let regOffset = 0;
          while (true) {
            const { data, error } = await supabase
              .from("registrations")
              .select(
                "id,full_name,token,kind,created_at,fast_track,fast_track_type:extra->>fast_track_type",
              )
              .lte("created_at", now.toISOString())
              .order("created_at", { ascending: false })
              .order("id", { ascending: false })
              .range(regOffset, regOffset + pageSize - 1);
            if (error) throw error;
            rs.push(
              ...((data ?? []).map((r) => ({
                ...r,
                extra: { fast_track_type: r.fast_track_type },
              })) as unknown as Registration[]),
            );
            if ((data ?? []).length < pageSize) break;
            regOffset += pageSize;
          }
        };
        await Promise.all([loadPayments(), loadRegistrations()]);
        const map = new Map(rs.map((r) => [r.id, r]));
        if (!mounted.current) break;
        const mapped = all.map((p) => ({ ...p, registration: map.get(p.registration_id) }));
        const fresh = baselineRef.current
          ? mapped.filter((p) => !seenPayments.current.has(p.id))
          : [];
        mapped.forEach((p) => seenPayments.current.add(p.id));
        baselineRef.current = true;
        setRegs(rs);
        setTotal(rs.length);
        setToday(
          rs.filter((r) => new Date(r.created_at) >= day.start && new Date(r.created_at) < day.end)
            .length,
        );
        setYesterday(
          rs.filter(
            (r) =>
              new Date(r.created_at).getTime() >= day.start.getTime() - 86400000 &&
              new Date(r.created_at) < day.start,
          ).length,
        );
        setPayments(mapped);
        setDataError(null);
        setLastSync(new Date());
        setLoading(false);
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
        if (status === "SUBSCRIBED" && baselineRef.current) refresh();
      });
    const poll = setInterval(() => {
      if (AppState.currentState === "active" && !loadingRef.current) void load(true);
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
  const firstDate = useMemo(() => {
    const dates = [...regs.map((r) => r.created_at), ...payments.map((p) => p.created_at)]
      .filter(Boolean)
      .sort();
    return dates[0] ? jakartaDay(new Date(dates[0])) : undefined;
  }, [regs, payments]);
  const selectedLabel = filterLabel(filter, lastSync ?? new Date(), firstDate);
  const filteredRegs = useMemo(
    () => regs.filter((r) => matchesDate(r.created_at, filter, lastSync ?? new Date(), firstDate)),
    [regs, filter, lastSync, firstDate],
  );
  const points = useMemo(
    () => selectionPoints(payments, filter, lastSync ?? new Date(), firstDate),
    [payments, filter, lastSync, firstDate],
  );
  const { fp, income, standard, premium, validCount } = useMemo(() => {
    const fp = payments.filter((p) =>
      matchesDate(p.created_at, filter, lastSync ?? new Date(), firstDate),
    );
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
  }, [payments, filter, lastSync, firstDate]);
  const title =
    tab === "home"
      ? "Ringkasan Anda"
      : tab === "statistics"
        ? "Statistik pendapatan"
        : tab === "valid"
          ? "Pembayaran valid"
          : "Ruang peserta";
  const breakdown = [
    {
      label: "FT Standard",
      amount: fp
        .filter((p) => tier(p.registration) === "FT Standard")
        .reduce((a, p) => a + Number(p.amount || 0), 0),
      color: "#7564ED",
    },
    {
      label: "FT Premium",
      amount: fp
        .filter((p) => tier(p.registration) === "FT Premium")
        .reduce((a, p) => a + Number(p.amount || 0), 0),
      color: "#E9A45E",
    },
    {
      label: "Reguler / lainnya",
      amount: fp
        .filter((p) => !p.registration || tier(p.registration) === "Reguler")
        .reduce((a, p) => a + Number(p.amount || 0), 0),
      color: "#69CDB5",
    },
  ];
  const Section = ({
    title,
    action,
    onPress,
  }: {
    title: string;
    action?: string;
    onPress?: () => void;
  }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 22,
        marginBottom: 12,
      }}
    >
      <Text style={s.cardTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onPress}>
          <Text style={{ fontSize: 11, color: C.blue, fontWeight: "700" }}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
  const body = () => {
    if (loading) return <LoadingCards />;
    if (tab === "home")
      return (
        <>
          <HeroCard
            label="Total pendapatan"
            value={rupiah(income)}
            detail={`${validCount} peserta valid · ${fp.length} transaksi`}
          />
          <Section title="Sekilas aktivitas" />
          <View style={s.metricGrid}>
            <MetricCard
              label="Pendaftar dalam periode"
              value={String(filteredRegs.length)}
              icon="people-outline"
              tint="#4A86E8"
              bg="#EAF2FF"
            />
            <MetricCard
              label="Peserta valid"
              value={String(validCount)}
              icon="checkmark-circle-outline"
              tint="#24AB7B"
              bg="#E5F8F0"
            />
            <MetricCard label="FT Standard valid" value={String(standard)} icon="flash-outline" />
            <MetricCard
              label="FT Premium valid"
              value={String(premium)}
              icon="diamond-outline"
              tint="#D18E32"
              bg="#FFF4DE"
            />
          </View>
          <Section title="Akses cepat" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              {
                title: "Pilih tanggal",
                icon: "calendar-outline",
                action: () => setDateSheet(true),
              },
              {
                title: "Lihat peserta",
                icon: "people-outline",
                action: () => setTab("participants"),
              },
            ].map((item) => (
              <Pressable key={item.title} onPress={item.action} style={s.quickAction}>
                <View style={s.quickIcon}>
                  <Ionicons name={item.icon as any} size={21} color={C.blue} />
                </View>
                <Text style={s.quickLabel}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={14} color={C.muted} />
              </Pressable>
            ))}
          </View>
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>Tren pendapatan</Text>
                <Text style={s.cardSub}>Ringkasan dari periode terpilih</Text>
              </View>
              <Pressable onPress={() => setTab("statistics")}>
                <Ionicons name="arrow-forward-circle-outline" size={26} color={C.blue} />
              </Pressable>
            </View>
            <TrendChart points={points} />
          </View>
          <ListHeading
            title="Pembayaran terbaru"
            sub={`${fp.length} transaksi dalam periode terpilih`}
            empty={!fp.length}
          />
        </>
      );
    if (tab === "statistics")
      return (
        <>
          <HeroCard
            label="Pendapatan dalam periode"
            value={rupiah(income)}
            detail={`${fp.length} transaksi berhasil`}
            icon="stats-chart-outline"
          />
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>Perjalanan pendapatan</Text>
                <Text style={s.cardSub}>
                  {filter.period === "all"
                    ? "Sejak pendaftaran hingga sekarang"
                    : "Sesuai rentang tanggal yang dipilih"}
                </Text>
              </View>
              <View style={s.live}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>LIVE</Text>
              </View>
            </View>
            <TrendChart points={points} />
          </View>
          <View style={[s.metricGrid, { marginTop: 14 }]}>
            <MetricCard
              label="Transaksi berhasil"
              value={String(fp.length)}
              icon="receipt-outline"
            />
            <MetricCard
              label="Rata-rata transaksi"
              value={rupiah(fp.length ? income / fp.length : 0)}
              icon="analytics-outline"
              tint="#24AB7B"
              bg="#E5F8F0"
            />
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Komposisi pendapatan</Text>
            <Text style={s.cardSub}>Berdasarkan kategori peserta</Text>
            <Breakdown rows={breakdown} />
          </View>
          <ListHeading
            title="Riwayat transaksi"
            sub={`${fp.length} transaksi · ${validCount} peserta valid`}
            empty={!fp.length}
          />
        </>
      );
    if (tab === "valid")
      return (
        <>
          <HeroCard
            label="Peserta terverifikasi"
            value={`${validCount} peserta`}
            detail="Pembayaran berhasil dalam periode terpilih"
            icon="shield-checkmark-outline"
          />
          <View style={[s.metricGrid, { marginTop: 16 }]}>
            <MetricCard label="FT Standard" value={String(standard)} icon="flash-outline" />
            <MetricCard
              label="FT Premium"
              value={String(premium)}
              icon="diamond-outline"
              tint="#D18E32"
              bg="#FFF4DE"
            />
          </View>
          <View style={s.infoNote}>
            <Ionicons name="checkmark-circle" size={18} color={C.green} />
            <Text style={s.infoText}>
              Jumlah peserta dihitung unik. Setiap transaksi tetap tercatat di bawah.
            </Text>
          </View>
          <ListHeading
            title="Pembayaran terverifikasi"
            sub={`${fp.length} transaksi · ${selectedLabel}`}
            empty={!fp.length}
          />
        </>
      );
    return (
      <>
        <HeroCard
          label="Pendaftar dalam periode"
          value={`${filteredRegs.length} peserta`}
          detail={`${total} total pendaftar sejak awal`}
          icon="people-outline"
        />
        <View style={[s.metricGrid, { marginTop: 16 }]}>
          <MetricCard
            label="Pendaftar hari ini"
            value={String(today)}
            icon="person-add-outline"
            tint="#4A86E8"
            bg="#EAF2FF"
          />
          <MetricCard
            label="Pendaftar kemarin"
            value={String(yesterday)}
            icon="time-outline"
            tint="#24AB7B"
            bg="#E5F8F0"
          />
        </View>
        <View style={s.infoNote}>
          <Ionicons name="calendar-outline" size={18} color={C.blue} />
          <Text style={s.infoText}>
            Daftar difilter menurut tanggal pendaftaran, sedangkan pendapatan menurut tanggal
            transaksi.
          </Text>
        </View>
        <ListHeading
          title="Daftar peserta"
          sub={`${filteredRegs.length} pendaftar · urutan terbaru`}
          empty={!filteredRegs.length}
        />
      </>
    );
  };
  return (
    <SafeAreaView style={s.page}>
      <ExpoStatusBar style="dark" />
      <FlatList<Payment | Registration>
        data={loading ? [] : tab === "participants" ? filteredRegs : fp}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: C.white,
              paddingHorizontal: 17,
              borderRadius: 18,
              marginBottom: 7,
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
              <Pressable style={s.notice} onPress={() => setNotice(null)} accessibilityRole="button" accessibilityLabel="Tutup notifikasi pembayaran">
                <View style={s.noticeIcon}>
                  <Ionicons name="wallet" size={21} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.noticeTitle}>Pembayaran baru masuk</Text>
                  <Text style={s.noticeBody}>{notice}</Text>
                </View>
              </Pressable>
            )}
            <View style={s.header}>
              <View style={{ flex: 1 }}>
                <Text style={s.headerGreeting}>
                  {tab === "home" ? "Selamat datang kembali 👋" : "PRESTASI KITA ADMIN"}
                </Text>
                <Text style={s.headerTitle}>{title}</Text>
                <Text style={{ color: C.muted, fontSize: 10 }}>Versi {Constants.expoConfig?.version}</Text>
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
              <Pressable
                accessibilityLabel="Pengaturan notifikasi"
                style={s.headerBtn}
                onPress={() => setSettingsOpen(true)}
              >
                <Ionicons
                  name={sound ? "notifications-outline" : "notifications-off-outline"}
                  size={21}
                  color={C.navy}
                />
                <View style={s.notificationDot} />
              </Pressable>
            </View>
            <FilterBar
              filter={filter}
              onChange={setFilter}
              onDates={() => setDateSheet(true)}
              label={selectedLabel}
            />
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
        <View onTouchEnd={() => setSettingsOpen(false)} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.35)" }}>
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
          </View>
        </View>
      </Modal>
      <DateFilterSheet
        visible={dateSheet}
        onClose={() => setDateSheet(false)}
        onApply={setFilter}
        filter={filter}
        firstDate={firstDate}
      />
      <BottomNav tab={tab} onTab={setTab} onFilter={() => setDateSheet(true)} />
    </SafeAreaView>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [init, setInit] = useState(true);
  const [showCover, setShowCover] = useState(false);
  useEffect(() => {
    Promise.all([supabase.auth.getSession(), AsyncStorage.getItem("prestasi-kita-cover-seen")])
      .then(async ([{ data }, coverSeen]) => {
        setShowCover(coverSeen !== "true");
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
      })
      .catch(() => {
        setSession(null);
        setInit(false);
      });
    const { data } = supabase.auth.onAuthStateChange((_e, n) => {
      if (!n) setSession(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  if (init) return <Splash />;
  if (showCover)
    return (
      <Cover
        loading={false}
        onContinue={() => {
          void AsyncStorage.setItem("prestasi-kita-cover-seen", "true");
          setShowCover(false);
        }}
      />
    );
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
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickAction: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { flex: 1, fontSize: 11, fontWeight: "700", color: C.navy },
  infoNote: {
    marginTop: 16,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#EEEDFC",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  infoText: { flex: 1, color: C.muted, fontSize: 11, lineHeight: 17 },
  headerGreeting: { fontSize: 12, color: C.muted, marginBottom: 5 },
  notificationDot: {
    position: "absolute",
    right: 11,
    top: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F4A78E",
  },
  page: { flex: 1, backgroundColor: C.page },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 14 : 18,
    paddingBottom: 120,
  },
  logo: { width: "100%", height: "100%", resizeMode: "cover" },
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
    marginBottom: 0,
  },
  headerTitle: { marginTop: 5, color: C.navy, fontSize: 26, fontWeight: "800" },
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
  card: {
    marginTop: 18,
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
  cardTitle: { color: C.navy, fontSize: 15, fontWeight: "800" },
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
  row: {
    minHeight: 72,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0,
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
  rowRight: { maxWidth: 125, alignItems: "flex-end" },
  income: { marginBottom: 5, color: C.green, fontSize: 12, fontWeight: "800" },
  badge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9 },
  premium: { backgroundColor: C.goldSoft },
  standard: { backgroundColor: C.soft },
  regular: { backgroundColor: "#F1F3F6" },
  badgeText: { fontSize: 10, fontWeight: "900" },
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
  empty: { height: 160, alignItems: "center", justifyContent: "center" },
  emptyText: { marginTop: 9, color: C.muted, fontSize: 11, fontWeight: "700" },
});
