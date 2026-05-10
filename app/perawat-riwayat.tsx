import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { router } from 'expo-router';

export default function PerawatRiwayat() {
  const [activeTab, setActiveTab] = useState<'perubahan' | 'request'>('perubahan');
  const [pengajuan, setPengajuan] = useState<any[]>([]);
  const namaLogin = 'mirau';

  useEffect(() => {
    fetchPengajuan();
  }, []);

  const fetchPengajuan = async () => {
    const { data, error } = await supabase
      .from('pengajuan')
      .select('*')
      .eq('nama_perawat', namaLogin)
      .order('created_at', { ascending: false });

    if (!error && data) setPengajuan(data);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Disetujui') return '#22c55e';
    if (status === 'Ditolak') return '#ef4444';
    return '#f59e0b';
  };

  const getStatusBg = (status: string) => {
    if (status === 'Disetujui') return '#f0fdf4';
    if (status === 'Ditolak') return '#fef2f2';
    return '#fffbeb';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengajuan Saya</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'perubahan' && styles.tabBtnActive]}
          onPress={() => setActiveTab('perubahan')}
        >
          <Text style={[styles.tabTxt, activeTab === 'perubahan' && styles.tabTxtActive]}>
            Perubahan Jadwal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'request' && styles.tabBtnActive]}
          onPress={() => setActiveTab('request')}
        >
          <Text style={[styles.tabTxt, activeTab === 'request' && styles.tabTxtActive]}>
            Request Jadwal
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {activeTab === 'perubahan' ? (
        <FlatList
          data={pengajuan}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Judul + Status */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.jenis_izin}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                  <Text style={[styles.statusTxt, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Info Jadwal */}
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.infoTxt}>
                  {new Date(item.tanggal_jadwal).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'numeric', year: 'numeric'
                  })} | {item.shift} | {item.poli} | {item.shift === 'Pagi' ? '07.00 - 14.00' : item.shift === 'Siang' ? '14.00 - 21.00' : '21.00 - 07.00'}
                </Text>
              </View>

              {/* Keterangan/Surat */}
              <View style={styles.keteranganBox}>
                <Ionicons
                  name={item.jenis_izin === 'Izin Sakit' ? 'document-attach-outline' : 'document-text-outline'}
                  size={14} color="#666"
                />
                <Text style={styles.keteranganTxt}>
                  {item.jenis_izin === 'Izin Sakit' ? item.surat_sakit : item.keterangan}
                </Text>
              </View>

              {/* Status Approval */}
              <View style={styles.approvalRow}>
                <View style={styles.approvalBox}>
                  <Text style={styles.approvalTitle}>Kepala Perawat</Text>
                  <View style={styles.approvalStatus}>
                    <View style={[styles.dot, {
                      backgroundColor: getStatusColor(
                        item.status_admin === 'Disetujui' ? 'Disetujui' :
                        item.status_admin === 'Ditolak' ? 'Ditolak' : 'Menunggu'
                      )
                    }]} />
                    <Text style={[styles.approvalTxt, {
                      color: getStatusColor(
                        item.status_admin === 'Disetujui' ? 'Disetujui' :
                        item.status_admin === 'Ditolak' ? 'Ditolak' : 'Menunggu'
                      )
                    }]}>
                      {item.status_admin}
                    </Text>
                  </View>
                </View>

                <View style={styles.approvalBox}>
                  <Text style={styles.approvalTitle}>Direktur</Text>
                  <View style={styles.approvalStatus}>
                    <View style={[styles.dot, {
                      backgroundColor: getStatusColor(
                        item.status_direktur === 'Disetujui' ? 'Disetujui' :
                        item.status_direktur === 'Ditolak' ? 'Ditolak' : 'Menunggu'
                      )
                    }]} />
                    <Text style={[styles.approvalTxt, {
                      color: getStatusColor(
                        item.status_direktur === 'Disetujui' ? 'Disetujui' :
                        item.status_direktur === 'Ditolak' ? 'Ditolak' : 'Menunggu'
                      )
                    }]}>
                      {item.status_direktur}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Tombol Cetak jika disetujui */}
              {item.status === 'Disetujui' && (
                <TouchableOpacity style={styles.cetakBtn}>
                  <Ionicons name="print-outline" size={16} color="#0d9488" />
                  <Text style={styles.cetakTxt}>Cetak surat izin</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTxt}>Belum ada pengajuan</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color="#ccc" />
          <Text style={styles.emptyTxt}>Belum ada request jadwal</Text>
        </View>
      )}

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/perawat-dashboard')}>
          <Ionicons name="calendar-outline" size={26} color="#999" />
          <Text style={styles.navLabelInactive}>Jadwal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="document-text" size={26} color="#0d9488" />
          <Text style={styles.navLabel}>Riwayat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={26} color="#999" />
          <Text style={styles.navLabelInactive}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#0d9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: 10, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#0d9488' },
  tabTxt: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTxtActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, marginBottom: 14,
    elevation: 2,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  statusTxt: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 10 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 8,
  },
  infoTxt: { fontSize: 12, color: '#666', flex: 1 },
  keteranganBox: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, backgroundColor: '#f9fafb',
    borderRadius: 8, padding: 10,
    marginBottom: 12,
    borderWidth: 1, borderColor: '#EAB308',
  },
  keteranganTxt: { fontSize: 12, color: '#444', flex: 1 },
  approvalRow: {
    flexDirection: 'row', gap: 10, marginBottom: 8,
  },
  approvalBox: {
    flex: 1, backgroundColor: '#f9fafb',
    borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  approvalTitle: { fontSize: 12, color: '#666', marginBottom: 4 },
  approvalStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  approvalTxt: { fontSize: 12, fontWeight: '500' },
  cetakBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#0d9488',
    borderRadius: 8, paddingVertical: 10,
    marginTop: 4,
  },
  cetakTxt: { color: '#0d9488', fontSize: 13, fontWeight: '500' },
  empty: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', paddingTop: 80,
  },
  emptyTxt: { color: '#999', fontSize: 14, marginTop: 12 },
 bottomNav: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#eee',
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingVertical: 10,
    paddingBottom: 24,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 11, color: '#0d9488', marginTop: 2 },
  navLabelInactive: { fontSize: 11, color: '#999', marginTop: 2 },
});