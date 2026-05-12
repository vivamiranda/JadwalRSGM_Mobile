import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  StatusBar,
  RefreshControl,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { supabase } from "../supabase";

const { width } = Dimensions.get("window");
const HIJAU  = "#2C7A6E";
const KUNING = "#E8C840";

// ── Shift info ────────────────────────────────────────────────────────────────
// FIX #1: Tambah semua kemungkinan key (case-insensitive handling di bawah)
const SHIFT_INFO: Record<string, { label: string; jam: string }> = {
  AP: { label: "AP - Poli Pagi / OK",                              jam: "07.00 - 14.00" },
  S:  { label: "S - Poli Siang",                                   jam: "14.00 - 21.00" },
  S1: { label: "S1 - Poli, Anamnesa, Nurse Station, Konditional",  jam: "12.00 - 21.00" },
  B:  { label: "B - Poli, Anamnesa, Nurse Station, Konditional",   jam: "09.00 - 16.00" },
  // Alias tambahan kalau data DB pakai huruf kecil / spasi berbeda
  ap: { label: "AP - Poli Pagi / OK",                              jam: "07.00 - 14.00" },
  s:  { label: "S - Poli Siang",                                   jam: "14.00 - 21.00" },
  s1: { label: "S1 - Poli, Anamnesa, Nurse Station, Konditional",  jam: "12.00 - 21.00" },
  b:  { label: "B - Poli, Anamnesa, Nurse Station, Konditional",   jam: "09.00 - 16.00" },
};

