import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { supabase } from "../supabase";

const HIJAU  = "#2C7A6E";
const KUNING = "#E8C840";

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const TAHUN = ["2024","2025","2026","2027"];

function Dropdown({ value, options, onSelect }: {
  value: string; options: string[]; onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, zIndex: open ? 999 : 1 }}>
      <TouchableOpacity style={styles.ddBtn} onPress={() => setOpen(!open)}>
        <Text style={styles.ddValue}>{value}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color="#555" />
      </TouchableOpacity>
      {open && (
        <View style={styles.ddMenu}>
          <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
            {options.map(opt => (
              <TouchableOpacity key={opt} style={styles.ddItem}
                onPress={() => { onSelect(opt); setOpen(false); }}>
                <Text style={[styles.ddItemTxt, opt === value && { color: HIJAU, fontWeight: "700" }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function AdminRekap() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const now = new Date();

  const [selectedBulan, setSelectedBulan] = useState(BULAN[now.getMonth()]);
  const [selectedTahun, setSelectedTahun] = useState(now.getFullYear().toString());
  const [loading, setLoading]   = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [totalMasuk, setTotalMasuk]     = useState(0);
  const [totalCuti, setTotalCuti]       = useState(0);
  const [totalPerawat, setTotalPerawat] = useState(0);
  const [detailData, setDetailData]     = useState<any[]>([]);

  const fetchRekap = async () => {
    setLoading(true);
    try {
      const bulanIndex = BULAN.indexOf(selectedBulan) + 1;
      const bulanStr   = String(bulanIndex).padStart(2, "0");
      const dari       = `${selectedTahun}-${bulanStr}-01`;
      const akhirHari  = new Date(parseInt(selectedTahun), bulanIndex, 0).getDate();
      const sampai     = `${selectedTahun}-${bulanStr}-${String(akhirHari).padStart(2,"0")}`;

      const [{ data: pl }, { data: jl }, { data: il }] = await Promise.all([
        supabase.from("user").select("id,nama_lengkap,posisi,status").eq("role","Perawat"),
        supabase.from("jadwal").select("nama_perawat,tanggal").gte("tanggal",dari).lte("tanggal",sampai),
        supabase.from("pengajuan").select("nama_perawat").eq("status_admin","Disetujui").gte("tanggal_jadwal",dari).lte("tanggal_jadwal",sampai),
      ]);

      const perawat = pl || [];
      const jadwal  = jl || [];
      const izin    = il || [];

      setTotalPerawat(perawat.length);
      const detail = perawat.map((p: any) => {
        const jj = jadwal.filter((j: any) => j.nama_perawat === p.nama_lengkap).length;
        const jc = izin.filter((i: any)   => i.nama_perawat === p.nama_lengkap).length;
        return { nama: p.nama_lengkap, posisi: p.posisi || "Perawat", masuk: Math.max(jj-jc,0), cuti: jc, status: p.status || "Aktif" };
      });

      setTotalMasuk(detail.reduce((a: number, d: any) => a + d.masuk, 0));
      setTotalCuti(detail.reduce((a: number, d: any)  => a + d.cuti,  0));
      setDetailData(detail);
      setHasLoaded(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#EFEFEF" }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.overlay} />
        <View style={styles.headerInner}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Rekap Kehadiran</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* FILTER */}
        <View style={styles.filterCard}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>Bulan</Text>
              <Dropdown value={selectedBulan} options={BULAN} onSelect={setSelectedBulan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>Tahun</Text>
              <Dropdown value={selectedTahun} options={TAHUN} onSelect={setSelectedTahun} />
            </View>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchRekap} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color={HIJAU} />
              : <><Ionicons name="refresh-outline" size={16} color={HIJAU} /><Text style={styles.refreshTxt}>Refresh Data</Text></>}
          </TouchableOpacity>
        </View>

        {hasLoaded && (
          <>
            {/* STATISTIK */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderTopColor: HIJAU }]}>
                <Ionicons name="checkmark-circle" size={20} color={HIJAU} />
                <Text style={[styles.statNum, { color: HIJAU }]}>{totalMasuk}</Text>
                <Text style={styles.statLabel}>Total Masuk</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: KUNING }]}>
                <Ionicons name="close-circle" size={20} color="#B8860B" />
                <Text style={[styles.statNum, { color: "#B8860B" }]}>{totalCuti}</Text>
                <Text style={styles.statLabel}>Cuti/Izin</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: "#6366F1" }]}>
                <Ionicons name="people" size={20} color="#6366F1" />
                <Text style={[styles.statNum, { color: "#6366F1" }]}>{totalPerawat}</Text>
                <Text style={styles.statLabel}>Total Perawat</Text>
              </View>
            </View>

            {/* DETAIL */}
            <Text style={styles.sectionTitle}>Detail Kehadiran</Text>
            {detailData.map((item, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.cardAvatar}>
                  <View style={styles.cardAvatarFallback}>
                    <Ionicons name="person" size={20} color="#fff" />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardNama}>{item.nama}</Text>
                  <Text style={styles.cardSub}>{item.posisi}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={[styles.statNum, { fontSize: 16, color: HIJAU }]}>{item.masuk}</Text>
                    <Text style={styles.cardSub}>Masuk</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={[styles.statNum, { fontSize: 16, color: "#B8860B" }]}>{item.cuti}</Text>
                    <Text style={styles.cardSub}>Cuti</Text>
                  </View>
                  <View style={[styles.badgeStatus, { backgroundColor: item.status === "Aktif" ? "#E6F4F1" : "#FDEAEA" }]}>
                    <Text style={[styles.badgeTxt, { color: item.status === "Aktif" ? HIJAU : "#D9534F" }]}>{item.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {!hasLoaded && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={56} color="#CCC" />
            <Text style={styles.emptyTxt}>Pilih bulan & tahun lalu tekan{"\n"}Refresh Data</Text>
          </View>
        )}
      </ScrollView>

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
        <TouchableOpacity style={styles.navTab} onPress={() => router.push("/admin-daftar-perawat" as any)}>
          <Ionicons name="people-outline" size={26} color="#AAA" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab}>
          <Ionicons name="bar-chart" size={26} color={HIJAU} />
          <View style={styles.navDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: HIJAU, paddingBottom: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(28,88,76,0.65)" },
  headerInner: { paddingHorizontal: 16 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  filterCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 12, elevation: 2, marginBottom: 14 },
  filterLabel: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 4 },
  ddBtn: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff" },
  ddValue: { fontSize: 13, color: "#111" },
  ddMenu: { position: "absolute", top: 42, left: 0, right: 0, backgroundColor: "#fff", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, zIndex: 999, elevation: 10 },
  ddItem: { paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  ddItemTxt: { fontSize: 13, color: "#374151" },
  refreshBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#D1FAE5" },
  refreshTxt: { color: HIJAU, fontWeight: "600", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 10, alignItems: "center", borderTopWidth: 3, elevation: 2 },
  statNum: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  statLabel: { fontSize: 10, color: "#6B7280", textAlign: "center", marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 10 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: KUNING, marginBottom: 10, padding: 14, alignItems: "center", elevation: 2 },
  cardAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 12, overflow: "hidden", backgroundColor: HIJAU },
  cardAvatarFallback: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: HIJAU },
  cardNama: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 1 },
  cardSub: { fontSize: 11, color: "#777" },
  badgeStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTxt: { color: "#999", fontSize: 14, textAlign: "center" },
  navbar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E5E5E5", paddingTop: 10, elevation: 12 },
  navTab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  navDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: HIJAU },
});