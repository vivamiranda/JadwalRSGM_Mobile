import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, TextInput, StatusBar,
  RefreshControl, Modal, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { supabase } from "../supabase";

const HIJAU  = "#2C7A6E";
const KUNING = "#E8C840";
const MERAH  = "#D9534F";
const MERAH_LIGHT = "#FDEAEA";

const formatTgl = (tgl: string) => {
  if (!tgl) return "-";
  const d = new Date(tgl);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};
const fmtInput = (val: string) => {
  const d = val.replace(/\D/g,"").slice(0,8);
  if (d.length<=2) return d;
  if (d.length<=4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
};
const parseInputTgl = (s: string) => {
  const p = s.split("/");
  if (p.length!==3||p[2].length!==4) return null;
  return `${p[2]}-${p[1]}-${p[0]}`;
};
const normalizeStatus = (s: string) => {
  const l = (s??"").toLowerCase().trim();
  if (l.startsWith("menunggu")) return "menunggu";
  if (l.startsWith("disetujui")) return "disetujui";
  if (l.startsWith("ditolak")) return "ditolak";
  return l;
};
const SHIFT_INFO: Record<string,{label:string;jam:string}> = {
  AP:{label:"AP - Poli Pagi / OK",jam:"07.00 - 14.00"},
  S:{label:"S - Poli Siang",jam:"14.00 - 21.00"},
  S1:{label:"S1 - Poli, Anamnesa, Nurse Station, Konditional",jam:"12.00 - 21.00"},
  B:{label:"B - Poli, Anamnesa, Nurse Station, Konditional",jam:"09.00 - 16.00"},
  DP:{label:"DP",jam:"08.00 - 16.00"},
  CP:{label:"CP",jam:"08.00 - 16.00"},
  SABTU:{label:"SABTU",jam:"08.00 - 16.00"},
};
const getShiftInfo = (shift: string) => SHIFT_INFO[shift]??SHIFT_INFO[shift?.toUpperCase()]??{label:shift??"-",jam:""};

const Badge = ({status}:{status:string}) => {
  const s = normalizeStatus(status);
  const bg = s==="disetujui"?"#E6F4F1":s==="ditolak"?MERAH_LIGHT:"#FFF8E1";
  const color = s==="disetujui"?HIJAU:s==="ditolak"?MERAH:"#B8860B";
  const label = s==="disetujui"?"Disetujui":s==="ditolak"?"Ditolak":"Menunggu";
  return <View style={[st.badge,{backgroundColor:bg}]}><Text style={[st.badgeTxt,{color}]}>{label}</Text></View>;
};
const AprBox = ({label,status}:{label:string;status:string}) => {
  const s = normalizeStatus(status);
  const dotClr = s==="disetujui"?HIJAU:s==="ditolak"?MERAH:KUNING;
  const lbl = s==="disetujui"?"Disetujui":s==="ditolak"?"Ditolak":"Menunggu persetujuan";
  return (
    <View style={st.aprBox}>
      <Text style={st.aprLabel}>{label}</Text>
      <View style={{flexDirection:"row",alignItems:"center",gap:5}}>
        <View style={[st.aprDot,{backgroundColor:dotClr}]}/>
        <Text style={[st.aprStatus,{color:s==="menunggu"?"#B8860B":dotClr}]}>{lbl}</Text>
      </View>
    </View>
  );
};

// ═══ TAB 1: DATA PERAWAT ════════════════════════════════════
function TabDataPerawat({router,search,setSearch,filterStatus,setFilterStatus,showFilter,setShowFilter}:any) {
  const [perawatList,setPerawatList] = useState<any[]>([]);
  const [filtered,setFiltered]       = useState<any[]>([]);
  const [loading,setLoading]         = useState(true);
  const [refreshing,setRefreshing]   = useState(false);

  const totalPerawat      = perawatList.length;
  const perawatAktif      = perawatList.filter(p=>p.status==="Aktif").length;
  const perawatTidakAktif = perawatList.filter(p=>p.status!=="Aktif").length;

  const fetchData = useCallback(async()=>{
    try {
      const {data,error} = await supabase.from("user")
        .select("id,nama_lengkap,nip,posisi,tanggal_masuk,status,foto_profil")
        .eq("role","Perawat").order("nama_lengkap",{ascending:true});
      if(error) throw error;
      setPerawatList(data||[]);
    } catch(e:any){Alert.alert("Error",e.message);}
    finally{setLoading(false);setRefreshing(false);}
  },[]);

  useEffect(()=>{fetchData();},[fetchData]);
  useEffect(()=>{
    let r=[...perawatList];
    if(search.trim()) r=r.filter(p=>p.nama_lengkap?.toLowerCase().includes(search.toLowerCase()));
    if(filterStatus!=="Semua") r=r.filter(p=>filterStatus==="Aktif"?p.status==="Aktif":p.status!=="Aktif");
    setFiltered(r);
  },[perawatList,search,filterStatus]);

  const handleDelete=(id:number)=>{
    Alert.alert("Hapus Perawat","Yakin ingin menghapus?",[
      {text:"Batal"},
      {text:"Hapus",style:"destructive",onPress:async()=>{
        await supabase.from("user").delete().eq("id",id);
        setPerawatList(prev=>prev.filter(p=>p.id!==id));
      }},
    ]);
  };

  return (
    <View style={{flex:1}}>
      <View style={st.statsRow}>
        <View style={[st.statCard,{borderTopColor:HIJAU}]}>
          <Ionicons name="people" size={20} color={HIJAU}/>
          <Text style={[st.statNum,{color:HIJAU}]}>{totalPerawat}</Text>
          <Text style={st.statLabel}>Total Perawat</Text>
        </View>
        <View style={[st.statCard,{borderTopColor:"#10B981"}]}>
          <Ionicons name="person-circle" size={20} color="#10B981"/>
          <Text style={[st.statNum,{color:"#10B981"}]}>{perawatAktif}</Text>
          <Text style={st.statLabel}>Perawat Aktif</Text>
        </View>
        <View style={[st.statCard,{borderTopColor:MERAH}]}>
          <Ionicons name="person-remove" size={20} color={MERAH}/>
          <Text style={[st.statNum,{color:MERAH}]}>{perawatTidakAktif}</Text>
          <Text style={st.statLabel}>Tidak Aktif</Text>
        </View>
      </View>
      {loading?(
        <ActivityIndicator size="large" color={HIJAU} style={{marginTop:40}}/>
      ):filtered.length===0?(
        <View style={st.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#CCC"/>
          <Text style={st.emptyTxt}>Tidak ada data perawat</Text>
        </View>
      ):(
        <ScrollView contentContainerStyle={{paddingHorizontal:14,paddingBottom:100}}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing}
            onRefresh={()=>{setRefreshing(true);fetchData();}} colors={[HIJAU]}/>}>
          {filtered.map(item=>(
            <View key={item.id} style={st.card}>
              <View style={st.cardAvatar}>
                {item.foto_profil
                  ?<Image source={{uri:item.foto_profil}} style={st.cardAvatarImg}/>
                  :<View style={st.cardAvatarFallback}><Ionicons name="person" size={24} color="#fff"/></View>}
              </View>
              <View style={{flex:1}}>
                <Text style={st.cardNama}>{item.nama_lengkap}</Text>
                <Text style={st.cardSub}>NIP. {item.nip||"-"}</Text>
                <Text style={st.cardSub}>{item.posisi||"-"}</Text>
                <Text style={st.cardSub}>{formatTgl(item.tanggal_masuk)}</Text>
              </View>
              <View style={st.cardRight}>
                <View style={[st.badgeStatus,{backgroundColor:item.status==="Aktif"?"#E6F4F1":MERAH_LIGHT}]}>
                  <View style={[st.badgeDot,{backgroundColor:item.status==="Aktif"?HIJAU:MERAH}]}/>
                  <Text style={[st.badgeTxtSmall,{color:item.status==="Aktif"?HIJAU:MERAH}]}>
                    {item.status==="Aktif"?"Aktif":"Tidak aktif"}
                  </Text>
                </View>
                <View style={st.actionRow}>
                  <TouchableOpacity style={st.actionBtn}
                    onPress={()=>router.push({pathname:"/kepegawaian-edit-perawat",params:{id:item.id}})}>
                    <FontAwesome5 name="edit" size={13} color="#777"/>
                  </TouchableOpacity>
                  <TouchableOpacity style={st.actionBtn}
                    onPress={()=>router.push({pathname:"/kepegawaian-detail-perawat",params:{id:item.id}})}>
                    <Ionicons name="eye-outline" size={16} color={HIJAU}/>
                  </TouchableOpacity>
                  <TouchableOpacity style={st.actionBtn} onPress={()=>handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={15} color={MERAH}/>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ═══ TAB 2: JADWAL ══════════════════════════════════════════
function TabJadwal() {
  const [data,setData]               = useState<any[]>([]);
  const [loading,setLoading]         = useState(true);
  const [refreshing,setRefreshing]   = useState(false);
  const [tglMulai,setTglMulai]       = useState("");
  const [tglAkhir,setTglAkhir]       = useState("");

  const fetchData = useCallback(async()=>{
    try {
      let query = supabase.from("jadwal").select("*").order("tanggal",{ascending:true});
      const start=tglMulai?parseInputTgl(tglMulai):null;
      const end=tglAkhir?parseInputTgl(tglAkhir):null;
      if(start) query=query.gte("tanggal",start);
      if(end) query=query.lte("tanggal",end);
      const {data:rows}=await query;
      setData(rows||[]);
    } catch(e){console.error(e);}
    finally{setLoading(false);setRefreshing(false);}
  },[tglMulai,tglAkhir]);

  useEffect(()=>{fetchData();},[fetchData]);

  return (
    <View style={{flex:1}}>
      <View style={st.jadwalFilterBar}>
        <TouchableOpacity style={st.funnelBtn} onPress={fetchData}>
          <Ionicons name="filter" size={16} color="#fff"/>
        </TouchableOpacity>
        <Ionicons name="calendar-outline" size={16} color="#fff" style={{marginLeft:4}}/>
        <TextInput style={st.filterInput} placeholder="dd/mm/tttt"
          placeholderTextColor="rgba(255,255,255,0.55)" value={tglMulai}
          keyboardType="numeric" maxLength={10} onChangeText={v=>setTglMulai(fmtInput(v))}/>
        <Text style={st.filterDiv}>|</Text>
        <TextInput style={[st.filterInput,{flex:1}]} placeholder="dd/mm/tttt"
          placeholderTextColor="rgba(255,255,255,0.55)" value={tglAkhir}
          keyboardType="numeric" maxLength={10} onChangeText={v=>setTglAkhir(fmtInput(v))}/>
        <TouchableOpacity onPress={()=>{setTglMulai("");setTglAkhir("");}}>
          <Text style={st.resetTxt}>Reset</Text>
        </TouchableOpacity>
      </View>
      <Text style={st.sectionTitle}>Jadwal perawat</Text>
      {loading?(
        <ActivityIndicator size="large" color={HIJAU} style={{marginTop:40}}/>
      ):data.length===0?(
        <View style={st.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#CCC"/>
          <Text style={st.emptyTxt}>Belum ada jadwal</Text>
        </View>
      ):(
        <ScrollView contentContainerStyle={{paddingHorizontal:14,paddingBottom:100}}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing}
            onRefresh={()=>{setRefreshing(true);fetchData();}} colors={[HIJAU]}/>}>
          {data.map(item=>{
            const info=getShiftInfo(item.shift);
            return (
              <View key={item.id} style={st.card}>
                <View style={st.cardAvatar}>
                  <View style={st.cardAvatarFallback}><Ionicons name="person" size={24} color="#fff"/></View>
                </View>
                <View style={{flex:1}}>
                  <Text style={st.cardNama}>{item.nama_perawat}</Text>
                  {item.poli?<Text style={st.cardSub}>{item.poli}</Text>:null}
                  <Text style={st.cardSub}>{formatTgl(item.tanggal)}</Text>
                  <View style={st.shiftBadge}><Text style={st.shiftBadgeTxt}>{info.label}</Text></View>
                  {info.jam?(
                    <View style={st.jamBadge}>
                      <Ionicons name="time-outline" size={12} color="#444" style={{marginRight:4}}/>
                      <Text style={st.jamTxt}>{info.jam}</Text>
                    </View>
                  ):null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// ═══ TAB 3: PENGAJUAN ═══════════════════════════════════════
function TabPengajuan({ router }: { router: any }) {
  const [subTab,setSubTab]   = useState<"perubahan"|"request">("perubahan");
  const [listP,setListP]     = useState<any[]>([]);
  const [listR,setListR]     = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [busy,setBusy]       = useState<number|null>(null);

  const loadAll = useCallback(async()=>{
    try {
      const [{data:p},{data:r}] = await Promise.all([
        supabase.from("pengajuan").select("*").order("created_at",{ascending:false}),
        supabase.from("request_jadwal").select("*").order("created_at",{ascending:false}),
      ]);
      setListP(p||[]);setListR(r||[]);
    } catch(e){console.error(e);}
    finally{setLoading(false);setRefreshing(false);}
  },[]);

  useEffect(()=>{loadAll();},[loadAll]);

  const sorted=(arr:any[])=>[...arr].sort((a,b)=>
    (normalizeStatus(a.status)==="menunggu"?0:1)-(normalizeStatus(b.status)==="menunggu"?0:1));

  // Kepegawaian tidak bisa setujui/tolak - hanya bisa cetak surat
 const sudahDisetujui=(item:any)=>
    item.status_admin==="Disetujui" && item.status_direktur==="Disetujui";

  return (
    <View style={{flex:1}}>
      <View style={st.subTabBar}>
        <TouchableOpacity style={[st.subTabBtn,subTab==="perubahan"&&st.subTabActive]} onPress={()=>setSubTab("perubahan")}>
          <Text style={[st.subTabTxt,subTab==="perubahan"&&st.subTabTxtActive]}>Perubahan Jadwal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.subTabBtn,subTab==="request"&&st.subTabActive]} onPress={()=>setSubTab("request")}>
          <Text style={[st.subTabTxt,subTab==="request"&&st.subTabTxtActive]}>Request Jadwal</Text>
        </TouchableOpacity>
      </View>
      {loading?(
        <ActivityIndicator size="large" color={HIJAU} style={{marginTop:40}}/>
      ):(
        <ScrollView contentContainerStyle={{padding:14,paddingBottom:100}} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);loadAll();}} colors={[HIJAU]}/>}>
          {subTab==="perubahan"?(
            sorted(listP).length===0?(
              <View style={st.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#CCC"/>
                <Text style={st.emptyTxt}>Belum ada pengajuan</Text>
              </View>
            ):sorted(listP).map(item=>{
              const menunggu=normalizeStatus(item.status_admin)==="menunggu";
              const isLoading=busy===item.id;
              const jenisLabel=(()=>{
                const j=(item.jenis_izin??"").toLowerCase();
                if(j.includes("sakit")) return "Izin Sakit";
                if(j.includes("cuti")||j.includes("lain")) return "Izin Lainnya";
                return item.jenis_izin;
              })();
              return (
                <View key={item.id} style={st.pengajuanCard}>
                  <View style={st.rowBetween}>
                    <Text style={st.cardNama}>{item.nama_perawat}</Text>
                    <Badge status={item.status}/>
                  </View>
                  <View style={st.divider}/>
                  <Text style={st.jenisIzin}>{jenisLabel}</Text>
                  <View style={{flexDirection:"row",alignItems:"flex-start",gap:5,marginBottom:12}}>
                    <Ionicons name="time-outline" size={13} color="#777"/>
                    <Text style={st.infoTxt}>{formatTgl(item.tanggal_jadwal)} | {item.shift} - {item.poli}</Text>
                  </View>
                  <View style={st.divider}/>
                  {item.surat_sakit&&item.surat_sakit!=="-"?(
                    <View style={st.docBox}>
                      <Ionicons name="document-text-outline" size={14} color="#777"/>
                      <Text style={st.docTxt}>Surat dokter</Text>
                    </View>
                  ):item.keterangan&&item.keterangan!=="-"?(
                    <View style={st.docBox}>
                      <Ionicons name="chatbox-ellipses-outline" size={14} color="#777"/>
                      <Text style={st.docTxt}>{item.keterangan}</Text>
                    </View>
                  ):null}
                  <View style={{flexDirection:"row",gap:10}}>
                    <AprBox label="Kepala Perawat" status={item.status_admin}/>
                    <AprBox label="Direktur" status={item.status_direktur}/>
                  </View>
                  {sudahDisetujui(item)&&(
                    <TouchableOpacity style={st.btnCetak}
                      onPress={()=>router.push({pathname:"/kepegawaian-surat-izin" as any,params:{id:item.id}})}>
                      <Ionicons name="print-outline" size={16} color={HIJAU}/>
                      <Text style={st.btnCetakTxt}>Cetak Surat Izin</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ):sorted(listR).length===0?(
            <View style={st.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#CCC"/>
              <Text style={st.emptyTxt}>Belum ada request</Text>
            </View>
          ):sorted(listR).map(item=>{
            const menunggu=normalizeStatus(item.status_admin)==="menunggu";
            const isLoading=busy===item.id;
            return (
              <View key={item.id} style={st.pengajuanCard}>
                <View style={st.rowBetween}>
                  <Text style={st.cardNama}>{item.nama_perawat}</Text>
                  <Badge status={item.status}/>
                </View>
                <View style={st.divider}/>
                <View style={{flexDirection:"row",alignItems:"flex-start",gap:5,marginBottom:12}}>
                  <Ionicons name="time-outline" size={13} color="#777"/>
                  <Text style={st.infoTxt}>{formatTgl(item.tanggal)} | {item.shift} - {item.poli}</Text>
                </View>
                <View style={st.divider}/>
                <View style={{flexDirection:"row",gap:10}}>
                  <AprBox label="Kepala Perawat" status={item.status_admin}/>
                </View>
                {sudahDisetujui(item)&&(
                  <TouchableOpacity style={st.btnCetak}
                    onPress={()=>router.push({pathname:"/kepegawaian-surat-izin" as any,params:{id:item.id}})}>
                    <Ionicons name="print-outline" size={16} color={HIJAU}/>
                    <Text style={st.btnCetakTxt}>Cetak Surat Izin</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// ═══ TAB 4: REKAP ═══════════════════════════════════════════
const BULAN=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const TAHUN=["2024","2025","2026","2027"];

function TabRekap() {
  const now=new Date();
  const [selectedBulan,setSelectedBulan]=useState(BULAN[now.getMonth()]);
  const [selectedTahun,setSelectedTahun]=useState(now.getFullYear().toString());
  const [loading,setLoading]=useState(false);
  const [hasLoaded,setHasLoaded]=useState(false);
  const [totalMasuk,setTotalMasuk]=useState(0);
  const [totalCuti,setTotalCuti]=useState(0);
  const [totalPerawat,setTotalPerawat]=useState(0);
  const [detailData,setDetailData]=useState<any[]>([]);
  const [showBulanDD,setShowBulanDD]=useState(false);
  const [showTahunDD,setShowTahunDD]=useState(false);

  const fetchRekap=async()=>{
    setLoading(true);
    try {
      const bulanIndex=BULAN.indexOf(selectedBulan)+1;
      const bulanStr=String(bulanIndex).padStart(2,"0");
      const dari=`${selectedTahun}-${bulanStr}-01`;
      const akhirHari=new Date(parseInt(selectedTahun),bulanIndex,0).getDate();
      const sampai=`${selectedTahun}-${bulanStr}-${String(akhirHari).padStart(2,"0")}`;
      const [{data:pl},{data:jl},{data:il}]=await Promise.all([
        supabase.from("user").select("id,nama_lengkap,posisi,status").eq("role","Perawat"),
        supabase.from("jadwal").select("nama_perawat,tanggal").gte("tanggal",dari).lte("tanggal",sampai),
        supabase.from("pengajuan").select("nama_perawat").eq("status_admin","Disetujui").gte("tanggal_jadwal",dari).lte("tanggal_jadwal",sampai),
      ]);
      const perawat=pl||[];const jadwal=jl||[];const izin=il||[];
      setTotalPerawat(perawat.length);
      const detail=perawat.map((p:any)=>{
        const jj=jadwal.filter((j:any)=>j.nama_perawat===p.nama_lengkap).length;
        const jc=izin.filter((i:any)=>i.nama_perawat===p.nama_lengkap).length;
        return{nama:p.nama_lengkap,posisi:p.posisi||"Perawat",masuk:Math.max(jj-jc,0),cuti:jc,status:p.status||"Aktif"};
      });
      setTotalMasuk(detail.reduce((a:number,d:any)=>a+d.masuk,0));
      setTotalCuti(detail.reduce((a:number,d:any)=>a+d.cuti,0));
      setDetailData(detail);setHasLoaded(true);
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  return (
    <ScrollView contentContainerStyle={{padding:14,paddingBottom:100}} showsVerticalScrollIndicator={false}>
      <View style={st.rekapCard}>
        <View style={{flexDirection:"row",gap:12}}>
          <View style={{flex:1}}>
            <Text style={st.rekapLabel}>Bulan</Text>
            <TouchableOpacity style={st.ddBtn} onPress={()=>setShowBulanDD(!showBulanDD)}>
              <Text style={st.ddValue}>{selectedBulan}</Text>
              <Ionicons name="chevron-down" size={14} color="#555"/>
            </TouchableOpacity>
            {showBulanDD&&(
              <View style={st.ddMenu}>
                <ScrollView style={{maxHeight:160}} nestedScrollEnabled>
                  {BULAN.map(b=>(
                    <TouchableOpacity key={b} style={st.ddItem} onPress={()=>{setSelectedBulan(b);setShowBulanDD(false);}}>
                      <Text style={[st.ddItemTxt,b===selectedBulan&&{color:HIJAU,fontWeight:"700"}]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          <View style={{flex:1}}>
            <Text style={st.rekapLabel}>Tahun</Text>
            <TouchableOpacity style={st.ddBtn} onPress={()=>setShowTahunDD(!showTahunDD)}>
              <Text style={st.ddValue}>{selectedTahun}</Text>
              <Ionicons name="chevron-down" size={14} color="#555"/>
            </TouchableOpacity>
            {showTahunDD&&(
              <View style={st.ddMenu}>
                {TAHUN.map(t=>(
                  <TouchableOpacity key={t} style={st.ddItem} onPress={()=>{setSelectedTahun(t);setShowTahunDD(false);}}>
                    <Text style={[st.ddItemTxt,t===selectedTahun&&{color:HIJAU,fontWeight:"700"}]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={st.refreshBtn} onPress={fetchRekap} disabled={loading}>
          {loading?<ActivityIndicator size="small" color={HIJAU}/>
            :<><Ionicons name="refresh-outline" size={16} color={HIJAU}/><Text style={st.refreshTxt}>Refresh Data</Text></>}
        </TouchableOpacity>
      </View>
      {hasLoaded&&(
        <>
          <View style={[st.statsRow,{marginTop:12}]}>
            <View style={[st.statCard,{borderTopColor:HIJAU}]}>
              <Ionicons name="checkmark-circle" size={20} color={HIJAU}/>
              <Text style={[st.statNum,{color:HIJAU}]}>{totalMasuk}</Text>
              <Text style={st.statLabel}>Total Masuk</Text>
            </View>
            <View style={[st.statCard,{borderTopColor:KUNING}]}>
              <Ionicons name="close-circle" size={20} color="#B8860B"/>
              <Text style={[st.statNum,{color:"#B8860B"}]}>{totalCuti}</Text>
              <Text style={st.statLabel}>Cuti/Izin</Text>
            </View>
            <View style={[st.statCard,{borderTopColor:"#6366F1"}]}>
              <Ionicons name="people" size={20} color="#6366F1"/>
              <Text style={[st.statNum,{color:"#6366F1"}]}>{totalPerawat}</Text>
              <Text style={st.statLabel}>Total Perawat</Text>
            </View>
          </View>
          <Text style={[st.sectionTitle,{marginTop:12}]}>Detail Kehadiran</Text>
          {detailData.map((item,i)=>(
            <View key={i} style={[st.card,{marginBottom:10}]}>
              <View style={st.cardAvatar}>
                <View style={st.cardAvatarFallback}><Ionicons name="person" size={20} color="#fff"/></View>
              </View>
              <View style={{flex:1}}>
                <Text style={st.cardNama}>{item.nama}</Text>
                <Text style={st.cardSub}>{item.posisi}</Text>
              </View>
              <View style={{flexDirection:"row",gap:12,alignItems:"center"}}>
                <View style={{alignItems:"center"}}>
                  <Text style={[st.statNum,{fontSize:16,color:HIJAU}]}>{item.masuk}</Text>
                  <Text style={st.cardSub}>Masuk</Text>
                </View>
                <View style={{alignItems:"center"}}>
                  <Text style={[st.statNum,{fontSize:16,color:"#B8860B"}]}>{item.cuti}</Text>
                  <Text style={st.cardSub}>Cuti</Text>
                </View>
                <View style={[st.badgeStatus,{backgroundColor:item.status==="Aktif"?"#E6F4F1":MERAH_LIGHT}]}>
                  <Text style={[st.badgeTxtSmall,{color:item.status==="Aktif"?HIJAU:MERAH}]}>{item.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}
      {!hasLoaded&&!loading&&(
        <View style={[st.emptyContainer,{paddingTop:40}]}>
          <Ionicons name="bar-chart-outline" size={56} color="#CCC"/>
          <Text style={st.emptyTxt}>Pilih bulan & tahun lalu tekan Refresh Data</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ═══ LAYAR UTAMA ════════════════════════════════════════════
export default function KepegawaianDashboard() {
  const insets=useSafeAreaInsets();
  const router=useRouter();
  const [activeTab,setActiveTab]=useState(0);
  const [namaLogin,setNamaLogin]=useState("ratih");
  const [fotoLogin,setFotoLogin]=useState<string|null>(null);
  const [showLogout,setShowLogout]=useState(false);
  const [search,setSearch]=useState("");
  const [filterStatus,setFilterStatus]=useState<"Semua"|"Aktif"|"Tidak Aktif">("Semua");
  const [showFilter,setShowFilter]=useState(false);

  useEffect(()=>{
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) return;
      const {data}=await supabase.from("user").select("nama_lengkap,foto_profil").eq("id",user.id).maybeSingle();
      if(data){setNamaLogin(data.nama_lengkap??"ratih");setFotoLogin(data.foto_profil??null);}
    })();
  },[]);

  const handleLogout=async()=>{
    setShowLogout(false);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <View style={{flex:1,backgroundColor:"#EFEFEF"}}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>

      {/* MODAL LOGOUT */}
      <Modal visible={showLogout} transparent animationType="fade" onRequestClose={()=>setShowLogout(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <View style={st.modalIconWrap}><Ionicons name="exit-outline" size={32} color={HIJAU}/></View>
            <Text style={st.modalTitle}>Keluar Aplikasi</Text>
            <Text style={st.modalMsg}>Apakah kamu yakin ingin keluar dari akun ini?</Text>
            <View style={st.modalActions}>
              <TouchableOpacity style={[st.modalBtn,st.modalBtnCancel]} onPress={()=>setShowLogout(false)}>
                <Text style={st.modalBtnCancelTxt}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.modalBtn,st.modalBtnLogout]} onPress={handleLogout}>
                <Text style={st.modalBtnLogoutTxt}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* HEADER FULL — profil + search masuk dalam header */}
      <View style={[st.header,{paddingTop:insets.top}]}>
        <Image source={require("../assets/images/backroundrsgm1.png")}
          style={StyleSheet.absoluteFill} resizeMode="cover"/>
        <View style={st.overlay}/>
        <View style={st.headerInner}>
          {/* Profil row */}
          <View style={st.profilRow}>
            <View style={st.avatarRing}>
              {fotoLogin
                ?<Image source={{uri:fotoLogin}} style={st.avatarImg}/>
                :<View style={st.avatarFallback}><Ionicons name="person" size={26} color="#fff"/></View>}
            </View>
            <View style={{flex:1,marginLeft:10}}>
              <Text style={st.adminNama}>{namaLogin}</Text>
              <Text style={st.adminRole}>Kepegawaian</Text>
            </View>
            <TouchableOpacity onPress={()=>setShowLogout(true)} style={st.logoutBtn}>
              <Ionicons name="exit-outline" size={24} color="#fff"/>
            </TouchableOpacity>
          </View>

          {/* Tombol Tambah — hanya muncul di tab Data Perawat */}
          {activeTab===0&&(
            <TouchableOpacity style={st.btnTambah}
              onPress={()=>router.push("/kepegawaian-tambah-perawat" as any)}>
              <Ionicons name="add" size={16} color={HIJAU}/>
              <Text style={st.btnTambahTxt}>Tambah</Text>
            </TouchableOpacity>
          )}

          {/* Search + Filter — hanya di tab Data Perawat */}
          {activeTab===0&&(
            <View style={{gap:8}}>
              <View style={st.searchRow}>
                <View style={st.searchBox}>
                  <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)"/>
                  <TextInput style={st.searchInput} placeholder="Cari nama perawat..."
                    placeholderTextColor="rgba(255,255,255,0.55)" value={search} onChangeText={setSearch}/>
                </View>
                <TouchableOpacity style={st.filterBtn} onPress={()=>setShowFilter(!showFilter)}>
                  <Ionicons name="filter" size={14} color="#fff"/>
                  <Text style={st.filterBtnTxt}>Filter</Text>
                </TouchableOpacity>
              </View>
              {showFilter&&(
                <View style={st.filterMenu}>
                  {(["Semua","Aktif","Tidak Aktif"] as const).map(opt=>(
                    <TouchableOpacity key={opt} style={st.filterMenuItem}
                      onPress={()=>{setFilterStatus(opt);setShowFilter(false);}}>
                      <Text style={[st.filterMenuTxt,filterStatus===opt&&{color:HIJAU,fontWeight:"700"}]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* KONTEN TAB */}
      <View style={{flex:1}}>
        {activeTab===0&&<TabDataPerawat router={router} search={search} setSearch={setSearch}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          showFilter={showFilter} setShowFilter={setShowFilter}/>}
        {activeTab===1&&<TabJadwal/>}
        {activeTab===2&&<TabPengajuan router={router}/>}
        {activeTab===3&&<TabRekap/>}
      </View>

      {/* BOTTOM NAVBAR */}
      <View style={[st.navbar,{paddingBottom:insets.bottom+4}]}>
        <TouchableOpacity style={st.navTab} onPress={()=>setActiveTab(0)}>
          <Ionicons name="people" size={26} color={activeTab===0?HIJAU:"#AAA"}/>
          {activeTab===0&&<View style={st.navDot}/>}
        </TouchableOpacity>
        <TouchableOpacity style={st.navTab} onPress={()=>setActiveTab(1)}>
          <Ionicons name="calendar-outline" size={26} color={activeTab===1?HIJAU:"#AAA"}/>
          {activeTab===1&&<View style={st.navDot}/>}
        </TouchableOpacity>
        <TouchableOpacity style={st.navTab} onPress={()=>setActiveTab(2)}>
          <MaterialCommunityIcons name="message-text-outline" size={26} color={activeTab===2?HIJAU:"#AAA"}/>
          {activeTab===2&&<View style={st.navDot}/>}
        </TouchableOpacity>
        <TouchableOpacity style={st.navTab} onPress={()=>setActiveTab(3)}>
          <Ionicons name="bar-chart-outline" size={26} color={activeTab===3?HIJAU:"#AAA"}/>
          {activeTab===3&&<View style={st.navDot}/>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  header:{overflow:"hidden",backgroundColor:HIJAU,paddingBottom:16},
  overlay:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(28,88,76,0.65)"},
  headerInner:{paddingHorizontal:16,paddingTop:10,gap:10},
  profilRow:{flexDirection:"row",alignItems:"center"},
  avatarRing:{width:46,height:46,borderRadius:23,borderWidth:2,borderColor:"#fff",overflow:"hidden",backgroundColor:HIJAU},
  avatarImg:{width:"100%",height:"100%"},
  avatarFallback:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:HIJAU},
  adminNama:{color:"#fff",fontWeight:"700",fontSize:17},
  adminRole:{color:"rgba(255,255,255,0.8)",fontSize:12},
  logoutBtn:{width:36,height:36,borderRadius:8,backgroundColor:"rgba(255,255,255,0.18)",alignItems:"center",justifyContent:"center"},
  btnTambah:{flexDirection:"row",alignItems:"center",alignSelf:"flex-end",backgroundColor:"#fff",paddingHorizontal:12,paddingVertical:6,borderRadius:8,gap:4},
  btnTambahTxt:{color:HIJAU,fontWeight:"700",fontSize:13},
  searchRow:{flexDirection:"row",gap:8,alignItems:"center"},
  searchBox:{flex:1,flexDirection:"row",alignItems:"center",backgroundColor:"rgba(255,255,255,0.18)",borderRadius:30,borderWidth:1,borderColor:"rgba(255,255,255,0.3)",paddingHorizontal:12,paddingVertical:9,gap:6},
  searchInput:{flex:1,color:"#fff",fontSize:13,padding:0},
  filterBtn:{flexDirection:"row",alignItems:"center",backgroundColor:"rgba(255,255,255,0.18)",borderRadius:30,borderWidth:1,borderColor:"rgba(255,255,255,0.3)",paddingHorizontal:12,paddingVertical:9,gap:4},
  filterBtnTxt:{color:"#fff",fontSize:13,fontWeight:"600"},
  filterMenu:{backgroundColor:"#fff",borderRadius:10,overflow:"hidden",elevation:8,shadowColor:"#000",shadowOffset:{width:0,height:2},shadowOpacity:0.15,shadowRadius:6},
  filterMenuItem:{paddingVertical:11,paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:"#F3F4F6"},
  filterMenuTxt:{fontSize:14,color:"#374151"},
  statsRow:{flexDirection:"row",gap:10,paddingHorizontal:14,paddingTop:12,paddingBottom:6},
  statCard:{flex:1,backgroundColor:"#fff",borderRadius:12,padding:10,alignItems:"center",borderTopWidth:3,shadowColor:"#000",shadowOffset:{width:0,height:1},shadowOpacity:0.06,shadowRadius:4,elevation:2},
  statNum:{fontSize:22,fontWeight:"800",marginTop:4},
  statLabel:{fontSize:10,color:"#6B7280",textAlign:"center",marginTop:2},
  card:{flexDirection:"row",backgroundColor:"#fff",borderRadius:14,borderWidth:1.5,borderColor:KUNING,marginBottom:12,padding:14,alignItems:"center",shadowColor:"#000",shadowOpacity:0.05,shadowOffset:{width:0,height:2},shadowRadius:5,elevation:2},
  cardAvatar:{width:46,height:46,borderRadius:23,marginRight:12,overflow:"hidden",backgroundColor:HIJAU},
  cardAvatarImg:{width:"100%",height:"100%"},
  cardAvatarFallback:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:HIJAU},
  cardNama:{fontSize:15,fontWeight:"700",color:"#111",marginBottom:1},
  cardSub:{fontSize:11,color:"#777",marginBottom:1},
  cardRight:{alignItems:"flex-end",gap:8},
  badgeStatus:{flexDirection:"row",alignItems:"center",paddingHorizontal:8,paddingVertical:3,borderRadius:20,gap:4},
  badgeDot:{width:6,height:6,borderRadius:3},
  badgeTxtSmall:{fontSize:11,fontWeight:"600"},
  actionRow:{flexDirection:"row",gap:6},
  actionBtn:{width:30,height:30,borderRadius:8,backgroundColor:"#F3F4F6",justifyContent:"center",alignItems:"center"},
  emptyContainer:{alignItems:"center",paddingTop:60,gap:12},
  emptyTxt:{color:"#999",fontSize:14,textAlign:"center"},
  sectionTitle:{fontSize:15,fontWeight:"700",color:"#111",paddingHorizontal:16,paddingTop:10,paddingBottom:8},
  jadwalFilterBar:{flexDirection:"row",alignItems:"center",backgroundColor:"rgba(44,122,110,0.9)",paddingHorizontal:14,paddingVertical:12,gap:5},
  funnelBtn:{width:28,height:28,borderRadius:14,backgroundColor:"rgba(255,255,255,0.22)",alignItems:"center",justifyContent:"center"},
  filterInput:{color:"#fff",fontSize:13,paddingVertical:0,minWidth:82},
  filterDiv:{color:"rgba(255,255,255,0.4)",fontSize:20},
  resetTxt:{color:"#fff",fontWeight:"700",fontSize:13},
  shiftBadge:{alignSelf:"flex-start",borderWidth:1.5,borderColor:KUNING,borderRadius:20,paddingHorizontal:12,paddingVertical:4,marginBottom:6},
  shiftBadgeTxt:{color:KUNING,fontSize:11,fontWeight:"600"},
  jamBadge:{flexDirection:"row",alignItems:"center",alignSelf:"flex-start",backgroundColor:"#F0F0F0",borderRadius:20,paddingHorizontal:12,paddingVertical:4},
  jamTxt:{color:"#444",fontSize:11,fontWeight:"500"},
  subTabBar:{flexDirection:"row",marginHorizontal:14,marginVertical:14,backgroundColor:"rgba(44,122,110,0.12)",borderRadius:30,padding:4},
  subTabBtn:{flex:1,paddingVertical:10,borderRadius:26,alignItems:"center"},
  subTabActive:{backgroundColor:HIJAU},
  subTabTxt:{fontSize:13,fontWeight:"600",color:"#777"},
  subTabTxtActive:{color:"#fff"},
  pengajuanCard:{backgroundColor:"#fff",borderRadius:16,paddingHorizontal:16,paddingTop:14,paddingBottom:16,marginBottom:14,shadowColor:"#000",shadowOpacity:0.06,shadowOffset:{width:0,height:2},shadowRadius:6,elevation:3},
  rowBetween:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingBottom:12},
  divider:{height:1,backgroundColor:"#F0F0F0",marginBottom:12},
  jenisIzin:{fontSize:13,fontWeight:"600",color:"#222",marginBottom:8},
  infoTxt:{fontSize:12,color:"#555",flex:1,lineHeight:18},
  docBox:{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:"#F8F8F8",borderWidth:1,borderColor:KUNING,borderRadius:10,paddingHorizontal:14,paddingVertical:10,marginBottom:12},
  docTxt:{fontSize:12,color:"#555",flex:1},
  btnRow:{flexDirection:"row",gap:10,marginTop:14},
  btnSetuju:{flex:1,backgroundColor:HIJAU,borderRadius:12,paddingVertical:14,alignItems:"center"},
  btnSetujuTxt:{color:"#fff",fontWeight:"700",fontSize:14},
  btnTolak:{flex:1,backgroundColor:MERAH_LIGHT,borderRadius:12,paddingVertical:14,alignItems:"center",borderWidth:1,borderColor:"#F5CCCC"},
  btnTolakTxt:{color:MERAH,fontWeight:"700",fontSize:14},
  btnCetak:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,marginTop:14,paddingVertical:11,borderRadius:12,borderWidth:1.5,borderColor:HIJAU,backgroundColor:"#F0FDF4"},
  btnCetakTxt:{color:HIJAU,fontWeight:"700",fontSize:13},
  badge:{borderRadius:20,paddingHorizontal:12,paddingVertical:4},
  badgeTxt:{fontSize:12,fontWeight:"700"},
  aprBox:{flex:1,borderWidth:1,borderColor:"#E0E0E0",borderRadius:10,padding:10},
  aprLabel:{fontSize:11,fontWeight:"700",color:"#111",marginBottom:4},
  aprDot:{width:8,height:8,borderRadius:4},
  aprStatus:{fontSize:11,fontWeight:"600"},
  rekapCard:{backgroundColor:"#fff",borderRadius:14,padding:14,gap:12,shadowColor:"#000",shadowOffset:{width:0,height:1},shadowOpacity:0.06,shadowRadius:4,elevation:2},
  rekapLabel:{fontSize:12,fontWeight:"600",color:"#374151",marginBottom:4},
  ddBtn:{borderWidth:1,borderColor:"#D1D5DB",borderRadius:8,paddingHorizontal:10,paddingVertical:8,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  ddValue:{fontSize:13,color:"#111"},
  ddMenu:{position:"absolute",top:70,left:0,right:0,backgroundColor:"#fff",borderWidth:1,borderColor:"#D1D5DB",borderRadius:8,zIndex:999,elevation:10},
  ddItem:{paddingVertical:9,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:"#F3F4F6"},
  ddItemTxt:{fontSize:13,color:"#374151"},
  refreshBtn:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,paddingVertical:10,borderRadius:10,backgroundColor:"#F0FDF4",borderWidth:1,borderColor:"#D1FAE5"},
  refreshTxt:{color:HIJAU,fontWeight:"600",fontSize:13},
  navbar:{position:"absolute",bottom:0,left:0,right:0,flexDirection:"row",backgroundColor:"#fff",borderTopWidth:1,borderTopColor:"#E5E5E5",paddingTop:10,elevation:12,shadowColor:"#000",shadowOpacity:0.08,shadowOffset:{width:0,height:-2}},
  navTab:{flex:1,alignItems:"center",justifyContent:"center",gap:3},
  navDot:{width:5,height:5,borderRadius:3,backgroundColor:HIJAU},
  modalOverlay:{flex:1,backgroundColor:"rgba(0,0,0,0.45)",alignItems:"center",justifyContent:"center",paddingHorizontal:32},
  modalBox:{backgroundColor:"#fff",borderRadius:20,padding:24,width:"100%",alignItems:"center",shadowColor:"#000",shadowOpacity:0.15,shadowOffset:{width:0,height:8},shadowRadius:20,elevation:10},
  modalIconWrap:{width:60,height:60,borderRadius:30,backgroundColor:"#E8F5F3",alignItems:"center",justifyContent:"center",marginBottom:14},
  modalTitle:{fontSize:17,fontWeight:"700",color:"#111",marginBottom:6},
  modalMsg:{fontSize:13,color:"#666",textAlign:"center",lineHeight:20,marginBottom:20},
  modalActions:{flexDirection:"row",gap:12,width:"100%"},
  modalBtn:{flex:1,paddingVertical:12,borderRadius:12,alignItems:"center"},
  modalBtnCancel:{backgroundColor:"#F0F0F0"},
  modalBtnCancelTxt:{color:"#555",fontWeight:"600",fontSize:14},
  modalBtnLogout:{backgroundColor:HIJAU},
  modalBtnLogoutTxt:{color:"#fff",fontWeight:"700",fontSize:14},
});