// FIX #1 helper: ambil info shift dengan fallback uppercase
const getShiftInfo = (shift: string) => {
  return SHIFT_INFO[shift] ?? SHIFT_INFO[shift?.toUpperCase()] ?? { label: shift ?? "-", jam: "" };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTgl = (tgl: string) => {
  if (!tgl) return "";
  const d  = new Date(tgl);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const parseInputTgl = (s: string): string | null => {
  const p = s.split("/");
  if (p.length !== 3 || p[0].length !== 2 || p[1].length !== 2 || p[2].length !== 4) return null;
  return `${p[2]}-${p[1]}-${p[0]}`;
};

const fmtInput = (val: string): string => {
  const d = val.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

type Jadwal = {
  id: number;
  nama_perawat: string;
  poli: string;
  tanggal: string;
  shift: string;
  foto_profil?: string | null;
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminJadwalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [adminNama, setAdminNama]         = useState("Dewi Sri");
  const [adminFoto, setAdminFoto]         = useState<string | null>(null);
  const [jadwalList, setJadwalList]       = useState<Jadwal[]>([]);
  const [filtered, setFiltered]           = useState<Jadwal[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [tglMulai, setTglMulai]           = useState("");
  const [tglAkhir, setTglAkhir]           = useState("");

  // FIX #3: State untuk modal konfirmasi logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load admin profile
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user").select("nama_lengkap, foto_profil")
        .eq("id", user.id).maybeSingle();
      if (data) {
        setAdminNama(data.nama_lengkap ?? "Dewi Sri");
        setAdminFoto(data.foto_profil ?? null);
      }
    })();
  }, []);

  // Fetch jadwal
  const fetchJadwal = useCallback(async () => {
    setLoading(true);
    try {
      const { data: jadwal, error } = await supabase
        .from("jadwal").select("id, nama_perawat, poli, tanggal, shift")
        .order("tanggal", { ascending: true });
      if (error) throw error;

      const { data: users } = await supabase
        .from("user").select("nama_lengkap, foto_profil").eq("role", "perawat");
      const fotoMap: Record<string, string | null> = {};
      (users ?? []).forEach((u: any) => { fotoMap[u.nama_lengkap] = u.foto_profil; });

      const enriched = (jadwal ?? []).map((j: any) => ({
        ...j,
        foto_profil: fotoMap[j.nama_perawat] ?? null,
      }));
      setJadwalList(enriched);
      setFiltered(enriched);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchJadwal(); }, [fetchJadwal]);

  // FIX #2: applyFilter sekarang dipanggil dari tombol filter (ikon funnel)
  const applyFilter = useCallback(() => {
    const start = tglMulai ? parseInputTgl(tglMulai) : null;
    const end   = tglAkhir ? parseInputTgl(tglAkhir) : null;
    if (!start && !end) { setFiltered(jadwalList); return; }
    setFiltered(jadwalList.filter(j => {
      if (start && end) return j.tanggal >= start && j.tanggal <= end;
      if (start)        return j.tanggal >= start;
      return j.tanggal <= end!;
    }));
  }, [tglMulai, tglAkhir, jadwalList]);

  const resetFilter = () => {
    setTglMulai("");
    setTglAkhir("");
    setFiltered(jadwalList);
  };

  // FIX #3: Handler logout setelah konfirmasi
  const handleLogout = async () => {
    setShowLogoutModal(false);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    // FIX #4: flex:1 + struktur View agar header sticky dan hanya list yang scroll
    <View style={{ flex: 1, backgroundColor: "#EFEFEF" }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ══ MODAL KONFIRMASI LOGOUT (FIX #3) ══════════════════════════════ */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="exit-outline" size={32} color={HIJAU} />
            </View>
            <Text style={styles.modalTitle}>Keluar Aplikasi</Text>
            <Text style={styles.modalMsg}>
              Apakah kamu yakin ingin keluar dari akun ini?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalBtnCancelTxt}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnLogout]}
                onPress={handleLogout}
              >
                <Text style={styles.modalBtnLogoutTxt}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ HEADER (sticky — di luar ScrollView) ════════════════════════════ */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Image
          source={require("../assets/images/backroundrsgm1.png")}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.overlay} />

        <View style={styles.headerInner}>
          {/* Profil row */}
          <View style={styles.profilRow}>
            <View style={styles.avatarRing}>
              {adminFoto
                ? <Image source={{ uri: adminFoto }} style={styles.avatarImg} />
                : (
                  <View style={styles.avatarFallback}>
                    <Ionicons name="person" size={26} color="#fff" />
                  </View>
                )}
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.adminNama}>{adminNama}</Text>
              <Text style={styles.adminRole}>Kepala Perawat</Text>
            </View>

            {/* FIX #3: Buka modal dulu sebelum logout */}
            <TouchableOpacity
              onPress={() => setShowLogoutModal(true)}
              style={styles.logoutBtn}
            >
              <Ionicons name="exit-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.rsSub}>JADWAL PERAWAT CENTER RSG...</Text>

          {/* Filter bar */}
          <View style={styles.filterBar}>
            {/* FIX #2: Tombol funnel sekarang memanggil applyFilter */}
            <TouchableOpacity style={styles.funnelBtn} onPress={applyFilter}>
              <Ionicons name="filter" size={16} color="#fff" />
            </TouchableOpacity>

            <Ionicons name="calendar-outline" size={16} color="#fff" style={{ marginLeft: 4 }} />
            <TextInput
              style={styles.filterInput}
              placeholder="dd/mm/tttt"
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={tglMulai}
              keyboardType="numeric"
              maxLength={10}
              onChangeText={v => setTglMulai(fmtInput(v))}
              // FIX #2: onSubmitEditing tetap ada sebagai shortcut keyboard
              onSubmitEditing={applyFilter}
              returnKeyType="search"
            />

            <Text style={styles.filterDiv}>|</Text>

            <TextInput
              style={[styles.filterInput, { flex: 1 }]}
              placeholder="dd/mm/tttt"
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={tglAkhir}
              keyboardType="numeric"
              maxLength={10}
              onChangeText={v => setTglAkhir(fmtInput(v))}
              onSubmitEditing={applyFilter}
              returnKeyType="search"
            />

            <TouchableOpacity onPress={resetFilter}>
              <Text style={styles.resetTxt}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ══ SECTION TITLE (sticky juga, di luar ScrollView) ════════════════ */}
      <Text style={styles.sectionTitle}>Jadwal perawat</Text>

      {/* ══ BODY — hanya bagian ini yang scroll ════════════════════════════ */}
      {loading ? (
        <ActivityIndicator size="large" color={HIJAU} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <Text style={{ color: "#999" }}>Belum ada data jadwal.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchJadwal(); }}
              colors={[HIJAU]}
            />
          }
        >
          {filtered.map(item => {
            // FIX #1: pakai helper getShiftInfo agar key selalu match
            const info = getShiftInfo(item.shift);
            return (
              <View key={item.id} style={styles.card}>
                {/* Avatar perawat */}
                <View style={styles.cardAvatar}>
                  {item.foto_profil
                    ? <Image source={{ uri: item.foto_profil }} style={styles.cardAvatarImg} />
                    : (
                      <View style={styles.cardAvatarFallback}>
                        <Ionicons name="person" size={26} color="#fff" />
                      </View>
                    )}
                </View>

                {/* Konten card */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardNama}>{item.nama_perawat}</Text>

                  {/* FIX #1: Tampilkan poli jika ada */}
                  {item.poli ? (
                    <Text style={styles.cardPoli}>
                      <Ionicons name="business-outline" size={11} color="#888" /> {item.poli}
                    </Text>
                  ) : null}

                  <Text style={styles.cardTgl}>
                    <Ionicons name="calendar-outline" size={11} color="#888" /> {formatTgl(item.tanggal)}
                  </Text>

                  {/* Badge shift — label lengkap */}
                  <View style={styles.shiftBadge}>
                    <Text style={styles.shiftBadgeTxt}>{info.label}</Text>
                  </View>

                  {/* FIX #1: Badge jam selalu tampil jika info.jam ada */}
                  {info.jam ? (
                    <View style={styles.jamBadge}>
                      <Ionicons name="time-outline" size={12} color="#444" style={{ marginRight: 4 }} />
                      <Text style={styles.jamTxt}>{info.jam}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ══ BOTTOM NAVBAR ════════════════════════════════════════════════════ */}
      <View style={[styles.navbar, { paddingBottom: insets.bottom + 4 }]}>
        <TouchableOpacity style={styles.navTab}>
          <Ionicons name="calendar" size={26} color={HIJAU} />
          <View style={styles.navDot} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => router.push("/admin-pengajuan" as any)}>
          <MaterialCommunityIcons name="message-text-outline" size={26} color="#AAAAAA" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => router.push("/admin-edit-jadwal" as any)}>
          <FontAwesome5 name="edit" size={22} color="#AAAAAA" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => router.push("/admin-daftar-perawat" as any)}>
          <Ionicons name="people-outline" size={26} color="#AAAAAA" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => router.push("/admin-rekap" as any)}>
          <Ionicons name="bar-chart-outline" size={26} color="#AAAAAA" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    overflow: "hidden",
    paddingBottom: 16,
    backgroundColor: HIJAU,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28, 88, 76, 0.65)",
  },
  headerInner: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },

  // Profil
  profilRow: { flexDirection: "row", alignItems: "center" },
  avatarRing: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: "#fff",
    overflow: "hidden", backgroundColor: HIJAU,
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: HIJAU,
  },
  adminNama: { color: "#fff", fontWeight: "700", fontSize: 17 },
  adminRole: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },

  // Subtitle
  rsSub: {
    color: "rgba(255,255,255,0.55)", fontSize: 10,
    textAlign: "center", letterSpacing: 1,
  },

  // Filter bar
  filterBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 30, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 10, paddingVertical: 10,
    gap: 5,
  },
  funnelBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
  },
  filterInput: {
    color: "#fff", fontSize: 13,
    paddingVertical: 0, minWidth: 82,
  },
  filterDiv: { color: "rgba(255,255,255,0.4)", fontSize: 20 },
  resetTxt:  { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Section title
  sectionTitle: {
    fontSize: 15, fontWeight: "700", color: "#111",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: KUNING,
    marginBottom: 12,
    padding: 14,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  cardAvatar: {
    width: 50, height: 50, borderRadius: 25,
    marginRight: 12, overflow: "hidden",
    backgroundColor: HIJAU,
  },
  cardAvatarImg:      { width: "100%", height: "100%" },
  cardAvatarFallback: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: HIJAU,
  },
  cardNama: {
    fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 1,
  },
  // FIX #1: style untuk poli
  cardPoli: {
    fontSize: 11, color: "#888", marginBottom: 1,
  },
  cardTgl: {
    fontSize: 12, color: "#777", marginBottom: 8,
  },

  // Badge shift — outline kuning
  shiftBadge: {
    alignSelf: "flex-start",
    borderWidth: 1.5, borderColor: KUNING,
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 6,
  },
  shiftBadgeTxt: { color: KUNING, fontSize: 11, fontWeight: "600" },

  // Badge jam — abu dengan ikon jam (FIX #1)
  jamBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  jamTxt: { color: "#444", fontSize: 11, fontWeight: "500" },

  // Bottom navbar
  navbar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#E5E5E5",
    paddingTop: 10,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08, shadowOffset: { width: 0, height: -2 },
  },
  navTab: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 3,
  },
  navDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: HIJAU,
  },

  // Modal logout (FIX #3)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#E8F5F3",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17, fontWeight: "700", color: "#111", marginBottom: 6,
  },
  modalMsg: {
    fontSize: 13, color: "#666", textAlign: "center",
    lineHeight: 20, marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row", gap: 12, width: "100%",
  },
  modalBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
  },
  modalBtnCancel: {
    backgroundColor: "#F0F0F0",
  },
  modalBtnCancelTxt: {
    color: "#555", fontWeight: "600", fontSize: 14,
  },
  modalBtnLogout: {
    backgroundColor: HIJAU,
  },
  modalBtnLogoutTxt: {
    color: "#fff", fontWeight: "700", fontSize: 14,
  },
});