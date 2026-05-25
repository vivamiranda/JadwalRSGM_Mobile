import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar, ActivityIndicator, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../supabase";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─────────────────────────────────────────────
// DATA BULAN & TAHUN
// ─────────────────────────────────────────────
const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];
const TAHUN = ["2024","2025","2026","2027"];

// ─────────────────────────────────────────────
// DROPDOWN
// ─────────────────────────────────────────────
function Dropdown({ value, options, onSelect }: {
  value: string; options: string[]; onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, zIndex: open ? 999 : 1 }}>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(!open)}>
        <Text style={styles.dropdownValue}>{value}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color="#6B7280" />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownMenu}>
          <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
            {options.map((opt) => (
              <TouchableOpacity key={opt} style={styles.dropdownItem}
                onPress={() => { onSelect(opt); setOpen(false); }}>
                <Text style={[styles.dropdownItemText, opt === value && { color: "#1B9B6F", fontWeight: "700" }]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// SIMPLE BAR CHART
// ─────────────────────────────────────────────
function BarChart({ data }: { data: { nama: string; masuk: number; cuti: number }[] }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.masuk, d.cuti)), 1);
  const barW = Math.max(((SCREEN_WIDTH - 64) / Math.max(data.length, 1)) - 8, 20);

  return (
    <View style={styles.chartContainer}>
      {/* Y axis labels */}
      <View style={styles.yAxis}>
        {[1, 0.5, 0].map((v, i) => (
          <Text key={i} style={styles.yLabel}>{Math.round(maxVal * v)}</Text>
        ))}
      </View>

      {/* Bars */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.barsContainer}>
          {data.map((d, i) => (
            <View key={i} style={[styles.barGroup, { width: barW + 8 }]}>
              <View style={styles.barPair}>
                {/* Masuk bar */}
                <View style={[styles.bar, {
                  height: Math.max((d.masuk / maxVal) * 80, 2),
                  backgroundColor: "#1B9B6F", width: barW / 2 - 2,
                }]} />
                {/* Cuti bar */}
                <View style={[styles.bar, {
                  height: Math.max((d.cuti / maxVal) * 80, 2),
                  backgroundColor: "#F59E0B", width: barW / 2 - 2,
                }]} />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {d.nama.split(" ")[0]}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// SIMPLE PIE CHART (SVG-style dengan View)
// ─────────────────────────────────────────────
function PieChart({ masuk, cuti }: { masuk: number; cuti: number }) {
  const total = masuk + cuti || 1;
  const masukPct = Math.round((masuk / total) * 100);
  const cutiPct = 100 - masukPct;

  // Simulasi pie dengan 2 arc menggunakan border radius trick
  const SIZE = 120;
  const masukDeg = (masuk / total) * 360;

  return (
    <View style={styles.pieWrapper}>
      {/* Pie visual sederhana menggunakan gradient trick */}
      <View style={[styles.pieOuter, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]}>
        <View style={[styles.pieInner, {
          width: SIZE, height: SIZE, borderRadius: SIZE / 2,
          borderWidth: SIZE / 4,
          borderTopColor: "#1B9B6F",
          borderRightColor: masukDeg > 90 ? "#1B9B6F" : "#F59E0B",
          borderBottomColor: masukDeg > 180 ? "#1B9B6F" : "#F59E0B",
          borderLeftColor: masukDeg > 270 ? "#1B9B6F" : "#F59E0B",
        }]} />
      </View>

      {/* Legend */}
      <View style={styles.pieLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#1B9B6F" }]} />
          <Text style={styles.legendText}>Masuk ({masukPct}%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
          <Text style={styles.legendText}>Cuti/Izin ({cutiPct}%)</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// CARD DETAIL KEHADIRAN
// ─────────────────────────────────────────────
function CardDetail({ item }: { item: { nama: string; posisi: string; masuk: number; cuti: number; status: string } }) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.detailAvatar}>
        <Ionicons name="person" size={20} color="#fff" />
      </View>
      <View style={styles.detailInfo}>
        <Text style={styles.detailNama}>{item.nama}</Text>
        <Text style={styles.detailPosisi}>{item.posisi}</Text>
      </View>
      <View style={styles.detailStats}>
        <View style={styles.detailStatItem}>
          <Ionicons name="calendar-outline" size={12} color="#6B7280" />
          <Text style={styles.detailStatNum}>{item.masuk}</Text>
          <Text style={styles.detailStatLabel}>Masuk</Text>
        </View>
        <View style={styles.detailStatItem}>
          <Ionicons name="close-circle-outline" size={12} color="#F59E0B" />
          <Text style={styles.detailStatNum}>{item.cuti}</Text>
          <Text style={styles.detailStatLabel}>Cuti/Izin</Text>
        </View>
      </View>
      <View style={[styles.statusChip, { backgroundColor: item.status === "Aktif" ? "#D1FAE5" : "#FEE2E2" }]}>
        <Text style={[styles.statusChipText, { color: item.status === "Aktif" ? "#065F46" : "#991B1B" }]}>
          {item.status}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// LAYAR UTAMA
// ─────────────────────────────────────────────
export default function KepegawaianRekap() {
  const now = new Date();
  const [selectedBulan, setSelectedBulan] = useState(BULAN[now.getMonth()]);
  const [selectedTahun, setSelectedTahun] = useState(now.getFullYear().toString());
  const [loading, setLoading] = useState(false);

  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalCuti, setTotalCuti] = useState(0);
  const [totalPerawat, setTotalPerawat] = useState(0);
  const [chartData, setChartData] = useState<{ nama: string; masuk: number; cuti: number }[]>([]);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchRekap = useCallback(async () => {
    setLoading(true);
    try {
      const bulanIndex = BULAN.indexOf(selectedBulan) + 1;
      const bulanStr = String(bulanIndex).padStart(2, "0");
      const dari = `${selectedTahun}-${bulanStr}-01`;
      const akhirHari = new Date(parseInt(selectedTahun), bulanIndex, 0).getDate();
      const sampai = `${selectedTahun}-${bulanStr}-${String(akhirHari).padStart(2, "0")}`;

      // Ambil semua perawat
      const { data: perawatList } = await supabase
        .from("user")
        .select("id, nama_lengkap, posisi, status")
        .eq("role", "Perawat");

      // Ambil jadwal bulan ini
      const { data: jadwalList } = await supabase
        .from("jadwal")
        .select("nama_perawat, tanggal")
        .gte("tanggal", dari)
        .lte("tanggal", sampai);

      // Ambil pengajuan yang disetujui bulan ini
      const { data: izinList } = await supabase
        .from("pengajuan")
        .select("nama_perawat, tanggal_jadwal, jenis_izin")
        .eq("status_admin", "Disetujui")
        .gte("tanggal_jadwal", dari)
        .lte("tanggal_jadwal", sampai);

      const perawat = perawatList || [];
      const jadwal = jadwalList || [];
      const izin = izinList || [];

      setTotalPerawat(perawat.length);

      // Hitung per perawat
      const detail = perawat.map((p) => {
        const namaKey = p.nama_lengkap;
        const jmlJadwal = jadwal.filter(j => j.nama_perawat === namaKey).length;
        const jmlCuti = izin.filter(i => i.nama_perawat === namaKey).length;
        const jmlMasuk = Math.max(jmlJadwal - jmlCuti, 0);
        return {
          nama: namaKey,
          posisi: p.posisi || "Perawat",
          masuk: jmlMasuk,
          cuti: jmlCuti,
          status: p.status || "Aktif",
        };
      });

      const sumMasuk = detail.reduce((a, d) => a + d.masuk, 0);
      const sumCuti = detail.reduce((a, d) => a + d.cuti, 0);

      setTotalMasuk(sumMasuk);
      setTotalCuti(sumCuti);
      setChartData(detail);
      setDetailData(detail);
      setHasLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedBulan, selectedTahun]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B9B6F" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rekap Kehadiran</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* FILTER CARD */}
        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            {/* Bulan */}
            <View style={styles.filterCol}>
              <View style={styles.filterLabelRow}>
                <Ionicons name="calendar-outline" size={14} color="#1B9B6F" />
                <Text style={styles.filterLabel}>Bulan</Text>
              </View>
              <Dropdown value={selectedBulan} options={BULAN} onSelect={setSelectedBulan} />
            </View>

            {/* Tahun */}
            <View style={styles.filterCol}>
              <View style={styles.filterLabelRow}>
                <Ionicons name="calendar-outline" size={14} color="#1B9B6F" />
                <Text style={styles.filterLabel}>Tahun</Text>
              </View>
              <Dropdown value={selectedTahun} options={TAHUN} onSelect={setSelectedTahun} />
            </View>
          </View>

          {/* Tombol Refresh */}
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchRekap} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color="#1B9B6F" />
              : <>
                  <Ionicons name="refresh-outline" size={16} color="#1B9B6F" />
                  <Text style={styles.refreshText}>Refresh Data</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {hasLoaded && (
          <>
            {/* STATISTIK */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderColor: "#1B9B6F" }]}>
                <View style={[styles.statIcon, { backgroundColor: "#D1FAE5" }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#1B9B6F" />
                </View>
                <Text style={[styles.statNum, { color: "#1B9B6F" }]}>{totalMasuk}</Text>
                <Text style={styles.statLabel}>Total Masuk</Text>
              </View>
              <View style={[styles.statCard, { borderColor: "#F59E0B" }]}>
                <View style={[styles.statIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name="close-circle" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.statNum, { color: "#F59E0B" }]}>{totalCuti}</Text>
                <Text style={styles.statLabel}>Total Cuti/Izin</Text>
              </View>
              <View style={[styles.statCard, { borderColor: "#6366F1" }]}>
                <View style={[styles.statIcon, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="people" size={20} color="#6366F1" />
                </View>
                <Text style={[styles.statNum, { color: "#6366F1" }]}>{totalPerawat}</Text>
                <Text style={styles.statLabel}>Total Perawat</Text>
              </View>
            </View>

            {/* BAR CHART */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View>
                  <Text style={styles.sectionTitle}>Rekap Perawat</Text>
                  <Text style={styles.sectionSubtitle}>Jumlah hari masuk vs cuti</Text>
                </View>
                <Ionicons name="bar-chart-outline" size={20} color="#1B9B6F" />
              </View>

              {/* Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#1B9B6F" }]} />
                  <Text style={styles.legendText}>Masuk</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
                  <Text style={styles.legendText}>Cuti/Izin</Text>
                </View>
              </View>

              {chartData.length > 0
                ? <BarChart data={chartData} />
                : <Text style={styles.emptyText}>Tidak ada data</Text>
              }
            </View>

            {/* PIE CHART */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View>
                  <Text style={styles.sectionTitle}>Persentase Kehadiran</Text>
                  <Text style={styles.sectionSubtitle}>Total keseluruhan</Text>
                </View>
                <Ionicons name="pie-chart-outline" size={20} color="#1B9B6F" />
              </View>
              <PieChart masuk={totalMasuk} cuti={totalCuti} />
            </View>

            {/* DETAIL KEHADIRAN */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Detail Kehadiran</Text>
              </View>
              {detailData.length > 0
                ? detailData.map((item, i) => <CardDetail key={i} item={item} />)
                : <Text style={styles.emptyText}>Tidak ada data</Text>
              }
            </View>
          </>
        )}

        {!hasLoaded && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>Pilih bulan & tahun lalu tekan{"\n"}Refresh Data</Text>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}
          onPress={() => router.push("/kepegawaian-dashboard")}>
          <Ionicons name="people-outline" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}
          onPress={() => router.push("/kepegawaian-jadwal")}>
          <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}
          onPress={() => router.push("/kepegawaian-pengajuan")}>
          <View style={styles.navChatActive}>
            <Ionicons name="chatbubble" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart" size={24} color="#1B9B6F" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },

  header: {
    backgroundColor: "#1B9B6F",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 52,
    paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },

  scrollContent: { padding: 16, paddingBottom: 100, gap: 14 },

  // Filter
  filterCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, gap: 12,
  },
  filterRow: { flexDirection: "row", gap: 12 },
  filterCol: { flex: 1, gap: 6 },
  filterLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  filterLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  dropdownBtn: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#fff",
  },
  dropdownValue: { fontSize: 13, color: "#111827" },
  dropdownMenu: {
    position: "absolute", top: 40, left: 0, right: 0,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#D1D5DB",
    borderRadius: 8, zIndex: 999, elevation: 10,
  },
  dropdownItem: { paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  dropdownItemText: { fontSize: 13, color: "#374151" },
  refreshBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#D1FAE5",
  },
  refreshText: { color: "#1B9B6F", fontWeight: "600", fontSize: 13 },

  // Statistik
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12,
    padding: 10, alignItems: "center", borderWidth: 1.5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, gap: 4,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 10, color: "#6B7280", textAlign: "center" },

  // Section card
  sectionCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, gap: 12,
  },
  sectionTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  sectionSubtitle: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },

  // Legend
  legendRow: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: "#6B7280" },

  // Bar chart
  chartContainer: { flexDirection: "row", height: 110, alignItems: "flex-end" },
  yAxis: { width: 24, height: 90, justifyContent: "space-between", alignItems: "flex-end", paddingRight: 4 },
  yLabel: { fontSize: 9, color: "#9CA3AF" },
  barsContainer: { flexDirection: "row", alignItems: "flex-end", height: 100, paddingBottom: 20 },
  barGroup: { alignItems: "center" },
  barPair: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { borderRadius: 3 },
  barLabel: { fontSize: 9, color: "#6B7280", marginTop: 4, textAlign: "center" },

  // Pie chart
  pieWrapper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, paddingVertical: 8 },
  pieOuter: { overflow: "hidden" },
  pieInner: { },
  pieLegend: { gap: 10 },

  // Detail card
  detailCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  detailAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#1B9B6F", justifyContent: "center", alignItems: "center",
  },
  detailInfo: { flex: 1 },
  detailNama: { fontSize: 13, fontWeight: "700", color: "#111827" },
  detailPosisi: { fontSize: 11, color: "#6B7280" },
  detailStats: { flexDirection: "row", gap: 10 },
  detailStatItem: { alignItems: "center", gap: 2 },
  detailStatNum: { fontSize: 14, fontWeight: "700", color: "#111827" },
  detailStatLabel: { fontSize: 10, color: "#6B7280" },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusChipText: { fontSize: 10, fontWeight: "700" },

  // Empty
  emptyText: { color: "#9CA3AF", fontSize: 13, textAlign: "center", paddingVertical: 20 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 14 },
  emptyStateText: { color: "#9CA3AF", fontSize: 14, textAlign: "center", lineHeight: 22 },

  // Bottom Nav
  bottomNav: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E5E7EB", elevation: 10,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  navChatActive: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#1B9B6F",
    justifyContent: "center", alignItems: "center", marginTop: -10,
  },
});