import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Path,
  Line,
  Rect,
} from "react-native-svg";
import { DateFilter, dateLabel, filterLabel, jakartaDay, selectionRange } from "../lib/finance";
export const theme = {
  primary: "#6554F5",
  navy: "#172743",
  muted: "#7D8599",
  page: "#F7F8FD",
  border: "#EBEDF7",
  green: "#20AB7C",
};
const money = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
export function Cover({ loading, onContinue }: { loading: boolean; onContinue?: () => void }) {
  const compact = Dimensions.get("window").height < 700;
  return (
    <LinearGradient colors={["#E8F0FF", "#F2ECFF", "#FCFCFF"]} style={u.cover}>
      <View style={u.coverBrand}>
        <Image
          source={require("../assets/prestasi-kita-icon.png")}
          style={{ width: 38, height: 38, borderRadius: 12 }}
        />
        <Text style={u.brand}>PRESTASI KITA</Text>
      </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={u.coverEyebrow}>RUANG KENDALI ANDA</Text>
        <Text style={[u.coverTitle, compact && { fontSize: 30, lineHeight: 36 }]}>
          Semua prestasi.{"\n"}
          <Text style={{ color: theme.primary }}>Satu kendali.</Text>
        </Text>
        <Text style={u.coverSub}>
          Pantau peserta dan pendapatan.{"\n"}Lebih teratur, lebih mudah.
        </Text>
        <View style={{ alignItems: "center", marginVertical: compact ? 14 : 24 }}>
          <Svg width={compact ? 260 : 300} height={compact ? 180 : 225} viewBox="0 0 300 225">
            <Defs>
              <SvgGradient id="cover" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#9586FF" />
                <Stop offset="1" stopColor="#4759D8" />
              </SvgGradient>
            </Defs>
            <Circle cx="151" cy="116" r="101" fill="#E1DEFF" />
            <Rect x="33" y="32" width="244" height="158" rx="24" fill="white" />
            <Rect x="49" y="51" width="212" height="61" rx="15" fill="url(#cover)" />
            <Rect x="62" y="64" width="69" height="5" rx="2" fill="#DCD5FF" />
            <Rect x="62" y="80" width="108" height="12" rx="4" fill="white" />
            <Circle cx="231" cy="82" r="15" fill="#FFFFFF" fillOpacity=".2" />
            <Path
              d="M56 164 L86 148 L113 155 L145 130 L177 143 L207 123 L251 119"
              fill="none"
              stroke="#7564EE"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Rect x="5" y="148" width="86" height="51" rx="14" fill="#172743" />
            <Circle cx="23" cy="173" r="8" fill="#5ED2B4" />
            <Path d="M19 173 l3 3 l5 -6" stroke="white" strokeWidth="2" fill="none" />
            <Rect x="38" y="163" width="37" height="5" rx="2" fill="#B5BFDC" />
            <Rect x="38" y="175" width="29" height="8" rx="3" fill="white" />
            <Circle cx="260" cy="40" r="23" fill="#FFCF7E" />
            <Path
              d="M251 40 l7 7 l12 -14"
              stroke="white"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <Circle cx="282" cy="148" r="7" fill="#C3B9FF" />
          </Svg>
        </View>
      </View>
      <View style={u.coverFooter}>
        {loading ? (
          <>
            <ActivityIndicator color={theme.primary} />
            <Text style={u.coverLoading}>Menyiapkan ruang kendali Anda…</Text>
          </>
        ) : (
          <Pressable accessibilityRole="button" onPress={onContinue}>
            <LinearGradient colors={["#263750", "#14233E"]} style={u.cta}>
              <Text style={u.ctaText}>Mulai sekarang</Text>
              <Ionicons name="arrow-forward" size={19} color="white" />
            </LinearGradient>
          </Pressable>
        )}
        <Text style={u.footerText}>Prestasi Kita · Admin Mobile</Text>
      </View>
    </LinearGradient>
  );
}
export function HeroCard({
  label,
  value,
  detail,
  icon = "wallet-outline",
}: {
  label: string;
  value: string;
  detail: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <LinearGradient
      colors={["#4254BD", "#6554E8", "#9B75EC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={u.hero}
    >
      <View style={u.heroBubble} />
      <View style={[u.heroBubble, { right: 100, top: 120, width: 150, height: 150 }]} />
      <View style={u.heroTop}>
        <Text style={u.heroLabel}>{label}</Text>
        <View style={u.heroIcon}>
          <Ionicons name={icon} size={22} color="white" />
        </View>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={u.heroValue}>
        {value}
      </Text>
      <View style={u.heroBottom}>
        <View style={u.heroDot} />
        <Text style={u.heroDetail}>{detail}</Text>
        <Ionicons name="trending-up" color="#DDE0FF" size={22} />
      </View>
    </LinearGradient>
  );
}
export function MetricCard({
  label,
  value,
  icon,
  tint = "#6554F5",
  bg = "#EDE9FF",
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
  bg?: string;
}) {
  return (
    <LinearGradient
      colors={["#FFFFFF", bg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={u.metric}
    >
      <View style={[u.metricIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={19} color={tint} />
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={u.metricValue}>
        {value}
      </Text>
      <Text style={u.metricLabel}>{label}</Text>
    </LinearGradient>
  );
}
export function FilterBar({
  filter,
  onChange,
  onDates,
  label,
}: {
  filter: DateFilter;
  onChange: (f: DateFilter) => void;
  onDates: () => void;
  label: string;
}) {
  const presets = [
    ["all", "Semua Hari"],
    ["day", "Hari ini"],
    ["week", "Minggu ini"],
    ["month", "Bulan ini"],
  ] as const;
  return (
    <View style={u.filters}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7 }}
        >
          {presets.map(([period, title]) => (
            <Pressable
              key={period}
              accessibilityRole="button"
              accessibilityState={{ selected: filter.period === period }}
              onPress={() => onChange({ period })}
              style={[u.pill, filter.period === period && u.pillActive]}
            >
              <Text style={[u.pillText, filter.period === period && { color: "white" }]}>
                {title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          accessibilityLabel="Pilih rentang tanggal"
          accessibilityRole="button"
          onPress={onDates}
          style={[u.calendarButton, filter.period === "custom" && { backgroundColor: "#EAE5FF" }]}
        >
          <Ionicons name="calendar-outline" color={theme.primary} size={20} />
        </Pressable>
      </View>
      <Pressable
        onPress={onDates}
        style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 }}
      >
        <Ionicons name="time-outline" size={12} color={theme.muted} />
        <Text style={{ flex: 1, fontSize: 11, color: theme.muted }}>{label} · WIB</Text>
        <Ionicons name="chevron-down" size={12} color={theme.muted} />
      </Pressable>
    </View>
  );
}
export function DateFilterSheet({
  visible,
  onClose,
  onApply,
  filter,
  firstDate,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (f: DateFilter) => void;
  filter: DateFilter;
  firstDate?: string;
}) {
  const today = jakartaDay();
  const [from, setFrom] = useState(today),
    [to, setTo] = useState(today),
    [editing, setEditing] = useState<"from" | "to" | null>(null);
  useEffect(() => {
    if (visible) {
      const range = selectionRange(filter, new Date(), firstDate);
      setFrom(
        filter.period === "custom"
          ? filter.from!
          : filter.period === "all"
            ? (firstDate ?? today)
            : jakartaDay(range.start),
      );
      setTo(filter.period === "custom" ? filter.to! : today);
      setEditing(null);
    }
  }, [visible]);
  const apply = () => {
    try {
      selectionRange({ period: "custom", from, to });
      if (to > today) throw Error("Tanggal akhir tidak boleh melewati hari ini.");
      onApply({ period: "custom", from, to });
      onClose();
    } catch (e) {
      Alert.alert("Periksa tanggal", (e as Error).message);
    }
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={u.backdrop}>
        <Pressable
          accessibilityLabel="Tutup filter tanggal"
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <View style={u.sheet}>
          <View style={u.handle} />
          <View style={u.sheetTitleRow}>
            <View>
              <Text style={u.sheetTitle}>Periode statistik</Text>
              <Text style={u.sheetSub}>Pilih hari yang ingin Anda lihat.</Text>
            </View>
            <Pressable accessibilityLabel="Tutup" onPress={onClose} style={u.closeButton}>
              <Ionicons name="close" size={22} color={theme.navy} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              onApply({ period: "all" });
              onClose();
            }}
            style={u.allDate}
          >
            <Ionicons name="infinite" color={theme.primary} size={24} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: theme.navy }}>Semua Hari</Text>
              <Text style={u.sheetSub}>
                {firstDate ? `Sejak ${dateLabel(firstDate)}` : "Sejak pendaftaran pertama"} hingga
                sekarang
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={theme.primary} />
          </Pressable>
          <View style={{ flexDirection: "row", gap: 12, marginVertical: 20 }}>
            {(["from", "to"] as const).map((field) => (
              <Pressable
                accessibilityLabel={
                  field === "from" ? "Pilih tanggal mulai" : "Pilih tanggal akhir"
                }
                key={field}
                onPress={() => setEditing(field)}
                style={[u.dateField, editing === field && { borderColor: theme.primary }]}
              >
                <Text style={u.dateCaption}>
                  {field === "from" ? "Tanggal mulai" : "Tanggal akhir"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Ionicons name="calendar-outline" color={theme.primary} size={16} />
                  <Text style={u.dateValue}>{dateLabel(field === "from" ? from : to)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
          {editing && (
            <DateTimePicker
              value={new Date(`${editing === "from" ? from : to}T12:00:00`)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date(`${today}T23:59:59`)}
              onChange={(event, date) => {
                if (Platform.OS === "android") setEditing(null);
                if (event.type === "set" && date) {
                  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                  (editing === "from" ? setFrom : setTo)(key);
                }
              }}
            />
          )}
          <Text style={u.sheetSub}>Tanggal akhir ikut dihitung. Semua waktu menggunakan WIB.</Text>
          <Pressable accessibilityRole="button" onPress={apply}>
            <LinearGradient colors={["#7564F5", "#5260DB"]} style={[u.cta, { marginTop: 20 }]}>
              <Text style={u.ctaText}>Terapkan filter</Text>
              <Ionicons name="checkmark" size={20} color="white" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
export function TrendChart({ points }: { points: { label: string; total: number }[] }) {
  const [width, setWidth] = useState(Math.max(260, Dimensions.get("window").width - 80));
  const height = 150,
    pad = 8,
    max = Math.max(...points.map((p) => p.total), 1);
  const coords = points.map((p, i) => ({
    x: pad + (i * (width - pad * 2)) / Math.max(points.length - 1, 1),
    y: height - 12 - (p.total / max) * (height - 30),
  }));
  const line = coords.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const area = coords.length
    ? `${line} L${coords[coords.length - 1].x},${height} L${pad},${height} Z`
    : "";
  const peak = Math.max(...points.map((p) => p.total), 0);
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={u.chartSummary}>
        <Text style={u.chartDescription}>
          {points.length > 31 ? "Tren pendapatan" : "Pendapatan per periode"}
        </Text>
        <Text style={u.chartPeak}>Tertinggi {money(peak)}</Text>
      </View>
      <Svg width="100%" height={height + 10} viewBox={`0 0 ${width} ${height + 10}`}>
        <Defs>
          <SvgGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8F7AF7" stopOpacity=".36" />
            <Stop offset="1" stopColor="#8F7AF7" stopOpacity="0" />
          </SvgGradient>
        </Defs>
        {[0.25, 0.5, 0.75, 1].map((n) => (
          <Line
            key={n}
            x1={0}
            x2={width}
            y1={height * n}
            y2={height * n}
            stroke="#EBEDF8"
            strokeDasharray="3 5"
          />
        ))}
        <Path d={area} fill="url(#area)" />
        <Path
          d={line}
          fill="none"
          stroke="#7664ED"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords
          .filter((_, i) => points.length <= 8 || i === points.length - 1)
          .map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill="#7564EE" stroke="white" strokeWidth={2} />
          ))}
      </Svg>
      <View style={u.chartLabels}>
        {[0, Math.floor((points.length - 1) / 2), points.length - 1]
          .filter((v, i, a) => v >= 0 && a.indexOf(v) === i)
          .map((i) => (
            <Text key={i} style={u.chartLabel}>
              {points[i]?.label}
            </Text>
          ))}
      </View>
    </View>
  );
}
export function Breakdown({ rows }: { rows: { label: string; amount: number; color: string }[] }) {
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  let offset = 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 18, marginTop: 8 }}>
      <View style={{ width: 112, height: 112 }}>
        <Svg width={112} height={112} viewBox="0 0 112 112">
          <Circle cx={56} cy={56} r={43} fill="none" stroke="#EEF0F8" strokeWidth={12} />
          {rows.map((row) => {
            const portion = total ? row.amount / total : 0;
            const node = (
              <Circle
                key={row.label}
                cx={56}
                cy={56}
                r={43}
                fill="none"
                stroke={row.color}
                strokeWidth={12}
                strokeDasharray={`${portion * 270.18} ${270.18}`}
                strokeDashoffset={-offset * 270.18}
                rotation={-90}
                origin="56,56"
              />
            );
            offset += portion;
            return node;
          })}
        </Svg>
        <View style={u.donutLabel}>
          <Text style={{ fontSize: 17, color: theme.navy, fontWeight: "800" }}>
            {total ? "100%" : "0%"}
          </Text>
          <Text style={{ fontSize: 10, color: theme.muted }}>Pendapatan</Text>
        </View>
      </View>
      <View style={{ flex: 1, gap: 12 }}>
        {rows.map((row) => (
          <View key={row.label}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ height: 7, width: 7, borderRadius: 4, backgroundColor: row.color }} />
              <Text style={{ flex: 1, fontSize: 12, color: theme.muted }}>{row.label}</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: theme.navy }}>
                {total ? Math.round((row.amount / total) * 100) : 0}%
              </Text>
            </View>
            <Text
              style={{
                marginLeft: 13,
                fontSize: 12,
                color: theme.navy,
                fontWeight: "600",
                marginTop: 2,
              }}
            >
              {money(row.amount)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
export function BottomNav({
  tab,
  onTab,
  onFilter,
}: {
  tab: string;
  onTab: (tab: any) => void;
  onFilter: () => void;
}) {
  const items = [
    ["home", "home-outline", "Beranda"],
    ["statistics", "stats-chart-outline", "Statistik"],
    ["filter", "options", "Filter"],
    ["valid", "shield-checkmark-outline", "Valid"],
    ["participants", "people-outline", "Peserta"],
  ] as const;
  return (
    <View style={u.nav}>
      {items.map(([key, icon, label]) =>
        key === "filter" ? (
          <Pressable
            key={key}
            accessibilityLabel="Buka filter tanggal"
            accessibilityRole="button"
            onPress={onFilter}
            style={u.navCenter}
          >
            <LinearGradient colors={["#8B72FD", "#5B51DF"]} style={u.navFilter}>
              <Ionicons name={icon} size={26} color="white" />
            </LinearGradient>
            <Text style={u.navCaption}>Filter</Text>
          </Pressable>
        ) : (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            onPress={() => onTab(key)}
            style={u.navItem}
          >
            <Ionicons name={icon} size={22} color={tab === key ? theme.primary : "#A0A7B8"} />
            <Text
              style={[u.navCaption, tab === key && { color: theme.primary, fontWeight: "800" }]}
            >
              {label}
            </Text>
            {tab === key && <View style={u.navActiveDot} />}
          </Pressable>
        ),
      )}
    </View>
  );
}
export function LoadingCards() {
  return (
    <View accessibilityLabel="Memuat data" style={{ gap: 14, marginTop: 12 }}>
      <LinearGradient
        colors={["#E4E5FC", "#F0ECFF"]}
        style={{ height: 185, borderRadius: 26, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator color={theme.primary} />
        <Text style={{ color: theme.muted, fontSize: 12, marginTop: 10 }}>
          Menyusun ringkasan Anda…
        </Text>
      </LinearGradient>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[1, 2].map((i) => (
          <View
            key={i}
            style={{ height: 110, flex: 1, borderRadius: 22, backgroundColor: "#ECEEF8" }}
          />
        ))}
      </View>
    </View>
  );
}
const u = StyleSheet.create({
  cover: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  coverBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { color: theme.navy, fontSize: 12, fontWeight: "800", letterSpacing: 1.4 },
  coverEyebrow: {
    color: theme.muted,
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 36,
    lineHeight: 43,
    fontWeight: "900",
    color: theme.navy,
    letterSpacing: -1.3,
  },
  coverSub: { fontSize: 14, color: theme.muted, lineHeight: 22, marginTop: 14 },
  coverFooter: { gap: 10 },
  coverLoading: { color: theme.muted, textAlign: "center", fontSize: 12 },
  footerText: { color: "#939BAF", textAlign: "center", fontSize: 10, marginTop: 10 },
  cta: {
    minHeight: 54,
    borderRadius: 19,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  ctaText: { color: "white", fontSize: 14, fontWeight: "700" },
  hero: { padding: 22, borderRadius: 27, overflow: "hidden", minHeight: 188 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroLabel: { fontSize: 13, color: "#E1E2FF", fontWeight: "600" },
  heroIcon: {
    width: 37,
    height: 37,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF22",
  },
  heroValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "white",
    marginTop: 13,
    letterSpacing: -0.8,
  },
  heroBottom: { flexDirection: "row", gap: 7, alignItems: "center", marginTop: 20 },
  heroDetail: { flex: 1, color: "#E6E3FF", fontSize: 11, fontWeight: "500" },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ABF2D2" },
  heroBubble: {
    position: "absolute",
    right: -50,
    top: -80,
    width: 230,
    height: 230,
    borderRadius: 120,
    backgroundColor: "#FFFFFF0D",
  },
  metric: {
    width: "47%",
    flexGrow: 1,
    padding: 16,
    borderRadius: 22,
    borderColor: "#EAEAF5",
    borderWidth: 1,
    minHeight: 119,
  },
  metricIcon: {
    width: 33,
    height: 33,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: { fontSize: 23, color: theme.navy, fontWeight: "800", marginTop: 9 },
  metricLabel: { fontSize: 11, color: theme.muted, marginTop: 4 },
  filters: { marginVertical: 16 },
  pill: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#ECEEF8",
  },
  pillActive: { backgroundColor: theme.primary },
  pillText: { fontSize: 11, fontWeight: "700", color: theme.muted },
  calendarButton: {
    width: 42,
    height: 40,
    borderRadius: 14,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  backdrop: { flex: 1, backgroundColor: "#14213D66", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  handle: {
    height: 4,
    width: 36,
    backgroundColor: "#DEE1ED",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 22,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  sheetTitle: { fontSize: 21, color: theme.navy, fontWeight: "800" },
  sheetSub: { fontSize: 11, color: theme.muted, lineHeight: 17, marginTop: 4 },
  closeButton: { padding: 8, backgroundColor: "#F5F5FC", borderRadius: 12 },
  allDate: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F0ECFF",
    alignItems: "center",
  },
  dateField: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderColor: theme.border,
    borderWidth: 1,
    backgroundColor: "#FAFAFF",
  },
  dateCaption: { fontSize: 11, color: theme.muted, marginBottom: 10 },
  dateValue: { fontSize: 12, fontWeight: "600", color: theme.navy },
  chartSummary: {
    marginTop: 4,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  chartDescription: { fontSize: 11, color: theme.muted },
  chartPeak: { fontSize: 10, color: theme.primary, fontWeight: "600" },
  chartLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  chartLabel: { fontSize: 10, color: theme.muted },
  donutLabel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  nav: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 24 : 14,
    height: 78,
    borderRadius: 26,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    shadowColor: "#7164A6",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#ECECF5",
  },
  navItem: { flex: 1, height: 65, alignItems: "center", justifyContent: "center", gap: 5 },
  navCaption: { fontSize: 9, color: "#949CAF", fontWeight: "600" },
  navCenter: { flex: 1, alignItems: "center", gap: 5, marginTop: -22 },
  navFilter: {
    width: 51,
    height: 51,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "white",
  },
  navActiveDot: {
    position: "absolute",
    bottom: 1,
    width: 4,
    height: 4,
    borderRadius: 3,
    backgroundColor: theme.primary,
  },
});
