import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, StatusBar, Alert, ActivityIndicator, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../supabase";

const HIJAU = "#2C7A6E";
const JENIS_KELAMIN = ["Laki-laki", "Perempuan"];
const PENDIDIKAN = ["D3 Keperawatan","D4 Keperawatan","S1 Keperawatan","S2 Keperawatan","Ners"];
const POSISI = ["Perawat gigi","Perawat umum","Perawat IGD","Perawat OK"];
const STATUS = ["Aktif","Tidak Aktif"];

// Format tanggal untuk display: Date → DD/MM/YYYY
const formatDisplay = (date: Date | null) => {
  if (!date) return "";
  const d = String(date.getDate()).padStart(2,"0");
  const m = String(date.getMonth()+1).padStart(2,"0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

// Format tanggal untuk Supabase: Date → YYYY-MM-DD
const formatISO = (date: Date | null) => {
  if (!date) return null;
  const d = String(date.getDate()).padStart(2,"0");
  const m = String(date.getMonth()+1).padStart(2,"0");
  const y = date.getFullYear();
  return `${y}-${m}-${d}`;
};

function Dropdown({ label, value, options, onSelect }: {
  label: string; value: string; options: string[]; onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ zIndex: open ? 999 : 1 }}>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(!open)}>
        <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {value || label}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownMenu}>
          {options.map(opt => (
            <TouchableOpacity key={opt} style={styles.dropdownItem}
              onPress={() => { onSelect(opt); setOpen(false); }}>
              <Text style={styles.dropdownItemText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// Tombol pilih tanggal
function DatePickerField({ label, value, onSelect }: {
  label: string; value: Date | null; onSelect: (d: Date) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <View>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShow(true)}>
        <Ionicons name="calendar-outline" size={16} color={value ? "#111" : "#9CA3AF"} />
        <Text style={value ? styles.dateValue : styles.datePlaceholder}>
          {value ? formatDisplay(value) : "DD/MM/YYYY"}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={show}
        mode="date"
        onConfirm={(date) => { 
          const offset = date.getTimezoneOffset() * 60000;
          onSelect(new Date(date.getTime() - offset));
          setShow(false); 
        }}
        onCancel={() => setShow(false)}
        maximumDate={new Date()}
      />
    </View>
  );
}

export default function KepegawaianTambahPerawat() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  // Form state
  const [namaLengkap, setNamaLengkap] = useState("");
  const [nip, setNip] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState<Date | null>(null);
  const [alamat, setAlamat] = useState("");
  const [noTelepon, setNoTelepon] = useState("");
  const [email, setEmail] = useState("");
  const [pendidikan, setPendidikan] = useState("");
  const [posisi, setPosisi] = useState("");
  const [tanggalMasuk, setTanggalMasuk] = useState<Date | null>(null);
  const [status, setStatus] = useState("Aktif");

  // Dokumen
  const [dokumenNama, setDokumenNama] = useState("");
  const [dokumenUri, setDokumenUri] = useState("");

  const handlePickDokumen = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf","image/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setDokumenNama(file.name);
        setDokumenUri(file.uri);
      }
    } catch (e) {
      Alert.alert("Error", "Gagal memilih dokumen");
    }
  };

  const handleSimpan = async () => {
    if (!namaLengkap || !nip || !username || !password) {
      Alert.alert("Peringatan", "Nama lengkap, NIP, username, dan password wajib diisi!");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("user").insert([{
        username, password, role: "Perawat",
        nama_lengkap: namaLengkap,
        nip,
        jenis_kelamin: jenisKelamin,
        tempat_lahir: tempatLahir,
        tanggal_lahir: formatISO(tanggalLahir),
        alamat,
        no_telepon: noTelepon,
        email,
        pendidikan_terakhir: pendidikan,
        posisi,
        tanggal_masuk: formatISO(tanggalMasuk),
        status: status || "Aktif",
        dokumen_berkas: dokumenUri || null,
      }]);
      if (error) throw error;
      Alert.alert("Berhasil", "Data perawat berhasil ditambahkan!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert("Gagal", e?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HIJAU} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Perawat</Text>
      </View>

      {/* FORM */}
      <ScrollView style={styles.scroll}
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>

          {/* Nama + NIP */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Nama Lengkap *</Text>
              <TextInput style={styles.input} value={namaLengkap} onChangeText={setNamaLengkap}
                placeholder="Nama lengkap" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>NIP *</Text>
              <TextInput style={styles.input} value={nip} onChangeText={setNip}
                placeholder="C2C0231045" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          {/* Jenis Kelamin + Tempat Lahir */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Jenis Kelamin *</Text>
              <Dropdown label="Pilih" value={jenisKelamin} options={JENIS_KELAMIN} onSelect={setJenisKelamin} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Tempat Lahir *</Text>
              <TextInput style={styles.input} value={tempatLahir} onChangeText={setTempatLahir}
                placeholder="-" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          {/* Tanggal Lahir + Alamat */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Tanggal Lahir *</Text>
              <DatePickerField label="Tanggal Lahir" value={tanggalLahir} onSelect={setTanggalLahir} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Alamat *</Text>
              <TextInput style={[styles.input, styles.inputMultiline]}
                value={alamat} onChangeText={setAlamat}
                placeholder="Alamat" placeholderTextColor="#9CA3AF" multiline />
            </View>
          </View>

          {/* No. Telepon + Email */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>No. Telepon *</Text>
              <TextInput style={styles.input} value={noTelepon} onChangeText={setNoTelepon}
                placeholder="08xx" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail}
                placeholder="-" placeholderTextColor="#9CA3AF" keyboardType="email-address" />
            </View>
          </View>

          {/* Pendidikan + Posisi */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Pendidikan Terakhir *</Text>
              <Dropdown label="Pilih" value={pendidikan} options={PENDIDIKAN} onSelect={setPendidikan} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Posisi *</Text>
              <Dropdown label="Pilih" value={posisi} options={POSISI} onSelect={setPosisi} />
            </View>
          </View>

          {/* Tanggal Masuk + Status */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Tanggal Masuk *</Text>
              <DatePickerField label="Tanggal Masuk" value={tanggalMasuk} onSelect={setTanggalMasuk} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Status *</Text>
              <Dropdown label="Pilih" value={status} options={STATUS} onSelect={setStatus} />
            </View>
          </View>

          {/* Username + Password */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Username *</Text>
              <TextInput style={styles.input} value={username} onChangeText={setUsername}
                placeholder="username" placeholderTextColor="#9CA3AF" autoCapitalize="none" />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Password *</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword}
                placeholder="password" placeholderTextColor="#9CA3AF" secureTextEntry />
            </View>
          </View>

        </View>

        {/* UPLOAD DOKUMEN */}
        <View style={styles.dokumenCard}>
          <View style={styles.dokumenHeader}>
            <Ionicons name="document-text" size={18} color={HIJAU} />
            <Text style={styles.dokumenTitle}>Dokumen Perawat</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDokumen}>
              <Ionicons name="cloud-upload-outline" size={14} color="#fff" />
              <Text style={styles.uploadBtnText}>Upload Dokumen</Text>
            </TouchableOpacity>
          </View>

          {dokumenNama ? (
            <View style={styles.dokumenPreview}>
              <Ionicons name="document-attach-outline" size={20} color={HIJAU} />
              <Text style={styles.dokumenNama} numberOfLines={1}>{dokumenNama}</Text>
              <TouchableOpacity onPress={() => { setDokumenNama(""); setDokumenUri(""); }}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.dokumenEmpty} onPress={handlePickDokumen}>
              <Ionicons name="folder-open-outline" size={44} color="#D1D5DB" />
              <Text style={styles.dokumenEmptyTxt}>Tap untuk upload dokumen</Text>
              <Text style={styles.dokumenEmptySubTxt}>PDF atau gambar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Simpan */}
        <TouchableOpacity style={[styles.btnSimpan, loading && { opacity: 0.7 }]}
          onPress={handleSimpan} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.btnSimpanText}>Simpan Data</Text>
            </>
          )}
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
  scroll: { flex: 1 },
  formContainer: { padding: 16, paddingBottom: 40, gap: 14 },
  formCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, gap: 14,
  },
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: "#111827", backgroundColor: "#fff",
  },
  inputMultiline: { height: 60, textAlignVertical: "top" },

  // Date picker button
  dateBtn: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 9,
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff",
  },
  dateValue: { fontSize: 13, color: "#111827" },
  datePlaceholder: { fontSize: 13, color: "#9CA3AF" },

  // Dropdown
  dropdownBtn: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 9,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#fff",
  },
  dropdownValue: { fontSize: 13, color: "#111827" },
  dropdownPlaceholder: { fontSize: 13, color: "#9CA3AF" },
  dropdownMenu: {
    position: "absolute", top: 42, left: 0, right: 0,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#D1D5DB",
    borderRadius: 8, zIndex: 999, elevation: 10,
  },
  dropdownItem: {
    paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: { fontSize: 13, color: "#374151" },

  // Dokumen card
  dokumenCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, gap: 12,
  },
  dokumenHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  dokumenTitle: { fontSize: 14, fontWeight: "700", color: "#111", flex: 1 },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: HIJAU,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4,
  },
  uploadBtnText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  dokumenEmpty: {
    alignItems: "center", paddingVertical: 24, gap: 6,
    borderWidth: 1.5, borderColor: "#E5E7EB", borderStyle: "dashed",
    borderRadius: 12, backgroundColor: "#FAFAFA",
  },
  dokumenEmptyTxt: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  dokumenEmptySubTxt: { fontSize: 11, color: "#9CA3AF" },
  dokumenPreview: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F0FDF4", padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: "#D1FAE5",
  },
  dokumenNama: { flex: 1, fontSize: 13, color: "#111", fontWeight: "500" },

  // Simpan button
  btnSimpan: {
    backgroundColor: HIJAU, borderRadius: 12, paddingVertical: 14,
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8,
  },
  btnSimpanText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});