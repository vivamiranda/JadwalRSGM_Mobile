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
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { supabase } from "../supabase";

const HIJAU  = "#2C7A6E";
const KUNING = "#E8C840";
const MERAH  = "#D9534F";

// ── Semua shift (10) ──────────────────────────────────────────────────────────
export const SHIFT_LIST = [
  { key: "AP",         label: "AP - Poli Pagi/OK",                              jam: "07.00 - 14.00" },
  { key: "S",          label: "S - Poli Siang",                                 jam: "14.00 - 21.00" },
  { key: "S1",         label: "S1 - Poli, Anamnesa, Nurse Station, Konditional", jam: "12.00 - 21.00" },
  { key: "B",          label: "B - Poli, Anamnesa, Nurse Station, Konditional",  jam: "09.00 - 16.00" },
  { key: "DP",         label: "DP - Integrasi LT 2",                             jam: "08.00 - 16.00" },
  { key: "CP",         label: "CP - Integrasi LT 1",                             jam: "08.00 - 16.00" },
  { key: "SABTU",      label: "Sabtu",                                           jam: "08.00 - 16.00" },
  { key: "IBS",        label: "IBS",                                             jam: "08.00 - 16.00" },
  { key: "LIBUR/CUTI", label: "Libur / Cuti",                                   jam: "" },
  { key: "LIBURNAS",   label: "Libur Nasional",                                  jam: "" },
];

export const getShift = (key: string) =>
  SHIFT_LIST.find(s => s.key === key) ??
  SHIFT_LIST.find(s => s.key === (key ?? "").toUpperCase()) ??
  { key, label: key, jam: "" };

