import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { supabase } from "../supabase";
import PopupPengajuan from "./popup-pengajuan";

const shiftInfo: Record<string, string> = {
  Pagi: "07.00 - 14.00",
  Siang: "14.00 - 21.00",
  Malam: "21.00 - 07.00",
};

export default function PerawatDashboard() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modeKalender, setModeKalender] = useState<"hari" | "minggu">("hari");
  const namaLogin = "perawat1";
  const [popupVisible, setPopupVisible] = useState(false);
  const [jadwalDipilih, setJadwalDipilih] = useState<any>(null);

  useEffect(() => {
    fetchJadwal();
  }, [selectedDate, modeKalender]);

  const fetchJadwal = async () => {
    const dari = selectedDate.toISOString().split("T")[0];
    let sampai = dari;

    if (modeKalender === "minggu") {
      const akhir = new Date(selectedDate);
      akhir.setDate(selectedDate.getDate() + 6);
      sampai = akhir.toISOString().split("T")[0];
    }

    const { data, error } = await supabase
      .from("jadwal")
      .select("*")
      .gte("tanggal", dari)
      .lte("tanggal", sampai)
      .order("tanggal", { ascending: true });

    if (!error && data) setJadwal(data);
  };

  const handleConfirmDate = (date: Date) => {
    setSelectedDate(date);
    setDatePickerVisible(false);
  };

  const filtered = jadwal.filter((j) =>
    j.nama_perawat.toLowerCase().includes(search.toLowerCase()),
  );

  const formatTanggal = (tgl: string) => {
    return new Date(tgl).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ImageBackground
        source={require("../assets/images/backroundrsgm1.png")}
        style={styles.header}
      >
        <View style={styles.headerOverlay}>
          {/* Profil */}
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerName}>Perawat RSGM</Text>
              <Text style={styles.headerRole}>Perawat Gigi</Text>
            </View>
          </View>

          {/* Search + Kalender */}
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#999"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="cari jadwal"
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
              <Ionicons name="calendar-outline" size={22} color="#0d9488" />
            </TouchableOpacity>
          </View>

          {/* Toggle hari/minggu */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              onPress={() => setModeKalender("hari")}
              style={[
                styles.modeBtn,
                modeKalender === "hari" && styles.modeBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.modeTxt,
                  modeKalender === "hari" && styles.modeTxtActive,
                ]}
              >
                1 Hari
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModeKalender("minggu")}
              style={[
                styles.modeBtn,
                modeKalender === "minggu" && styles.modeBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.modeTxt,
                  modeKalender === "minggu" && styles.modeTxtActive,
                ]}
              >
                1 Minggu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisible(false)}
      />

      <Text style={styles.sectionTitle}>Jadwal Perawat</Text>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInner}>
              <View style={styles.cardTop}>
                <View style={styles.avatarSmall}>
                  <Ionicons name="person" size={22} color="#fff" />
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardNameRow}>
                    <Text style={styles.cardName}>{item.nama_perawat}</Text>
                    <Text style={styles.cardPoli}>{item.poli}</Text>
                  </View>
                  <Text style={styles.cardTanggal}>
                    {formatTanggal(item.tanggal)}
                  </Text>
                  <Text style={styles.cardJam}>{shiftInfo[item.shift]}</Text>
                  <View style={styles.shiftBadge}>
                    <Text style={styles.shiftText}>{item.shift}</Text>
                  </View>
                </View>
              </View>
              {item.nama_perawat === namaLogin && (
                <TouchableOpacity
                  style={styles.ajukanBtn}
                  onPress={() => {
                    setJadwalDipilih(item);
                    setPopupVisible(true);
                  }}
                >
                  <Text style={styles.ajukanText}>Ajukan Perubahan</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar" size={26} color="#0d9488" />
          <Text style={styles.navLabel}>Jadwal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/perawat-riwayat")}
        >
          <Ionicons name="document-text-outline" size={26} color="#999" />
          <Text style={styles.navLabelInactive}>Riwayat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/perawat-profil")}
        >
          <Ionicons name="person-outline" size={26} color="#999" />
          <Text style={styles.navLabelInactive}>Profil</Text>
        </TouchableOpacity>
      </View>
      {jadwalDipilih && (
        <PopupPengajuan
          visible={popupVisible}
          onClose={() => setPopupVisible(false)}
          jadwal={jadwalDipilih}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { width: "100%" },
  headerOverlay: {
    backgroundColor: "rgba(13, 148, 136, 0.7)",
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerName: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerRole: { color: "#ccfbf1", fontSize: 13 },
  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#333" },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  modeBtnActive: { backgroundColor: "#fff" },
  modeTxt: { color: "#fff", fontSize: 12, fontWeight: "500" },
  modeTxtActive: { color: "#0d9488" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  card: {
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#EAB308",
    backgroundColor: "#fff",
    elevation: 2,
    overflow: "hidden",
  },
  cardInner: { padding: 14 },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0d9488",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: { flex: 1 },
  cardNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardName: { fontSize: 15, fontWeight: "bold", color: "#1a1a1a" },
  cardPoli: { fontSize: 12, color: "#666" },
  cardTanggal: { fontSize: 12, color: "#444" },
  cardJam: { fontSize: 12, color: "#444", marginBottom: 6 },
  shiftBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#FEF9C3",
  },
  shiftText: { fontSize: 11, fontWeight: "600", color: "#444" },
  ajukanBtn: {
    backgroundColor: "#0d9488",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  ajukanText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  bottomNav: {
    flexDirection: "row",

    backgroundColor: "#fff",

    position: "absolute",

    bottom: 0,
    left: 0,
    right: 0,

    paddingTop: 12,
    paddingBottom: 28,

    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,

    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },

  navLabel: {
    fontSize: 12,
    color: "#0d9488",
    marginTop: 4,
    fontWeight: "600",
  },

  navLabelInactive: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});
