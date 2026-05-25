import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../supabase";

const HIJAU = "#2C7A6E";

const BULAN_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

const formatTglLengkap = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTglPendek = (iso: string) => {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const getNomorSurat = () => {
  const now = new Date();
  const bulan = String(now.getMonth()+1).padStart(2,"0");
  const tahun = now.getFullYear();
  const random = String(Math.floor(Math.random()*900)+100);
  return `${random}/RSGM.UNIMUS/KM/${tahun}`;
};

const getTanggalSurat = () => {
  const now = new Date();
  return `Semarang, ${now.getDate()} ${BULAN_ID[now.getMonth()]} ${now.getFullYear()}`;
};

export default function KepegawaianSuratIzin() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);
  const [perawat, setPerawat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const nomorSurat = getNomorSurat();

  useEffect(() => {
    const fetch = async () => {
      const { data: row } = await supabase
        .from("pengajuan").select("*").eq("id", id).single();
      setData(row);

      if (row?.nama_perawat) {
        const { data: p } = await supabase
          .from("user").select("*")
          .eq("nama_lengkap", row.nama_perawat).maybeSingle();
        setPerawat(p);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Surat Izin ${data?.jenis_izin} - ${data?.nama_perawat}\nTanggal: ${formatTglPendek(data?.tanggal_jadwal)}\nShift: ${data?.shift} - ${data?.poli}`,
        title: `Surat Izin ${data?.nama_perawat}`,
      });
    } catch (e) {
      Alert.alert("Error", "Gagal berbagi surat");
    }
  };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={HIJAU} />
    </View>
  );

  const jenisIzinLabel = (() => {
    const j = (data?.jenis_izin ?? "").toLowerCase();
    if (j.includes("sakit")) return "Izin Sakit";
    if (j.includes("cuti")) return "Cuti";
    return data?.jenis_izin ?? "Izin";
  })();

  const alasanText = data?.keterangan && data?.keterangan !== "-"
    ? data.keterangan
    : data?.surat_sakit && data?.surat_sakit !== "-"
    ? `Sakit (disertai surat dokter)`
    : "Keperluan pribadi";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HIJAU} />

      {/* HEADER APP */}
      <View style={[styles.appHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Surat Izin</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ══════════════════════════════════
            SURAT RESMI
        ══════════════════════════════════ */}
        <View style={styles.suratContainer}>

          {/* KOP SURAT */}
          <View style={styles.kop}>
            {/* Logo placeholder */}
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>RSGM</Text>
              <Text style={styles.logoSub}>Unimus</Text>
            </View>
            <View style={styles.kopTeks}>
              <Text style={styles.kopRS}>RUMAH SAKIT GIGI DAN MULUT (RSGM)</Text>
              <Text style={styles.kopUniv}>UNIVERSITAS MUHAMMADIYAH SEMARANG</Text>
              <Text style={styles.kopAlamat}>
                Jl. Kedungmundu No. 22 Semarang. Telp. 024-76601005 / 76601007
              </Text>
              <Text style={styles.kopAlamat}>
                Fax: 024-76418002, email: rsgm@unimus.ac.id
              </Text>
            </View>
          </View>

          {/* Garis hijau tebal */}
          <View style={styles.garisHijau} />
          <View style={styles.garisTipis} />

          {/* BISMILLAH */}
          <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>

          {/* NOMOR & TANGGAL */}
          <View style={styles.metaRow}>
            <View style={styles.metaKiri}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Nomor</Text>
                <Text style={styles.metaSep}>:</Text>
                <Text style={styles.metaValue}>{nomorSurat}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Lampiran</Text>
                <Text style={styles.metaSep}>:</Text>
                <Text style={styles.metaValue}>
                  {data?.surat_sakit && data?.surat_sakit !== "-" ? "1 lembar surat dokter" : "-"}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Hal</Text>
                <Text style={styles.metaSep}>:</Text>
                <Text style={[styles.metaValue, { fontWeight: "700" }]}>
                  Surat Keterangan {jenisIzinLabel}
                </Text>
              </View>
            </View>
            <View style={styles.metaKanan}>
              <Text style={styles.metaTanggal}>{getTanggalSurat()}</Text>
            </View>
          </View>

          {/* KEPADA */}
          <View style={styles.section}>
            <Text style={styles.bodyText}>Kepada Yth.:</Text>
            <Text style={styles.bodyBold}>Kepala Unit Pelayanan</Text>
            <Text style={styles.bodyText}>RSGM Universitas Muhammadiyah Semarang</Text>
            <Text style={styles.bodyText}>Di Tempat</Text>
          </View>

          {/* SALAM */}
          <View style={styles.section}>
            <Text style={[styles.bodyText, { fontStyle: "italic" }]}>
              Assalamu'alaikum wr. wb.
            </Text>
            <Text style={[styles.bodyText, { marginTop: 8, textAlign: "justify" }]}>
              Dengan hormat, melalui surat ini kami sampaikan bahwa tenaga keperawatan
              RSGM Universitas Muhammadiyah Semarang yang tersebut di bawah ini:
            </Text>
          </View>

          {/* DATA PERAWAT */}
          <View style={styles.dataBox}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Nama</Text>
              <Text style={styles.dataSep}>:</Text>
              <Text style={styles.dataValue}>{data?.nama_perawat ?? "-"}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>NIP</Text>
              <Text style={styles.dataSep}>:</Text>
              <Text style={styles.dataValue}>{perawat?.nip ?? "-"}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Jabatan/Posisi</Text>
              <Text style={styles.dataSep}>:</Text>
              <Text style={styles.dataValue}>{perawat?.posisi ?? "Perawat"}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Unit/Poli</Text>
              <Text style={styles.dataSep}>:</Text>
              <Text style={styles.dataValue}>{data?.poli ?? "-"}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Tanggal</Text>
              <Text style={styles.dataSep}>:</Text>
              <Text style={styles.dataValue}>{formatTglLengkap(data?.tanggal_jadwal)}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Shift</Text>
              <Text style={styles.dataSep}>:</Text>
              <Text style={styles.dataValue}>{data?.shift ?? "-"}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Jenis Izin</Text>
              <Text style={styles.dataSep}>:</Text>
              <Text style={styles.dataValue}>{jenisIzinLabel}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Keterangan</Text>
              <Text style={styles.dataSep}>:</Text>
              <Text style={styles.dataValue}>{alasanText}</Text>
            </View>
          </View>

          {/* ISI SURAT */}
          <View style={styles.section}>
            <Text style={[styles.bodyText, { textAlign: "justify" }]}>
              Sehubungan dengan hal tersebut, yang bersangkutan tidak dapat melaksanakan
              tugas jaga pada tanggal dan shift yang tertera di atas. Kami mohon
              kiranya dapat dimaklumi dan disetujui.
            </Text>
            <Text style={[styles.bodyText, { textAlign: "justify", marginTop: 8 }]}>
              Demikian surat keterangan ini kami sampaikan. Atas perhatian dan
              kebijaksanaan Bapak/Ibu, kami ucapkan terima kasih.
            </Text>
          </View>

          {/* PENUTUP */}
          <View style={styles.section}>
            <Text style={[styles.bodyText, { fontStyle: "italic" }]}>
              Wassalamu'alaikum wr. wb.
            </Text>
          </View>

          {/* TANDA TANGAN */}
          <View style={styles.ttdContainer}>
            <View style={styles.ttdKiri}>
              <Text style={styles.ttdJudul}>Mengetahui,</Text>
              <Text style={styles.ttdJabatan}>Kepala Perawat RSGM Unimus</Text>
              <View style={styles.ttdSpace} />
              <View style={styles.ttdGaris} />
              <Text style={styles.ttdNama}>__________________</Text>
            </View>
            <View style={styles.ttdKanan}>
              <Text style={styles.ttdJudul}>{getTanggalSurat()}</Text>
              <Text style={styles.ttdJabatan}>Bagian Kepegawaian</Text>
              <View style={styles.ttdSpace} />
              <View style={styles.ttdGaris} />
              <Text style={styles.ttdNama}>__________________</Text>
            </View>
          </View>

          {/* STATUS PERSETUJUAN */}
          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>Status Persetujuan</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Kepala Perawat</Text>
                <View style={[styles.statusBadge, {
                  backgroundColor: data?.status_admin === "Disetujui" ? "#D1FAE5" : "#FEF3C7"
                }]}>
                  <Text style={[styles.statusBadgeTxt, {
                    color: data?.status_admin === "Disetujui" ? "#065F46" : "#92400E"
                  }]}>
                    {data?.status_admin === "Disetujui" ? "✓ Disetujui" : "⏳ Menunggu"}
                  </Text>
                </View>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Direktur</Text>
                <View style={[styles.statusBadge, {
                  backgroundColor: data?.status_direktur === "Disetujui" ? "#D1FAE5" : "#FEF3C7"
                }]}>
                  <Text style={[styles.statusBadgeTxt, {
                    color: data?.status_direktur === "Disetujui" ? "#065F46" : "#92400E"
                  }]}>
                    {data?.status_direktur === "Disetujui" ? "✓ Disetujui" : "⏳ Menunggu"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

        </View>

        {/* Tombol Share */}
        <TouchableOpacity style={styles.btnShare} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#fff" />
          <Text style={styles.btnShareTxt}>Bagikan Surat</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F0F0" },
  appHeader: {
    backgroundColor: HIJAU, paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: "row", alignItems: "center",
  },
  backBtn: { padding: 4 },
  appHeaderTitle: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" },
  shareBtn: { padding: 4 },
  scrollContent: { padding: 12, paddingBottom: 40 },

  // Surat
  suratContainer: {
    backgroundColor: "#fff", borderRadius: 8,
    padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },

  // Kop
  kop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  logoPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: HIJAU,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "#F0FDF4",
  },
  logoText: { fontSize: 12, fontWeight: "800", color: HIJAU },
  logoSub: { fontSize: 8, color: HIJAU },
  kopTeks: { flex: 1 },
  kopRS: { fontSize: 11, fontWeight: "700", color: "#111", textAlign: "center" },
  kopUniv: { fontSize: 13, fontWeight: "800", color: HIJAU, textAlign: "center", lineHeight: 18 },
  kopAlamat: { fontSize: 9, color: "#444", textAlign: "center", lineHeight: 14 },

  garisHijau: { height: 4, backgroundColor: HIJAU, marginVertical: 2 },
  garisTipis: { height: 1.5, backgroundColor: "#2C9B70", marginBottom: 12 },

  bismillah: { fontSize: 16, textAlign: "center", marginBottom: 12, color: "#111" },

  // Meta
  metaRow: { flexDirection: "row", marginBottom: 16, gap: 8 },
  metaKiri: { flex: 1, gap: 4 },
  metaKanan: { alignItems: "flex-end", justifyContent: "flex-start" },
  metaTanggal: { fontSize: 11, color: "#111" },
  metaItem: { flexDirection: "row", gap: 4 },
  metaLabel: { fontSize: 11, color: "#111", width: 60 },
  metaSep: { fontSize: 11, color: "#111" },
  metaValue: { fontSize: 11, color: "#111", flex: 1 },

  // Section
  section: { marginBottom: 12 },
  bodyText: { fontSize: 11, color: "#111", lineHeight: 18 },
  bodyBold: { fontSize: 11, color: "#111", fontWeight: "700", lineHeight: 18 },

  // Data box
  dataBox: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 6,
    padding: 12, marginBottom: 12, gap: 4, backgroundColor: "#FAFAFA",
  },
  dataRow: { flexDirection: "row", gap: 6 },
  dataLabel: { fontSize: 11, color: "#444", width: 90 },
  dataSep: { fontSize: 11, color: "#444" },
  dataValue: { fontSize: 11, color: "#111", fontWeight: "500", flex: 1 },

  // TTD
  ttdContainer: { flexDirection: "row", marginTop: 20, marginBottom: 16, gap: 10 },
  ttdKiri: { flex: 1, alignItems: "center" },
  ttdKanan: { flex: 1, alignItems: "center" },
  ttdJudul: { fontSize: 11, color: "#111", textAlign: "center" },
  ttdJabatan: { fontSize: 10, color: "#555", textAlign: "center", marginBottom: 4 },
  ttdSpace: { height: 50 },
  ttdGaris: { height: 1, backgroundColor: "#111", width: "80%" },
  ttdNama: { fontSize: 10, color: "#111", marginTop: 4 },

  // Status
  statusBox: {
    borderTopWidth: 1, borderTopColor: "#E5E7EB",
    paddingTop: 12, marginTop: 8,
  },
  statusTitle: { fontSize: 11, fontWeight: "700", color: "#111", marginBottom: 8 },
  statusRow: { flexDirection: "row", gap: 10 },
  statusItem: { flex: 1, gap: 4 },
  statusLabel: { fontSize: 10, color: "#6B7280" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
  statusBadgeTxt: { fontSize: 10, fontWeight: "700" },

  // Btn share
  btnShare: {
    backgroundColor: HIJAU, borderRadius: 12, paddingVertical: 14,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    gap: 8, marginTop: 16,
  },
  btnShareTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});