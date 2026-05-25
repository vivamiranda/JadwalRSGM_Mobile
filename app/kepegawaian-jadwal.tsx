import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
  Platform, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../supabase";

// ─────────────────────────────────────────────
// WARNA BADGE PER SHIFT
// ─────────────────────────────────────────────
const SHIFT_COLORS: Record<string, { bg: string; text: string }> = {
  AP:    { bg: "#FEF9C3", text: "#854D0E" },
  S:     { bg: "#DBEAFE", text: "#1E40AF" },
  S1:    { bg: "#FCE7F3", text: "#9D174D" },
  B:     { bg: "#D1FAE5", text: "#065F46" },
  DP:    { bg: "#E0E7FF", text: "#3730A3" },
  CP:    { bg: "#FEE2E2", text: "#991B1B" },
  SABTU: { bg: "#FEF3C7", text: "#92400E" },
  IBS:   { bg: "#F3E8FF", text: "#6B21A8" },
};

function formatTanggal(iso: string) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function AvatarInisial({ nama }: { nama: string }) {
  return (
    <View style={styles.avatar}>
      <Ionicons name="person" size={20} color="#fff" />
    </View>
  );
}

// ─────────────────────────────────────────────
// CARD JADWAL
// ─────────────────────────────────────────────
function CardJadwal({ item }: { item: any }) {
  const shiftColor = SHIFT_COLORS[item.shift] ?? { bg: "#E5E7EB", text: "#374151" };
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <AvatarInisial nama={item.nama_perawat} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardNama}>{item.nama_perawat}</Text>
          <Text style={styles.cardTanggal}>{formatTanggal(item.tanggal)}</Text>
          <View style={[styles.badgeShift, { backgroundColor: shiftColor.bg }]}>
            <Text style={[styles.badgeShiftText, { color: shiftColor.text }]}>
              {item.poli}
            </Text>
          </View>
        </View>
        <View style={styles.jamContainer}>
          <Text style={styles.jamText}>
            {item.jam_mulai && item.jam_selesai
              ? `${item.jam_mulai} - ${item.jam_selesai}`
              : getJamByShift(item.shift)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getJamByShift(shift: string) {
  const map: Record<string, string> = {
    AP: "07.00 - 14.00",
    S: "14.00 - 21.00",
    S1: "12.00 - 21.00",
    B: "09.00 - 16.00",
    DP: "08.00 - 16.00",
    CP: "08.00 - 16.00",
    SABTU: "08.00 - 16.00",
  };
  return map[shift] ?? "-";
}

// ─────────────────────────────────────────────
// LAYAR UTAMA
// ─────────────────────────────────────────────
export default function KepegawaianJadwal() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");

  const toISO = (display: string) => {
    if (!display) return null;
    const parts = display.split("/");
    if (parts.length !== 3 || parts[2].length !== 4) return null;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const fetchData = useCallback(async () => {
    try {
      let query = supabase
        .from("jadwal")
        .select("*")
        .order("tanggal", { ascending: true });

      const isoMulai = toISO(tanggalMulai);
      const isoSelesai = toISO(tanggalSelesai);
      if (isoMulai) query = query.gte("tanggal", isoMulai);
      if (isoSelesai) query = query.lte("tanggal", isoSelesai);

      const { data: rows, error } = await query;
      if (error) throw error;
      setData(rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tanggalMulai, tanggalSelesai]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReset = () => {
    setTanggalMulai("");
    setTanggalSelesai("");
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1B9B6F" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B9B6F" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jadwal Perawat</Text>
      </View>

      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Ionicons name="filter" size={18} color="#1B9B6F" />
        </TouchableOpacity>

        <View style={styles.dateInputWrapper}>
          <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
          <TextInput
            style={styles.dateInput}
            placeholder="dd/mm/tttt"
            placeholderTextColor="#9CA3AF"
            value={tanggalMulai}
            onChangeText={setTanggalMulai}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <Text style={styles.dateSeparator}>|</Text>

        <View style={styles.dateInputWrapper}>
          <TextInput
            style={styles.dateInput}
            placeholder="dd/mm/tttt"
            placeholderTextColor="#9CA3AF"
            value={tanggalSelesai}
            onChangeText={setTanggalSelesai}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            colors={["#1B9B6F"]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Tidak ada jadwal</Text>
          </View>
        }
        renderItem={({ item }) => <CardJadwal item={item} />}
      />

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}
          onPress={() => router.push("/kepegawaian-dashboard")}>
          <Ionicons name="people-outline" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar" size={24} color="#1B9B6F" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}
          onPress={() => router.push("/kepegawaian-pengajuan")}>
          <View style={styles.navChatActive}>
            <Ionicons name="chatbubble" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}
            onPress={() => router.push("/kepegawaian-rekap")}>
            <Ionicons name="bar-chart-outline" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    backgroundColor: "#1B9B6F",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 52,
    paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },

  // Filter
  filterBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", margin: 16, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    gap: 8, elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  filterIconBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#F0FDF4",
    justifyContent: "center", alignItems: "center",
  },
  dateInputWrapper: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 4,
  },
  dateInput: { flex: 1, fontSize: 12, color: "#374151", padding: 0 },
  dateSeparator: { color: "#D1D5DB", fontSize: 16 },
  resetBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "#F3F4F6", borderRadius: 6,
  },
  resetText: { fontSize: 12, color: "#6B7280", fontWeight: "600" },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: "#fff", borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: "#E5E7EB",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#1B9B6F",
    justifyContent: "center", alignItems: "center",
  },
  cardInfo: { flex: 1 },
  cardNama: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 2 },
  cardTanggal: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  badgeShift: {
    alignSelf: "flex-start", paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: 20,
  },
  badgeShiftText: { fontSize: 11, fontWeight: "600" },
  jamContainer: { alignItems: "flex-end", justifyContent: "center" },
  jamText: {
    fontSize: 12, color: "#374151", fontWeight: "600",
    backgroundColor: "#F3F4F6", paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 8,
  },

  // Empty
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: "#9CA3AF", fontSize: 14 },

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