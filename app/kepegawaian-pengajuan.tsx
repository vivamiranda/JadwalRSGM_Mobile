import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, StatusBar, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../supabase";

// ─────────────────────────────────────────────
// TIPE DATA
// ─────────────────────────────────────────────
type StatusPengajuan = "Menunggu" | "Disetujui" | "Ditolak";

interface Pengajuan {
  id: number;
  nama_perawat: string;
  tanggal: string;
  shift: string;
  poli: string;
  alasan: string;
  jenis: string;
  status_kepala: StatusPengajuan;
  status_direktur: StatusPengajuan;
}

interface RequestJadwal {
  id: number;
  nama_perawat: string;
  tanggal: string;
  shift: string;
  poli: string;
  alasan: string;
  status_kepala: StatusPengajuan;
}

// ─────────────────────────────────────────────
// WARNA STATUS
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Menunggu:  { bg: "#FEF3C7", text: "#D97706" },
    Disetujui: { bg: "#D1FAE5", text: "#065F46" },
    Ditolak:   { bg: "#FEE2E2", text: "#991B1B" },
  };
  const c = colors[status] ?? { bg: "#F3F4F6", text: "#374151" };
  return (
    <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.statusText, { color: c.text }]}>{status}</Text>
    </View>
  );
}

function ApprovalChip({ label, status }: { label: string; status: string }) {
  const isSetuju = status === "Disetujui";
  const isTolak = status === "Ditolak";
  return (
    <View style={styles.approvalChip}>
      <Text style={styles.approvalLabel}>{label}</Text>
      <Text style={[
        styles.approvalStatus,
        isSetuju && { color: "#10B981" },
        isTolak && { color: "#EF4444" },
        !isSetuju && !isTolak && { color: "#F59E0B" },
      ]}>
        {isSetuju ? "• Disetujui" : isTolak ? "• Ditolak" : "• Menunggu persetujuan"}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// CARD PERUBAHAN JADWAL
// ─────────────────────────────────────────────
function CardPerubahan({ item }: { item: Pengajuan }) {
  const statusAkhir =
    item.status_direktur === "Disetujui" && item.status_kepala === "Disetujui"
      ? "Disetujui"
      : item.status_direktur === "Ditolak" || item.status_kepala === "Ditolak"
      ? "Ditolak"
      : "Menunggu";

  return (
    <View style={styles.card}>
      {/* Header card */}
      <View style={styles.cardTopRow}>
        <Text style={styles.cardJenis}>{item.jenis || "Izin Sakit"}</Text>
        <StatusBadge status={statusAkhir} />
      </View>

      {/* Info jadwal */}
      <View style={styles.cardJadwalRow}>
        <Ionicons name="time-outline" size={14} color="#6B7280" />
        <Text style={styles.cardJadwalText}>
          {item.tanggal} | {item.shift} - {item.poli}
        </Text>
      </View>

      {/* Alasan */}
      <View style={styles.alasanBox}>
        <Text style={styles.alasanText}>{item.alasan}</Text>
      </View>

      {/* Approval status */}
      <View style={styles.approvalRow}>
        <ApprovalChip label="Kepala Perawat" status={item.status_kepala} />
        <ApprovalChip label="Direktur" status={item.status_direktur} />
      </View>

      {/* Tombol cetak jika sudah disetujui */}
      {statusAkhir === "Disetujui" && (
        <TouchableOpacity style={styles.cetakBtn}>
          <Ionicons name="print-outline" size={14} color="#6B7280" />
          <Text style={styles.cetakText}>Cetak surat izin</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// CARD REQUEST JADWAL
// ─────────────────────────────────────────────
function CardRequest({ item, onSetujui, onTolak }: {
  item: RequestJadwal;
  onSetujui: () => void;
  onTolak: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardNama}>{item.nama_perawat}</Text>
        <StatusBadge status={item.status_kepala} />
      </View>

      <View style={styles.cardJadwalRow}>
        <Ionicons name="time-outline" size={14} color="#6B7280" />
        <Text style={styles.cardJadwalText}>
          {item.tanggal} | {item.shift} - {item.poli}
        </Text>
      </View>

      <View style={styles.approvalRow}>
        <ApprovalChip label="Kepala Perawat" status={item.status_kepala} />
      </View>

      {/* Tombol setujui/tolak hanya jika masih menunggu */}
      {item.status_kepala === "Menunggu" && (
        <View style={styles.actionBtnRow}>
          <TouchableOpacity style={styles.btnSetujui} onPress={onSetujui}>
            <Text style={styles.btnSetujuiText}>Setujui</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnTolak} onPress={onTolak}>
            <Text style={styles.btnTolakText}>Tolak</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// LAYAR UTAMA
// ─────────────────────────────────────────────
export default function KepegawaianPengajuan() {
  const [activeTab, setActiveTab] = useState<"perubahan" | "request">("perubahan");
  const [perubahan, setPerubahan] = useState<Pengajuan[]>([]);
  const [requests, setRequests] = useState<RequestJadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPerubahan = async () => {
    const { data } = await supabase
      .from("pengajuan")
      .select("*")
      .order("id", { ascending: false });
    setPerubahan(data || []);
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("request_jadwal")
      .select("*")
      .order("id", { ascending: false });
    setRequests(data || []);
  };

  const fetchAll = useCallback(async () => {
    try {
      await Promise.all([fetchPerubahan(), fetchRequests()]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Approve / Tolak request jadwal
  const handleRequestAction = async (id: number, action: "Disetujui" | "Ditolak") => {
    try {
      await supabase
        .from("request_jadwal")
        .update({ status_kepala: action })
        .eq("id", id);
      setRequests((prev) =>
        prev.map((r) => r.id === id ? { ...r, status_kepala: action } : r)
      );
    } catch (e) {
      Alert.alert("Gagal", "Tidak dapat memperbarui status");
    }
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
        <Text style={styles.headerTitle}>Pengajuan</Text>
      </View>

      {/* TAB */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "perubahan" && styles.tabBtnActive]}
          onPress={() => setActiveTab("perubahan")}
        >
          <Text style={[styles.tabText, activeTab === "perubahan" && styles.tabTextActive]}>
            Perubahan Jadwal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "request" && styles.tabBtnActive]}
          onPress={() => setActiveTab("request")}
        >
          <Text style={[styles.tabText, activeTab === "request" && styles.tabTextActive]}>
            Request Jadwal
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      {activeTab === "perubahan" ? (
        <FlatList
          data={perubahan}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAll(); }}
              colors={["#1B9B6F"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Tidak ada pengajuan</Text>
            </View>
          }
          renderItem={({ item }) => <CardPerubahan item={item} />}
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAll(); }}
              colors={["#1B9B6F"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Tidak ada request jadwal</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CardRequest
              item={item}
              onSetujui={() => handleRequestAction(item.id, "Disetujui")}
              onTolak={() => handleRequestAction(item.id, "Ditolak")}
            />
          )}
        />
      )}

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
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navChatActive}>
            <Ionicons name="chatbubble" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart-outline" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#1B9B6F",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 52,
    paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },

  // Tab
  tabBar: {
    flexDirection: "row", backgroundColor: "#fff",
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 12, padding: 4, elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#1B9B6F" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: "#fff" },

  // List
  listContent: { padding: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: "#fff", borderRadius: 14,
    padding: 14, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: 10,
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardJenis: { fontSize: 14, fontWeight: "700", color: "#111827" },
  cardNama: { fontSize: 14, fontWeight: "700", color: "#111827" },
  cardJadwalRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardJadwalText: { fontSize: 12, color: "#6B7280" },

  // Alasan
  alasanBox: {
    backgroundColor: "#F9FAFB", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  alasanText: { fontSize: 12, color: "#374151" },

  // Approval
  approvalRow: { flexDirection: "row", gap: 10 },
  approvalChip: {
    flex: 1, backgroundColor: "#F9FAFB", borderRadius: 8,
    padding: 8, gap: 2,
  },
  approvalLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  approvalStatus: { fontSize: 11, fontWeight: "600", color: "#F59E0B" },

  // Status badge
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Cetak
  cetakBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: "#D1D5DB",
  },
  cetakText: { fontSize: 12, color: "#6B7280", fontWeight: "600" },

  // Action buttons
  actionBtnRow: { flexDirection: "row", gap: 10 },
  btnSetujui: {
    flex: 1, backgroundColor: "#1B9B6F", borderRadius: 8,
    paddingVertical: 10, alignItems: "center",
  },
  btnSetujuiText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnTolak: {
    flex: 1, backgroundColor: "#FEE2E2", borderRadius: 8,
    paddingVertical: 10, alignItems: "center",
  },
  btnTolakText: { color: "#991B1B", fontWeight: "700", fontSize: 13 },

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