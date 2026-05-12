import {
    FontAwesome5,
    Ionicons,
    MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../supabase";

const HIJAU = "#2C7A6E";
const KUNING = "#E8C840";
const MERAH = "#D9534F";
const MERAH_LIGHT = "#FDEAEA";

// ─────────────────────────────────────────────────────────────────────────────
const shiftJam = (s: string) => {
  const up = (s ?? "").toUpperCase();
  if (up === "AP" || up === "PAGI") return "07.00 - 14.00";
  if (up === "S" || up === "SIANG") return "14.00 - 21.00";
  if (up === "S1" || up === "MALAM") return "12.00 - 21.00";
  if (up === "B") return "09.00 - 16.00";
  return "";
};

const formatTgl = (tgl: string) => {
  if (!tgl) return "";
  const d = new Date(tgl);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

// FIX #1: helper normalize status — "Menunggu persetujuan" → "menunggu"
const normalizeStatus = (s: string) => {
  const lower = (s ?? "").toLowerCase().trim();
  if (lower.startsWith("menunggu")) return "menunggu";
  if (lower.startsWith("disetujui")) return "disetujui";
  if (lower.startsWith("ditolak")) return "ditolak";
  return lower;
};

type Pengajuan = {
  id: number;
  nama_perawat: string;
  jenis_izin: string;
  tanggal_jadwal: string;
  shift: string;
  poli: string;
  keterangan: string;
  surat_sakit: string | null;
  status: string;
  status_admin: string;
  status_direktur: string;
  created_at: string;
};

type ReqJadwal = {
  id: number;
  nama_perawat: string;
  tanggal: string;
  shift: string;
  poli: string;
  status: string;
  status_admin: string;
  created_at: string;
};

// ── Badge pojok kanan atas ────────────────────────────────────────────────────
const Badge = ({ status }: { status: string }) => {
  const s = normalizeStatus(status);
  return (
    <View
      style={[
        bdg.wrap,
        s === "disetujui"
          ? bdg.hijau
          : s === "ditolak"
            ? bdg.merah
            : bdg.kuning,
      ]}
    >
      <Text
        style={[
          bdg.txt,
          s === "disetujui"
            ? bdg.hijauTxt
            : s === "ditolak"
              ? bdg.merahTxt
              : bdg.kuningTxt,
        ]}
      >
        {s === "disetujui"
          ? "Disetujui"
          : s === "ditolak"
            ? "Ditolak"
            : "Menunggu"}
      </Text>
    </View>
  );
};
const bdg = StyleSheet.create({
  wrap: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  txt: { fontSize: 12, fontWeight: "700" },
  hijau: { backgroundColor: "#E6F4F1" },
  hijauTxt: { color: HIJAU },
  merah: { backgroundColor: MERAH_LIGHT },
  merahTxt: { color: MERAH },
  kuning: { backgroundColor: "#FFF8E1" },
  kuningTxt: { color: "#B8860B" },
});

// ── Kotak approval ────────────────────────────────────────────────────────────
const AprBox = ({ label, status }: { label: string; status: string }) => {
  const s = normalizeStatus(status);
  const dotClr = s === "disetujui" ? HIJAU : s === "ditolak" ? MERAH : KUNING;
  const lbl =
    s === "disetujui"
      ? "Disetujui"
      : s === "ditolak"
        ? "Ditolak"
        : "Menunggu persetujuan";
  return (
    <View style={apr.box}>
      <Text style={apr.label}>{label}</Text>
      <View style={apr.row}>
        <View style={[apr.dot, { backgroundColor: dotClr }]} />
        <Text
          style={[apr.status, { color: s === "menunggu" ? "#B8860B" : dotClr }]}
        >
          {lbl}
        </Text>
      </View>
    </View>
  );
};
const apr = StyleSheet.create({
  box: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 10,
  },
  label: { fontSize: 11, fontWeight: "700", color: "#111", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  status: { fontSize: 11, fontWeight: "600" },
});

// ── Validasi request ──────────────────────────────────────────────────────────
const validateReq = async (item: ReqJadwal) => {
  const { data: shiftRows } = await supabase
    .from("jadwal")
    .select("id, nama_perawat")
    .eq("tanggal", item.tanggal)
    .eq("shift", item.shift);
  const jumlah = (shiftRows ?? []).length;
  const sudahDiShift = (shiftRows ?? []).some(
    (r: any) => r.nama_perawat === item.nama_perawat,
  );
  if (jumlah >= 2 && !sudahDiShift)
    return { ok: false, penuh: true, bentrok: false, lama: null };
  const { data: lama } = await supabase
    .from("jadwal")
    .select("id, shift")
    .eq("tanggal", item.tanggal)
    .eq("nama_perawat", item.nama_perawat)
    .maybeSingle();
  if (lama && lama.shift !== item.shift)
    return { ok: false, penuh: false, bentrok: true, lama };
  return { ok: true, penuh: false, bentrok: false, lama: lama ?? null };
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPengajuanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tab, setTab] = useState<"perubahan" | "request">("perubahan");
  const [listP, setListP] = useState<Pengajuan[]>([]);
  const [listR, setListR] = useState<ReqJadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const loadP = useCallback(async () => {
    const { data } = await supabase
      .from("pengajuan")
      .select("*")
      .order("created_at", { ascending: false });
    setListP(data ?? []);
  }, []);

  const loadR = useCallback(async () => {
    const { data } = await supabase
      .from("request_jadwal")
      .select("*")
      .order("created_at", { ascending: false });
    setListR(data ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadP(), loadR()]);
    setLoading(false);
    setRefresh(false);
  }, [loadP, loadR]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Urutkan: Menunggu dulu, lalu yang sudah diproses
  const sorted = <T extends { status: string }>(arr: T[]) =>
    [...arr].sort(
      (a, b) =>
        (normalizeStatus(a.status) === "menunggu" ? 0 : 1) -
        (normalizeStatus(b.status) === "menunggu" ? 0 : 1),
    );

  // ── Approve / Tolak Perubahan ─────────────────────────────────────────────
  const actPerubahan = async (
    item: Pengajuan,
    act: "Disetujui" | "Ditolak",
  ) => {
    setBusy(item.id);
    try {
      // FIX #1: normalize status_direktur sebelum dibandingkan
      const dir = normalizeStatus(item.status_direktur);
      let overall = "Menunggu";
      if (act === "Ditolak" || dir === "ditolak") overall = "Ditolak";
      else if (act === "Disetujui" && dir === "disetujui")
        overall = "Disetujui";

      await supabase
        .from("pengajuan")
        .update({ status_admin: act, status: overall })
        .eq("id", item.id);

      if (overall === "Disetujui") {
        Alert.alert(
          "✅ Disetujui",
          "Kedua pihak setuju. Edit jadwal sekarang?",
          [
            { text: "Nanti" },
            {
              text: "Edit Jadwal",
              onPress: () =>
                router.push({
                  pathname: "/admin-edit-jadwal" as any,
                  params: {
                    nama_perawat: item.nama_perawat,
                    tanggal: item.tanggal_jadwal,
                    shift: item.shift,
                    poli: item.poli,
                  },
                }),
            },
          ],
        );
      } else {
        Alert.alert(
          act === "Disetujui" ? "✅ Disetujui" : "❌ Ditolak",
          act === "Disetujui"
            ? "Menunggu persetujuan Direktur."
            : "Pengajuan telah ditolak.",
        );
      }
      await loadP();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(null);
    }
  };

  // ── Approve / Tolak Request ───────────────────────────────────────────────
  const actRequest = async (item: ReqJadwal, act: "Disetujui" | "Ditolak") => {
    if (act === "Ditolak") {
      setBusy(item.id);
      await supabase
        .from("request_jadwal")
        .update({ status_admin: "Ditolak", status: "Ditolak" })
        .eq("id", item.id);
      await loadR();
      setBusy(null);
      return;
    }
    setBusy(item.id);
    const v = await validateReq(item);
    setBusy(null);
    if (v.penuh) {
      Alert.alert(
        "❌ Shift Penuh",
        `Shift ${item.shift} tanggal ${formatTgl(item.tanggal)} sudah 2 perawat.`,
      );
      return;
    }
    if (v.bentrok) {
      Alert.alert(
        "⚠️ Jadwal Bentrok",
        `${item.nama_perawat} sudah punya Shift ${v.lama?.shift} di tanggal yang sama. Ganti shift lama?`,
        [
          { text: "Batal" },
          { text: "Ya, Ganti", onPress: () => doApprove(item, v.lama?.id) },
        ],
      );
      return;
    }
    doApprove(item, v.lama?.id ?? undefined);
  };

  const doApprove = async (item: ReqJadwal, lamaId?: number) => {
    setBusy(item.id);
    try {
      await supabase
        .from("request_jadwal")
        .update({ status_admin: "Disetujui", status: "Disetujui" })
        .eq("id", item.id);
      if (lamaId) {
        await supabase
          .from("jadwal")
          .update({ shift: item.shift, poli: item.poli })
          .eq("id", lamaId);
      } else {
        await supabase.from("jadwal").insert({
          nama_perawat: item.nama_perawat,
          tanggal: item.tanggal,
          shift: item.shift,
          poli: item.poli,
        });
      }
      Alert.alert(
        "✅ Berhasil",
        `Jadwal ${item.nama_perawat} berhasil diperbarui.`,
      );
      await loadR();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(null);
    }
  };

  // ── Card Perubahan ────────────────────────────────────────────────────────
  const CardPerubahan = ({ item }: { item: Pengajuan }) => {
    // FIX #1: pakai normalizeStatus bukan hardcode "menunggu"
    const menunggu = normalizeStatus(item.status_admin) === "menunggu";
    const isLoading = busy === item.id;

    // FIX #2: normalize jenis izin — "Izin/Cuti" → "Izin Lainnya" untuk tampilan
    const jenisLabel = (() => {
      const j = (item.jenis_izin ?? "").toLowerCase();
      if (j.includes("sakit")) return "Izin Sakit";
      if (j.includes("cuti") || j.includes("lain")) return "Izin Lainnya";
      return item.jenis_izin;
    })();

    const punya_surat = item.surat_sakit && item.surat_sakit !== "-";
    const punya_ket = item.keterangan && item.keterangan !== "-";

    return (
      <View style={s.card}>
        {/* Baris nama + badge */}
        <View style={s.rowBetween}>
          <Text style={s.nama}>{item.nama_perawat}</Text>
          <Badge status={item.status} />
        </View>

        {/* FIX #3: Garis pemisah bawah nama */}
        <View style={s.divider} />

        {/* Jenis izin */}
        <Text style={s.jenisIzin}>{jenisLabel}</Text>

        {/* Info jadwal */}
        <View style={s.rowGap}>
          <Ionicons name="time-outline" size={13} color="#777" />
          <Text style={s.infoTxt}>
            {formatTgl(item.tanggal_jadwal)} | {item.shift} - {item.poli}
            {shiftJam(item.shift) ? ` | ${shiftJam(item.shift)}` : ""}
          </Text>
        </View>

        {/* FIX #3: Garis pemisah bawah info jadwal */}
        <View style={s.divider} />

        {/* Kotak surat / keterangan */}
        {punya_surat ? (
          <View style={s.docBox}>
            <Ionicons name="document-text-outline" size={14} color="#777" />
            <Text style={s.docTxt}>Surat dokter</Text>
          </View>
        ) : punya_ket ? (
          <View style={s.docBox}>
            <Ionicons name="chatbox-ellipses-outline" size={14} color="#777" />
            <Text style={s.docTxt}>{item.keterangan}</Text>
          </View>
        ) : null}

        {/* 2 kotak approval */}
        <View style={s.aprRow}>
          <AprBox label="Kepala Perawat" status={item.status_admin} />
          <AprBox label="Direktur" status={item.status_direktur} />
        </View>

        {/* Tombol — FIX #1: sekarang muncul karena normalizeStatus */}
        {menunggu && (
          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.btnSetuju, isLoading && s.disabled]}
              onPress={() => actPerubahan(item, "Disetujui")}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.btnSetujuTxt}>Setujui</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnTolak, isLoading && s.disabled]}
              onPress={() => actPerubahan(item, "Ditolak")}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={s.btnTolakTxt}>Tolak</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ── Card Request ──────────────────────────────────────────────────────────
  const CardRequest = ({ item }: { item: ReqJadwal }) => {
    // FIX #1: pakai normalizeStatus
    const menunggu = normalizeStatus(item.status_admin) === "menunggu";
    const isLoading = busy === item.id;
    return (
      <View style={s.card}>
        {/* Nama + badge */}
        <View style={s.rowBetween}>
          <Text style={s.nama}>{item.nama_perawat}</Text>
          <Badge status={item.status} />
        </View>

        {/* FIX #3: Garis pemisah */}
        <View style={s.divider} />

        {/* Info jadwal */}
        <View style={s.rowGap}>
          <Ionicons name="time-outline" size={13} color="#777" />
          <Text style={s.infoTxt}>
            {formatTgl(item.tanggal)} | {item.shift} - {item.poli}
            {shiftJam(item.shift) ? ` | ${shiftJam(item.shift)}` : ""}
          </Text>
        </View>

        {/* FIX #3: Garis pemisah */}
        <View style={s.divider} />

        {/* 1 kotak approval */}
        <View style={s.aprRow}>
          <AprBox label="Kepala Perawat" status={item.status_admin} />
        </View>

        {/* Tombol — FIX #1 */}
        {menunggu && (
          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.btnSetuju, isLoading && s.disabled]}
              onPress={() => actRequest(item, "Disetujui")}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.btnSetujuTxt}>Setujui</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnTolak, isLoading && s.disabled]}
              onPress={() => actRequest(item, "Ditolak")}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={s.btnTolakTxt}>Tolak</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: "#F0F0F0" }}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* STICKY TOP */}
      <View style={[s.stickyTop, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Pengajuan Perawat</Text>
        </View>

        <View style={s.tabBar}>
          <TouchableOpacity
            style={[s.tabBtn, tab === "perubahan" && s.tabActive]}
            onPress={() => setTab("perubahan")}
          >
            <Text style={[s.tabTxt, tab === "perubahan" && s.tabTxtActive]}>
              Perubahan Jadwal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tabBtn, tab === "request" && s.tabActive]}
            onPress={() => setTab("request")}
          >
            <Text style={[s.tabTxt, tab === "request" && s.tabTxtActive]}>
              Request Jadwal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={HIJAU}
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              onRefresh={() => {
                setRefresh(true);
                loadAll();
              }}
              colors={[HIJAU]}
            />
          }
        >
          {tab === "perubahan" ? (
            sorted(listP).length > 0 ? (
              sorted(listP).map((item) => (
                <CardPerubahan key={item.id} item={item} />
              ))
            ) : (
              <View style={s.empty}>
                <Ionicons name="document-text-outline" size={48} color="#CCC" />
                <Text style={s.emptyTxt}>Belum ada pengajuan.</Text>
              </View>
            )
          ) : sorted(listR).length > 0 ? (
            sorted(listR).map((item) => (
              <CardRequest key={item.id} item={item} />
            ))
          ) : (
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={48} color="#CCC" />
              <Text style={s.emptyTxt}>Belum ada request.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* BOTTOM NAVBAR */}
      <View style={[s.navbar, { paddingBottom: insets.bottom + 4 }]}>
        <TouchableOpacity
          style={s.navTab}
          onPress={() => router.push("/admin-jadwal" as any)}
        >
          <Ionicons name="calendar-outline" size={26} color="#AAA" />
        </TouchableOpacity>
        <TouchableOpacity style={s.navTab}>
          <MaterialCommunityIcons name="message-text" size={26} color={HIJAU} />
          <View style={s.navDot} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.navTab}
          onPress={() => router.push("/admin-edit-jadwal" as any)}
        >
          <FontAwesome5 name="edit" size={22} color="#AAA" />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.navTab}
          onPress={() => router.push("/admin-daftar-perawat" as any)}
        >
          <Ionicons name="people-outline" size={26} color="#AAA" />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.navTab}
          onPress={() => router.push("/admin-rekap" as any)}
        >
          <Ionicons name="bar-chart-outline" size={26} color="#AAA" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  stickyTop: {
    backgroundColor: HIJAU,
    zIndex: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 14,
    gap: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 30,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 26,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#fff" },
  tabTxt: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  tabTxtActive: { color: "#111" },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
  },
  nama: { fontSize: 15, fontWeight: "700", color: "#111" },

  // FIX #3: Garis pemisah
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 12,
  },

  jenisIzin: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },

  rowGap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginBottom: 12,
  },
  infoTxt: { fontSize: 12, color: "#555", flex: 1, lineHeight: 18 },

  // Kotak surat / keterangan
  docBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: KUNING,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  docTxt: { fontSize: 12, color: "#555", flex: 1 },

  // Approval row
  aprRow: { flexDirection: "row", gap: 10, marginBottom: 0 },

  // Tombol
  btnRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  btnSetuju: {
    flex: 1,
    backgroundColor: HIJAU,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnSetujuTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnTolak: {
    flex: 1,
    backgroundColor: MERAH_LIGHT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F5CCCC",
  },
  btnTolakTxt: { color: MERAH, fontWeight: "700", fontSize: 14 },
  disabled: { opacity: 0.55 },

  // Empty
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTxt: { color: "#999", fontSize: 14 },

  // Navbar
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 10,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
  },
  navTab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  navDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: HIJAU },
});
