import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../supabase";

export default function PerawatProfil() {
  const [profil, setProfil] = useState<any>(null);
  const [modalNama, setModalNama] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);
  const [namaBaru, setNamaBaru] = useState("");
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const namaLogin = "perawat1";

  useEffect(() => {
    fetchProfil();
  }, []);

  const fetchProfil = async () => {
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("username", namaLogin)
      .single();
    if (!error && data) setProfil(data);
  };

  const handleGantiNama = async () => {
    if (!namaBaru) {
      Alert.alert("Nama tidak boleh kosong!");
      return;
    }
    const { error } = await supabase
      .from("user")
      .update({ nama_lengkap: namaBaru })
      .eq("username", namaLogin);
    if (error) {
      Alert.alert("Gagal update nama!");
      return;
    }
    Alert.alert("Nama berhasil diubah!");
    setModalNama(false);
    setNamaBaru("");
    fetchProfil();
  };

  const handleGantiPassword = async () => {
    if (!passwordLama || !passwordBaru) {
      Alert.alert("Semua kolom harus diisi!");
      return;
    }
    if (profil.password !== passwordLama) {
      Alert.alert("Password lama salah!");
      return;
    }
    const { error } = await supabase
      .from("user")
      .update({ password: passwordBaru })
      .eq("username", namaLogin);
    if (error) {
      Alert.alert("Gagal update password!");
      return;
    }
    Alert.alert("Password berhasil diubah!");
    setModalPassword(false);
    setPasswordLama("");
    setPasswordBaru("");
  };

  const handleGantiFoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Izin akses galeri diperlukan!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await supabase
        .from("user")
        .update({ foto_profil: uri })
        .eq("username", namaLogin);
      fetchProfil();
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Yakin mau keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => router.replace("/login"),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header + Foto Card dibungkus */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Foto Card overlap ke header */}
        <View style={styles.fotoCard}>
          {profil?.foto_profil ? (
            <Image source={{ uri: profil.foto_profil }} style={styles.foto} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
          )}
          <TouchableOpacity
            style={styles.editFotoBtn}
            onPress={handleGantiFoto}
          >
            <Text style={styles.editFotoTxt}>edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Menu - Tiap item card terpisah */}
        <View style={styles.menuContainer}>
          {/* Nama */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => setModalNama(true)}
          >
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="person-outline" size={28} color="#444" />
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>Nama</Text>
                  <Text style={styles.menuValue}>
                    {profil?.nama_lengkap || "-"}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
          </TouchableOpacity>

          {/* Keamanan */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => setModalPassword(true)}
          >
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="key-outline" size={22} color="#0d9488" />
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>Keamanan</Text>
                  <Text style={styles.menuValue}>Password</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
          </TouchableOpacity>

          {/* Tentang */}
          <View style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#0d9488"
                />
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>Tentang</Text>
                  <Text
                    style={[
                      styles.menuValue,
                      {
                        color:
                          profil?.status === "Aktif" ? "#22c55e" : "#ef4444",
                      },
                    ]}
                  >
                    {profil?.status || "Aktif"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Tombol Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutTxt}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Ganti Nama */}
      <Modal visible={modalNama} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nama</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nama baru"
              placeholderTextColor="#999"
              value={namaBaru}
              onChangeText={setNamaBaru}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleGantiNama}>
              <Text style={styles.modalBtnTxt}>simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalNama(false)}>
              <Text style={styles.modalCancel}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Ganti Password */}
      <Modal visible={modalPassword} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Password Lama"
              placeholderTextColor="#999"
              secureTextEntry
              value={passwordLama}
              onChangeText={setPasswordLama}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Password Baru"
              placeholderTextColor="#999"
              secureTextEntry
              value={passwordBaru}
              onChangeText={setPasswordBaru}
            />
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleGantiPassword}
            >
              <Text style={styles.modalBtnTxt}>simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalPassword(false)}>
              <Text style={styles.modalCancel}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/perawat-dashboard")}
        >
          <Ionicons name="calendar-outline" size={26} color="#999" />
          <Text style={styles.navLabelInactive}>Jadwal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/perawat-riwayat")}
        >
          <Ionicons name="document-text-outline" size={26} color="#999" />
          <Text style={styles.navLabelInactive}>Riwayat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={26} color="#0d9488" />
          <Text style={styles.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  // HEADER
  header: {
    backgroundColor: "#0d9488",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 18,
    height: 180, // ← lebih pendek
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    zIndex: 1,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 1,
  },

  // FOTO PROFILE CARD
  fotoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 32,
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: "center",
    marginTop: -80, // ← narik card ke atas, overlap header
    position: "relative",
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 22,
  },

  foto: {
    width: 95,
    height: 95,
    borderRadius: 50,
  },

  fotoPlaceholder: {
    width: 95,
    height: 95,
    borderRadius: 50,

    backgroundColor: "#e5e5e5",

    justifyContent: "center",
    alignItems: "center",
  },

  editFotoBtn: {
    marginTop: 10,
  },

  editFotoTxt: {
    color: "#0d9488",
    fontSize: 17,
    fontWeight: "600",
  },

  // MENU
  menuContainer: {
    marginHorizontal: 24,
    gap: 14,
  },

  menuCard: {
    backgroundColor: "#fff",

    borderRadius: 18,

    paddingVertical: 18,
    paddingHorizontal: 18,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,

    elevation: 3,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuInfo: {
    marginLeft: 16,
  },

  menuLabel: {
    fontSize: 17,
    color: "#0d9488",
    fontWeight: "600",
  },

  menuValue: {
    fontSize: 16,
    color: "#555",
    marginTop: 3,
  },

  // LOGOUT
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    marginHorizontal: 24,
    marginTop: 22,

    backgroundColor: "#fff",

    borderRadius: 18,

    paddingVertical: 16,

    borderWidth: 1,
    borderColor: "#fecaca",

    elevation: 2,
  },

  logoutTxt: {
    color: "#ef4444",
    fontSize: 17,
    fontWeight: "600",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    backgroundColor: "#fff",

    borderRadius: 22,

    padding: 24,

    width: "85%",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",

    marginBottom: 18,
  },

  modalInput: {
    backgroundColor: "#f5f5f5",

    borderRadius: 14,

    paddingHorizontal: 16,
    paddingVertical: 14,

    fontSize: 15,

    color: "#333",

    marginBottom: 14,
  },

  modalBtn: {
    backgroundColor: "#0d9488",

    borderRadius: 14,

    paddingVertical: 14,

    alignItems: "center",

    marginBottom: 12,
  },

  modalBtnTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  modalCancel: {
    textAlign: "center",

    color: "#999",

    fontSize: 15,

    paddingVertical: 6,
  },

  // BOTTOM NAVBAR
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
