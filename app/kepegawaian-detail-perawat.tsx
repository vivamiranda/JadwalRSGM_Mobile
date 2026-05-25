import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../supabase";

const HIJAU = "#2C7A6E";

const formatTanggal = (iso: string) => {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${d} ${bulan[parseInt(m)-1]} ${y}`;
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={HIJAU} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "-"}</Text>
      </View>
    </View>
  );
}

export default function KepegawaianDetailPerawat() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: row } = await supabase.from("user").select("*").eq("id", id).single();
      setData(row);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={HIJAU} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HIJAU} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>data perawat</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Informasi Perawat */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="person-circle" size={20} color={HIJAU} />
            <Text style={styles.cardTitle}>Informasi Perawat</Text>
          </View>
          <InfoRow icon="person-outline" label="Nama Lengkap" value={data?.nama_lengkap} />
          <InfoRow icon="card-outline" label="NIP" value={data?.nip} />
          <InfoRow icon="male-female-outline" label="Jenis Kelamin" value={data?.jenis_kelamin} />
          <InfoRow icon="location-outline" label="Tempat, Tanggal Lahir"
            value={data?.tempat_lahir && data?.tanggal_lahir
              ? `${data.tempat_lahir}, ${formatTanggal(data.tanggal_lahir)}` : "-"} />
          <InfoRow icon="home-outline" label="Alamat" value={data?.alamat} />
          <InfoRow icon="call-outline" label="No. Telepon" value={data?.no_telepon} />
          <InfoRow icon="mail-outline" label="Email" value={data?.email} />
          <InfoRow icon="school-outline" label="Pendidikan" value={data?.pendidikan_terakhir} />

          {/* Posisi badge */}
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={18} color={HIJAU} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Posisi</Text>
              <View style={styles.badgePosisi}>
                <Text style={styles.badgePosisiText}>{data?.posisi || "-"}</Text>
              </View>
            </View>
          </View>

          <InfoRow icon="calendar-outline" label="Tanggal Masuk" value={formatTanggal(data?.tanggal_masuk)} />

          {/* Status badge */}
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={HIJAU} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[styles.badgeStatus,
                { backgroundColor: data?.status === "Aktif" ? "#D1FAE5" : "#FEE2E2" }]}>
                <Text style={[styles.badgeStatusText,
                  { color: data?.status === "Aktif" ? "#065F46" : "#991B1B" }]}>
                  {data?.status || "-"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dokumen */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="document-text" size={20} color={HIJAU} />
            <Text style={styles.cardTitle}>Dokumen Perawat</Text>
            <TouchableOpacity style={styles.uploadBtn}>
              <Ionicons name="cloud-upload-outline" size={14} color="#fff" />
              <Text style={styles.uploadBtnText}>Upload Dokumen</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyDokumen}>
            <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyDokumenText}>Belum ada dokumen</Text>
          </View>
        </View>

        {/* Tombol Edit */}
        <TouchableOpacity style={styles.btnEdit}
          onPress={() => router.push({ pathname: "/kepegawaian-edit-perawat" as any, params: { id } })}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.btnEditText}>Edit Data Perawat</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    backgroundColor: HIJAU, paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, gap: 12,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoIcon: { marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 2 },
  infoValue: { fontSize: 13, color: "#111827", fontWeight: "500" },
  badgePosisi: {
    alignSelf: "flex-start", backgroundColor: "#D1FAE5",
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  badgePosisiText: { fontSize: 12, color: "#065F46", fontWeight: "600" },
  badgeStatus: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeStatusText: { fontSize: 12, fontWeight: "600" },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: HIJAU,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4,
  },
  uploadBtnText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  emptyDokumen: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyDokumenText: { color: "#9CA3AF", fontSize: 13 },
  btnEdit: {
    backgroundColor: HIJAU, borderRadius: 12, paddingVertical: 14,
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8,
  },
  btnEditText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});