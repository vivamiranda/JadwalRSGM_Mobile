import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, TextInput, StatusBar, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { supabase } from "../supabase";

const HIJAU  = "#2C7A6E";
const KUNING = "#E8C840";
const MERAH  = "#D9534F";

const formatTgl = (tgl: string) => {
  if (!tgl) return "-";
  const d = new Date(tgl);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};

export default function AdminDaftarPerawat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [perawatList, setPerawatList] = useState<any[]>([]);
  const [filtered, setFiltered]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<"Semua"|"Aktif"|"Tidak Aktif">("Semua");
  const [showFilter, setShowFilter]   = useState(false);
  const [selectedPerawat, setSelectedPerawat] = useState<any>(null);
  const [showDetail, setShowDetail]   = useState(false);

  const totalPerawat      = perawatList.length;
  const perawatAktif      = perawatList.filter(p => p.status === "Aktif").length;
  const perawatTidakAktif = perawatList.filter(p => p.status !== "Aktif").length;

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("user")
        .select("id, nama_lengkap, nip, posisi, tanggal_masuk, status, foto_profil, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, no_telepon, email, pendidikan_terakhir")
        .eq("role", "Perawat")
        .order("nama_lengkap", { ascending: true });
      if (error) throw error;
      setPerawatList(data || []);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let result = [...perawatList];
    if (search.trim()) result = result.filter(p => p.nama_lengkap?.toLowerCase().includes(search.toLowerCase()));
    if (filterStatus !== "Semua") result = result.filter(p => filterStatus === "Aktif" ? p.status === "Aktif" : p.status !== "Aktif");
    setFiltered(result);
  }, [perawatList, search, filterStatus]);

  const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const formatTglLengkap = (iso: string) => {
    if (!iso) return "-";
    const [y, m, d] = iso.split("-");
    return `${d} ${BULAN[parseInt(m)-1]} ${y}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#EFEFEF" }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* MODAL DETAIL PERAWAT */}
      {showDetail && selectedPerawat && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Perawat</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Avatar */}
              <View style={styles.modalAvatar}>
                {selectedPerawat.foto_profil
                  ? <Image source={{ uri: selectedPerawat.foto_profil }} style={styles.modalAvatarImg} />
                  : <View style={styles.modalAvatarFallback}><Ionicons name="person" size={36} color="#fff" /></View>}
              </View>
              <Text style={styles.modalNama}>{selectedPerawat.nama_lengkap}</Text>
              <View style={[styles.modalBadge, { backgroundColor: selectedPerawat.status === "Aktif" ? "#D1FAE5" : "#FEE2E2" }]}>
                <Text style={[styles.modalBadgeTxt, { color: selectedPerawat.status === "Aktif" ? "#065F46" : "#991B1B" }]}>
                  {selectedPerawat.status}
                </Text>
              </View>

              {/* Info */}
              {[
                { icon: "card-outline", label: "NIP", value: selectedPerawat.nip },
                { icon: "male-female-outline", label: "Jenis Kelamin", value: selectedPerawat.jenis_kelamin },
                { icon: "location-outline", label: "Tempat, Tgl Lahir", value: selectedPerawat.tempat_lahir && selectedPerawat.tanggal_lahir ? `${selectedPerawat.tempat_lahir}, ${formatTglLengkap(selectedPerawat.tanggal_lahir)}` : "-" },
                { icon: "home-outline", label: "Alamat", value: selectedPerawat.alamat },
                { icon: "call-outline", label: "No. Telepon", value: selectedPerawat.no_telepon },
                { icon: "mail-outline", label: "Email", value: selectedPerawat.email },
                { icon: "school-outline", label: "Pendidikan", value: selectedPerawat.pendidikan_terakhir },
                { icon: "briefcase-outline", label: "Posisi", value: selectedPerawat.posisi },
                { icon: "calendar-outline", label: "Tanggal Masuk", value: formatTglLengkap(selectedPerawat.tanggal_masuk) },
              ].map((row, i) => (
                <View key={i} style={styles.modalInfoRow}>
                  <Ionicons name={row.icon as any} size={16} color={HIJAU} style={{ width: 22 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalInfoLabel}>{row.label}</Text>
                    <Text style={styles.modalInfoValue}>{row.value || "-"}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDetail(false)}>
              <Text style={styles.modalCloseBtnTxt}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Image source={require("../assets/images/backroundrsgm1.png")}
          style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.overlay} />
        <View style={styles.headerInner}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Daftar Perawat</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Search + Filter */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
              <TextInput style={styles.searchInput} placeholder="Cari nama perawat..."
                placeholderTextColor="rgba(255,255,255,0.55)" value={search} onChangeText={setSearch} />
            </View>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(!showFilter)}>
              <Ionicons name="filter" size={14} color="#fff" />
              <Text style={styles.filterBtnTxt}>Filter</Text>
            </TouchableOpacity>
          </View>

          {showFilter && (
            <View style={styles.filterMenu}>
              {(["Semua","Aktif","Tidak Aktif"] as const).map(opt => (
                <TouchableOpacity key={opt} style={styles.filterMenuItem}
                  onPress={() => { setFilterStatus(opt); setShowFilter(false); }}>
                  <Text style={[styles.filterMenuTxt, filterStatus === opt && { color: HIJAU, fontWeight: "700" }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* STATISTIK */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: HIJAU }]}>
          <Ionicons name="people" size={20} color={HIJAU} />
          <Text style={[styles.statNum, { color: HIJAU }]}>{totalPerawat}</Text>
          <Text style={styles.statLabel}>Total Perawat</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: "#10B981" }]}>
          <Ionicons name="person-circle" size={20} color="#10B981" />
          <Text style={[styles.statNum, { color: "#10B981" }]}>{perawatAktif}</Text>
          <Text style={styles.statLabel}>Perawat Aktif</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: MERAH }]}>
          <Ionicons name="person-remove" size={20} color={MERAH} />
          <Text style={[styles.statNum, { color: MERAH }]}>{perawatTidakAktif}</Text>
          <Text style={styles.statLabel}>Tidak Aktif</Text>
        </View>
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" color={HIJAU} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#CCC" />
          <Text style={styles.emptyTxt}>Tidak ada data perawat</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[HIJAU]} />}>
          {filtered.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardAvatar}>
                {item.foto_profil
                  ? <Image source={{ uri: item.foto_profil }} style={styles.cardAvatarImg} />
                  : <View style={styles.cardAvatarFallback}><Ionicons name="person" size={24} color="#fff" /></View>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardNama}>{item.nama_lengkap}</Text>
                <Text style={styles.cardSub}>NIP. {item.nip || "-"}</Text>
                <Text style={styles.cardSub}>{item.posisi || "-"}</Text>
                <Text style={styles.cardSub}>{formatTgl(item.tanggal_masuk)}</Text>
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.badgeStatus, { backgroundColor: item.status === "Aktif" ? "#E6F4F1" : "#FDEAEA" }]}>
                  <View style={[styles.badgeDot, { backgroundColor: item.status === "Aktif" ? HIJAU : MERAH }]} />
                  <Text style={[styles.badgeTxt, { color: item.status === "Aktif" ? HIJAU : MERAH }]}>
                    {item.status === "Aktif" ? "Aktif" : "Tidak aktif"}
                  </Text>
                </View>
                {/* Hanya tombol lihat - read only */}
                <TouchableOpacity style={styles.actionBtn}
                  onPress={() => { setSelectedPerawat(item); setShowDetail(true); }}>
                  <Ionicons name="eye-outline" size={16} color={HIJAU} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* BOTTOM NAVBAR */}
      <View style={[styles.navbar, { paddingBottom: insets.bottom + 4 }]}>
        <TouchableOpacity style={styles.navTab} onPress={() => router.push("/admin-jadwal" as any)}>
          <Ionicons name="calendar-outline" size={26} color="#AAA" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => router.push("/admin-pengajuan" as any)}>
          <MaterialCommunityIcons name="message-text-outline" size={26} color="#AAA" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => router.push("/admin-edit-jadwal" as any)}>
          <FontAwesome5 name="edit" size={22} color="#AAA" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab}>
          <Ionicons name="people" size={26} color={HIJAU} />
          <View style={styles.navDot} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => router.push("/admin-rekap" as any)}>
          <Ionicons name="bar-chart-outline" size={26} color="#AAA" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { overflow: "hidden", paddingBottom: 16, backgroundColor: HIJAU },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(28,88,76,0.65)" },
  headerInner: { paddingHorizontal: 16, paddingTop: 10, gap: 10 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 30, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", paddingHorizontal: 12, paddingVertical: 9, gap: 6 },
  searchInput: { flex: 1, color: "#fff", fontSize: 13, padding: 0 },
  filterBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 30, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", paddingHorizontal: 12, paddingVertical: 9, gap: 4 },
  filterBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
  filterMenu: { backgroundColor: "#fff", borderRadius: 10, overflow: "hidden", elevation: 8 },
  filterMenuItem: { paddingVertical: 11, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  filterMenuTxt: { fontSize: 14, color: "#374151" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 10, alignItems: "center", borderTopWidth: 3, elevation: 2 },
  statNum: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  statLabel: { fontSize: 10, color: "#6B7280", textAlign: "center", marginTop: 2 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: KUNING, marginBottom: 12, padding: 14, alignItems: "center", elevation: 2 },
  cardAvatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12, overflow: "hidden", backgroundColor: HIJAU },
  cardAvatarImg: { width: "100%", height: "100%" },
  cardAvatarFallback: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: HIJAU },
  cardNama: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 1 },
  cardSub: { fontSize: 11, color: "#777", marginBottom: 1 },
  cardRight: { alignItems: "flex-end", gap: 8 },
  badgeStatus: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 11, fontWeight: "600" },
  actionBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTxt: { color: "#999", fontSize: 14 },
  navbar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E5E5E5", paddingTop: 10, elevation: 12 },
  navTab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  navDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: HIJAU },

  // Modal detail
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", zIndex: 999, paddingHorizontal: 16 },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, padding: 20, width: "100%", maxHeight: "85%", elevation: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  modalAvatar: { width: 70, height: 70, borderRadius: 35, overflow: "hidden", backgroundColor: HIJAU, alignSelf: "center", marginBottom: 10 },
  modalAvatarImg: { width: "100%", height: "100%" },
  modalAvatarFallback: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: HIJAU },
  modalNama: { fontSize: 16, fontWeight: "700", color: "#111", textAlign: "center", marginBottom: 6 },
  modalBadge: { alignSelf: "center", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
  modalBadgeTxt: { fontSize: 12, fontWeight: "700" },
  modalInfoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalInfoLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 2 },
  modalInfoValue: { fontSize: 13, color: "#111", fontWeight: "500" },
  modalCloseBtn: { backgroundColor: HIJAU, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 16 },
  modalCloseBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});