const formatTgl = (tgl: string) => {
  if (!tgl) return "";
  const d  = new Date(tgl);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const fmtInput = (val: string): string => {
  const d = val.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

const parseInputTgl = (s: string): string | null => {
  const p = s.split("/");
  if (p.length !== 3 || p[0].length !== 2 || p[1].length !== 2 || p[2].length !== 4) return null;
  return `${p[2]}-${p[1]}-${p[0]}`;
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
export default function AdminEditJadwalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [filtered, setFiltered]     = useState<Jadwal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [tglFilter, setTglFilter]   = useState("");

  // Modal konfirmasi hapus
  const [hapusModal, setHapusModal]   = useState(false);
  const [hapusItem, setHapusItem]     = useState<Jadwal | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);

  // Fetch jadwal + foto profil
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
        ...j, foto_profil: fotoMap[j.nama_perawat] ?? null,
      }));
      setJadwalList(enriched);
      applyFilters(enriched, search, tglFilter);
    } catch (e: any) { console.error(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchJadwal(); }, [fetchJadwal]);

  const applyFilters = (list: Jadwal[], q: string, tgl: string) => {
    let result = list;
    if (q.trim()) {
      result = result.filter(j =>
        j.nama_perawat.toLowerCase().includes(q.toLowerCase()));
    }
    if (tgl) {
      const parsed = parseInputTgl(tgl);
      if (parsed) result = result.filter(j => j.tanggal === parsed);
    }
    setFiltered(result);
  };

  const onSearch = (v: string) => {
    setSearch(v);
    applyFilters(jadwalList, v, tglFilter);
  };

  const onTglChange = (v: string) => {
    const fmt = fmtInput(v);
    setTglFilter(fmt);
    applyFilters(jadwalList, search, fmt);
  };

  const resetFilter = () => {
    setSearch("");
    setTglFilter("");
    setFiltered(jadwalList);
  };

  // Hapus jadwal
  const konfirmasiHapus = (item: Jadwal) => {
    setHapusItem(item);
    setHapusModal(true);
  };

  const doHapus = async () => {
    if (!hapusItem) return;
    setHapusLoading(true);
    try {
      const { error } = await supabase.from("jadwal").delete().eq("id", hapusItem.id);
      if (error) throw error;
      setHapusModal(false);
      setHapusItem(null);
      await fetchJadwal();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setHapusLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: "#F0F0F0" }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── MODAL KONFIRMASI HAPUS ─────────────────────────────────────── */}
      <Modal visible={hapusModal} transparent animationType="fade"
        onRequestClose={() => setHapusModal(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <View style={st.modalIconWrap}>
              <Ionicons name="trash-outline" size={30} color={MERAH} />
            </View>
            <Text style={st.modalTitle}>Hapus Jadwal?</Text>
            <Text style={st.modalMsg}>
              Jadwal <Text style={{ fontWeight: "700" }}>{hapusItem?.nama_perawat}</Text> tanggal{" "}
              <Text style={{ fontWeight: "700" }}>{formatTgl(hapusItem?.tanggal ?? "")}</Text> akan dihapus permanen.
            </Text>
            <View style={st.modalActions}>
              <TouchableOpacity
                style={[st.modalBtn, st.modalBtnCancel]}
                onPress={() => setHapusModal(false)}
              >
                <Text style={st.modalBtnCancelTxt}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modalBtn, st.modalBtnHapus]}
                onPress={doHapus}
                disabled={hapusLoading}
              >
                {hapusLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={st.modalBtnHapusTxt}>Ya, Hapus</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── STICKY HEADER ──────────────────────────────────────────────── */}
      <View style={[st.header, { paddingTop: insets.top }]}>
        <Image
          source={require("../assets/images/backroundrsgm1.png")}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={st.overlay} />

        <View style={st.headerInner}>
          {/* Title row */}
          <View style={st.titleRow}>
            <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={st.headerTitle}>Edit Jadwal</Text>

            {/* Tombol Tambah Jadwal */}
            <TouchableOpacity
              style={st.tambahBtn}
              onPress={() => router.push("/admin-tambah-jadwal" as any)}
            >
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={st.tambahTxt}>Tambah Jadwal</Text>
            </TouchableOpacity>
          </View>

          {/* Search + filter tanggal */}
          <View style={st.searchRow}>
            {/* Search */}
            <View style={st.searchBox}>
              <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={st.searchInput}
                placeholder="cari nama perawat"
                placeholderTextColor="rgba(255,255,255,0.55)"
                value={search}
                onChangeText={onSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => onSearch("")}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter tanggal */}
            <View style={st.tglBox}>
              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={st.tglInput}
                placeholder="dd/mm/tttt"
                placeholderTextColor="rgba(255,255,255,0.55)"
                value={tglFilter}
                keyboardType="numeric"
                maxLength={10}
                onChangeText={onTglChange}
              />
            </View>

            {/* Reset */}
            {(search || tglFilter) ? (
              <TouchableOpacity onPress={resetFilter} style={st.resetBtn}>
                <Text style={st.resetTxt}>Reset</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── LIST JADWAL ────────────────────────────────────────────────── */}
      {loading ? (
        <ActivityIndicator size="large" color={HIJAU} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="calendar-outline" size={48} color="#CCC" />
          <Text style={st.emptyTxt}>Belum ada jadwal.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchJadwal(); }}
              colors={[HIJAU]} />
          }
        >
          {filtered.map(item => {
            const shift = getShift(item.shift);
            return (
              <View key={item.id} style={st.card}>
                {/* Avatar + info */}
                <View style={st.cardTop}>
                  <View style={st.cardAvatar}>
                    {item.foto_profil
                      ? <Image source={{ uri: item.foto_profil }} style={st.cardAvatarImg} />
                      : (
                        <View style={st.cardAvatarFallback}>
                          <Ionicons name="person" size={24} color="#fff" />
                        </View>
                      )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={st.cardNama}>{item.nama_perawat}</Text>
                    <Text style={st.cardTgl}>{formatTgl(item.tanggal)}</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={st.divider} />

                {/* Shift info */}
                <Text style={st.cardShift}>{shift.label}</Text>
                {shift.jam ? <Text style={st.cardJam}>{shift.jam}</Text> : null}

                {/* Tombol Edit & Hapus */}
                <View style={st.btnRow}>
                  <TouchableOpacity
                    style={st.btnEdit}
                    onPress={() => router.push({
                      pathname: "/admin-edit-form" as any,
                      params: {
                        id:           item.id.toString(),
                        nama_perawat: item.nama_perawat,
                        tanggal:      item.tanggal,
                        shift:        item.shift,
                        poli:         item.poli,
                      },
                    })}
                  >
                    <Text style={st.btnEditTxt}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={st.btnHapus}
                    onPress={() => konfirmasiHapus(item)}
                  >
                    <Text style={st.btnHapusTxt}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── BOTTOM NAVBAR ──────────────────────────────────────────────── */}
      <View style={[st.navbar, { paddingBottom: insets.bottom + 4 }]}>
        <TouchableOpacity style={st.navTab} onPress={() => router.push("/admin-jadwal" as any)}>
          <Ionicons name="calendar-outline" size={26} color="#AAA" />
        </TouchableOpacity>
        <TouchableOpacity style={st.navTab} onPress={() => router.push("/admin-pengajuan" as any)}>
          <MaterialCommunityIcons name="message-text-outline" size={26} color="#AAA" />
        </TouchableOpacity>
        <TouchableOpacity style={st.navTab}>
          <FontAwesome5 name="edit" size={22} color={HIJAU} />
          <View style={st.navDot} />
        </TouchableOpacity>
        <TouchableOpacity style={st.navTab} onPress={() => router.push("/admin-daftar-perawat" as any)}>
          <Ionicons name="people-outline" size={26} color="#AAA" />
        </TouchableOpacity>
        <TouchableOpacity style={st.navTab} onPress={() => router.push("/admin-rekap" as any)}>
          <Ionicons name="bar-chart-outline" size={26} color="#AAA" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  // Header
  header: {
    overflow: "hidden",
    paddingBottom: 16,
    backgroundColor: HIJAU,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28,88,76,0.65)",
  },
  headerInner: { paddingHorizontal: 16, paddingTop: 6, gap: 10 },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  backBtn:  { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1 },

  tambahBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
  },
  tambahTxt: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Search row
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 30, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 13, paddingVertical: 0 },

  tglBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 30, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 10, paddingVertical: 10,
  },
  tglInput: { color: "#fff", fontSize: 13, paddingVertical: 0, width: 90 },

  resetBtn: { paddingHorizontal: 4 },
  resetTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: KUNING,
    marginBottom: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardAvatar: {
    width: 46, height: 46, borderRadius: 23,
    marginRight: 12, overflow: "hidden", backgroundColor: HIJAU,
  },
  cardAvatarImg:      { width: "100%", height: "100%" },
  cardAvatarFallback: {
    flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: HIJAU,
  },
  cardNama: { fontSize: 15, fontWeight: "700", color: "#111" },
  cardTgl:  { fontSize: 12, color: "#777", marginTop: 2 },

  divider: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 10 },

  cardShift: { fontSize: 13, fontWeight: "600", color: "#222", marginBottom: 2 },
  cardJam:   { fontSize: 12, color: "#666", marginBottom: 10 },

  // Tombol Edit & Hapus
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  btnEdit: {
    flex: 1, backgroundColor: "#E8F5F3",
    borderRadius: 10, paddingVertical: 10, alignItems: "center",
    borderWidth: 1, borderColor: HIJAU,
  },
  btnEditTxt:  { color: HIJAU, fontWeight: "700", fontSize: 13 },
  btnHapus: {
    flex: 1, backgroundColor: "#FDEAEA",
    borderRadius: 10, paddingVertical: 10, alignItems: "center",
    borderWidth: 1, borderColor: "#F5CCCC",
  },
  btnHapusTxt: { color: MERAH, fontWeight: "700", fontSize: 13 },

  // Empty
  empty:    { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTxt: { color: "#999", fontSize: 14 },

  // Modal hapus
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 32,
  },
  modalBox: {
    backgroundColor: "#fff", borderRadius: 20, padding: 24,
    width: "100%", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 10,
  },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#FDEAEA",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  modalTitle:   { fontSize: 17, fontWeight: "700", color: "#111", marginBottom: 6 },
  modalMsg:     { fontSize: 13, color: "#666", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtn:     { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalBtnCancel:    { backgroundColor: "#F0F0F0" },
  modalBtnCancelTxt: { color: "#555", fontWeight: "600", fontSize: 14 },
  modalBtnHapus:     { backgroundColor: MERAH },
  modalBtnHapusTxt:  { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Navbar
  navbar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#E5E5E5", paddingTop: 10,
    elevation: 12, shadowColor: "#000", shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
  },
  navTab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  navDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: HIJAU },
});