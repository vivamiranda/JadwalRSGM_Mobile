import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../supabase";

const shiftInfo: Record<string, string> = {
  AP: "07.00 - 14.00",
  S1: "07.00 - 14.00",
  S: "14.00 - 21.00",
  B: "21.00 - 07.00",
};

const shiftPoli: Record<string, string> = {
  AP: "Poli Pagi/OK",
  S1: "Poli, Anamnesa, Nurse Station, Konditional",
  S: "Poli Siang",
  B: "Poli, Anamnesa, Nurse Station, Konditional",
};

const shiftColor: Record<string, string> = {
  AP: "#ef4444",
  S1: "#EAB308",
  S: "#0d9488",
  B: "#6366f1",
};

export default function PerawatRequest() {
  const [selectedDays, setSelectedDays] = useState<any[]>([]);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState("");
  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const namaLogin = "perawat1";

  const handleConfirmDate = (date: Date) => {
    setTempDate(date);
    setDatePickerVisible(false);
    setShowShiftPicker(true);
  };

  const handlePilihShift = (shift: string) => {
    if (!tempDate) return;
    if (selectedDays.length >= 6) {
      Alert.alert("Maksimal 6 hari!");
      return;
    }

    const tanggal = tempDate.toISOString().split("T")[0];
    const sudahAda = selectedDays.find((d) => d.tanggal === tanggal);
    if (sudahAda) {
      Alert.alert("Tanggal ini sudah dipilih!");
      return;
    }

    setSelectedDays([
      ...selectedDays,
      {
        tanggal,
        shift,
        poli: shiftPoli[shift],
      },
    ]);
    setShowShiftPicker(false);
    setSelectedShift("");
    setTempDate(null);
  };

  const handleHapus = (tanggal: string) => {
    setSelectedDays(selectedDays.filter((d) => d.tanggal !== tanggal));
  };

  const handleSimpan = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("Pilih jadwal dulu!");
      return;
    }

    for (const day of selectedDays) {
      const { error } = await supabase.from("request_jadwal").insert({
        nama_perawat: namaLogin,
        tanggal: day.tanggal,
        shift: day.shift,
        poli: day.poli,
        status: "Menunggu",
        status_admin: "Menunggu persetujuan",
      });

      if (error) {
        Alert.alert("Gagal menyimpan!", error.message);
        return;
      }
    }

    Alert.alert("Request jadwal berhasil dikirim!");
    router.back();
  };

  const formatTanggal = (tgl: string) => {
    return new Date(tgl).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Pengajuan</Text>
            <Text style={styles.headerTitle}>Jadwal</Text>
          </View>
          <TouchableOpacity style={styles.simpanBtn} onPress={handleSimpan}>
            <Text style={styles.simpanTxt}>Simpan</Text>
          </TouchableOpacity>
        </View>

        {/* Pilih Tanggal */}
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setDatePickerVisible(true)}
        >
          <Ionicons name="calendar" size={20} color="#0d9488" />
          <Text style={styles.pickerTxt}>Pilih Tanggal</Text>
        </TouchableOpacity>

        {/* Pilih Shift */}
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => {
            if (!tempDate) {
              Alert.alert("Pilih tanggal dulu!");
              return;
            }
            setShowShiftPicker(true);
          }}
        >
          <Ionicons name="time" size={20} color="#333" />
          <Text style={styles.pickerTxt}>Pilih Shift</Text>
        </TouchableOpacity>
      </View>
      {/* Popup Pilih Shift */}
      {showShiftPicker && (
        <View style={styles.shiftOverlay}>
          <View style={styles.shiftCard}>
            <Text style={styles.shiftTitle}>Pilih Shift</Text>
            {["AP", "S1", "S", "B"].map((shift) => (
              <TouchableOpacity
                key={shift}
                style={styles.shiftItem}
                onPress={() => handlePilihShift(shift)}
              >
                <View>
                  <Text
                    style={[styles.shiftName, { color: shiftColor[shift] }]}
                  >
                    {shift}
                  </Text>
                  <Text style={styles.shiftPoli}>{shiftPoli[shift]}</Text>
                </View>
                <Text style={styles.shiftJam}>{shiftInfo[shift]}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowShiftPicker(false)}>
              <Text style={styles.batalTxt}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisible(false)}
      />

      {/* Rekap Jadwal */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {selectedDays.map((item, index) => (
          <View key={index} style={styles.rekapCard}>
            <Text style={styles.rekapTanggal}>
              {formatTanggal(item.tanggal)}
            </Text>
            <View style={styles.divider} />
            <View style={styles.rekapRow}>
              <Text
                style={[styles.rekapShift, { color: shiftColor[item.shift] }]}
              >
                {item.shift}
              </Text>
              <Text style={styles.rekapJam}>{shiftInfo[item.shift]}</Text>
              <TouchableOpacity onPress={() => handleHapus(item.tanggal)}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {selectedDays.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTxt}>Belum ada jadwal dipilih</Text>
            <Text style={styles.emptySubTxt}>Maksimal 6 hari</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#0d9488",
    padding: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 30,
  },
  simpanBtn: {
    backgroundColor: "#EAB308",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  simpanTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
  pickerBtn: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  pickerTxt: { fontSize: 14, color: "#333" },
  shiftOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  shiftCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  shiftItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  shiftName: { fontSize: 15, fontWeight: "600" },
  shiftJam: { fontSize: 13, color: "#666" },
  batalTxt: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 14,
  },
  rekapCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  rekapTanggal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0d9488",
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 10 },
  rekapRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rekapShift: { fontSize: 14, fontWeight: "600", flex: 1 },
  rekapJam: { fontSize: 13, color: "#666", flex: 1 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyTxt: { color: "#999", fontSize: 14, marginTop: 12 },
  emptySubTxt: { color: "#ccc", fontSize: 12, marginTop: 4 },

  shiftPoli: { fontSize: 11, color: "#999", marginTop: 2 },
});
