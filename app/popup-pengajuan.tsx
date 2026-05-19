import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../supabase";

interface Props {
  visible: boolean;
  onClose: () => void;
  jadwal: {
    nama_perawat: string;
    tanggal: string;
    shift: string;
    poli: string;
  };
}

export default function PopupPengajuan({ visible, onClose, jadwal }: Props) {
  const [jenisIzin, setJenisIzin] = useState<"sakit" | "cuti" | null>(null);
  const [keterangan, setKeterangan] = useState("");
  const [suratSakit, setSuratSakit] = useState<string | null>(null);
  const [namaSurat, setNamaSurat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });
    if (!result.canceled && result.assets.length > 0) {
      setSuratSakit(result.assets[0].uri);
      setNamaSurat(result.assets[0].name);
    }
  };

  const handleSubmit = async () => {
    if (!jenisIzin) {
      Alert.alert("Pilih jenis izin dulu!");
      return;
    }
    if (jenisIzin === "sakit" && !suratSakit) {
      Alert.alert("Surat sakit wajib diupload!");
      return;
    }
    if (jenisIzin === "cuti" && !keterangan) {
      Alert.alert("Keterangan wajib diisi!");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("pengajuan").insert({
      nama_perawat: jadwal.nama_perawat,
      jenis_izin: jenisIzin === "sakit" ? "Izin Sakit" : "Izin/Cuti",
      tanggal_jadwal: jadwal.tanggal,
      shift: jadwal.shift,
      poli: jadwal.poli,
      keterangan: keterangan || "-",
      surat_sakit: namaSurat || "-",
      status: "Menunggu",
      status_admin: "Menunggu persetujuan",
      status_direktur: "Menunggu persetujuan",
    });
    setLoading(false);

    if (error) {
      Alert.alert("Gagal mengirim pengajuan!");
      return;
    }

    Alert.alert("Pengajuan berhasil dikirim!");
    setJenisIzin(null);
    setKeterangan("");
    setSuratSakit(null);
    setNamaSurat(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ajukan Perubahan</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Info Jadwal */}
            <View style={styles.infoBox}>
              <Ionicons name="time-outline" size={16} color="#0d9488" />
              <Text style={styles.infoText}>
                {new Date(jadwal.tanggal).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                | {jadwal.shift} | {jadwal.poli}
              </Text>
            </View>

            {/* Pilih Jenis Izin */}
            <Text style={styles.label}>Jenis Izin</Text>
            <View style={styles.jenisRow}>
              <TouchableOpacity
                style={[
                  styles.jenisBtn,
                  jenisIzin === "sakit" && styles.jenisBtnActive,
                ]}
                onPress={() => setJenisIzin("sakit")}
              >
                <Ionicons
                  name="medical-outline"
                  size={18}
                  color={jenisIzin === "sakit" ? "#fff" : "#0d9488"}
                />
                <Text
                  style={[
                    styles.jenisTxt,
                    jenisIzin === "sakit" && styles.jenisTxtActive,
                  ]}
                >
                  Izin Sakit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.jenisBtn,
                  jenisIzin === "cuti" && styles.jenisBtnActive,
                ]}
                onPress={() => setJenisIzin("cuti")}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={jenisIzin === "cuti" ? "#fff" : "#0d9488"}
                />
                <Text
                  style={[
                    styles.jenisTxt,
                    jenisIzin === "cuti" && styles.jenisTxtActive,
                  ]}
                >
                  Izin/Cuti
                </Text>
              </TouchableOpacity>
            </View>

            {/* Upload Surat Sakit */}
            {jenisIzin === "sakit" && (
              <View>
                <Text style={styles.label}>Upload Surat Sakit (PDF)</Text>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={handlePickPDF}
                >
                  <Ionicons
                    name="document-attach-outline"
                    size={20}
                    color="#0d9488"
                  />
                  <Text style={styles.uploadTxt}>
                    {namaSurat || "Pilih file PDF"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Keterangan */}
            {jenisIzin === "cuti" && (
              <View>
                <Text style={styles.label}>Keterangan</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Tulis alasan izin/cuti..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={keterangan}
                  onChangeText={setKeterangan}
                />
              </View>
            )}

            {/* Tombol Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitTxt}>
                {loading ? "Mengirim..." : "Kirim Pengajuan"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingVertical: 4,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#1a1a1a" },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#ccfbf1",
  },
  infoText: { fontSize: 13, color: "#0d9488", flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  jenisRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  jenisBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#0d9488",
    borderRadius: 12,
    paddingVertical: 12,
  },
  jenisBtnActive: { backgroundColor: "#0d9488" },
  jenisTxt: { fontSize: 14, color: "#0d9488", fontWeight: "500" },
  jenisTxtActive: { color: "#fff" },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#EAB308",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    backgroundColor: "#FEFCE8",
  },
  uploadTxt: { fontSize: 13, color: "#333", flex: 1 },
  textArea: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    color: "#333",
    textAlignVertical: "top",
    marginBottom: 20,
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: "#0d9488",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  submitTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
