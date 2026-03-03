import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { 
  BumdesConfig, UnitUsaha, Akun, SaldoAwal, TransaksiKas, 
  Inventaris, Persediaan, Piutang, Hutang, JurnalMemorial, ShuConfig 
} from './types';
import { DEFAULT_AKUN, DEFAULT_UNIT_USAHA, DEFAULT_SHU_CONFIG, DEFAULT_CONFIG } from './constants';

const customStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const token = localStorage.getItem('bumdes_token');
    if (!token) return null;
    
    try {
      const response = await fetch('/api/storage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        return data.data ? JSON.stringify(data.data) : null;
      }
    } catch (error) {
      console.error('Failed to fetch storage', error);
    }
    return null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const token = localStorage.getItem('bumdes_token');
    if (!token) return;
    
    try {
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ data: JSON.parse(value) })
      });
    } catch (error) {
      console.error('Failed to save storage', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    // We don't really need to remove it from backend, but we could
  }
};

interface AppState {
  config: BumdesConfig;
  unitUsaha: UnitUsaha[];
  akun: Akun[];
  saldoAwal: SaldoAwal[];
  transaksiKas: TransaksiKas[];
  inventaris: Inventaris[];
  persediaan: Persediaan[];
  piutang: Piutang[];
  hutang: Hutang[];
  jurnalMemorial: JurnalMemorial[];
  shuConfig: ShuConfig;

  setConfig: (config: BumdesConfig) => void;
  setUnitUsaha: (units: UnitUsaha[]) => void;
  setAkun: (akun: Akun[]) => void;
  addAkun: (akun: Akun) => void;
  updateAkun: (kode: string, akun: Akun) => void;
  deleteAkun: (kode: string) => void;
  setSaldoAwal: (saldo: SaldoAwal[]) => void;
  addTransaksiKas: (transaksi: TransaksiKas) => void;
  updateTransaksiKas: (id: string, transaksi: TransaksiKas) => void;
  deleteTransaksiKas: (id: string) => void;
  addInventaris: (item: Inventaris) => void;
  updateInventaris: (id: string, item: Inventaris) => void;
  deleteInventaris: (id: string) => void;
  addPersediaan: (item: Persediaan) => void;
  updatePersediaan: (id: string, item: Persediaan) => void;
  deletePersediaan: (id: string) => void;
  addPiutang: (item: Piutang) => void;
  updatePiutang: (id: string, item: Piutang) => void;
  deletePiutang: (id: string) => void;
  addHutang: (item: Hutang) => void;
  updateHutang: (id: string, item: Hutang) => void;
  deleteHutang: (id: string) => void;
  addJurnalMemorial: (jurnal: JurnalMemorial) => void;
  updateJurnalMemorial: (id: string, jurnal: JurnalMemorial) => void;
  deleteJurnalMemorial: (id: string) => void;
  setShuConfig: (config: ShuConfig) => void;
  resetData: () => void;
}

const generateAkunFromUnitUsaha = (units: UnitUsaha[], existingAkun: Akun[] = []): Akun[] => {
  const akunPendapatan: Akun[] = units.map(u => ({
    kode: u.kodePendapatan,
    nama: `Pendapatan ${u.nama}`,
    kategori: 'PENDAPATAN',
    saldoNormal: 'K',
    isSystem: true
  }));
  const akunHpp: Akun[] = units.map(u => ({
    kode: u.kodeHpp,
    nama: `HPP ${u.nama}`,
    kategori: 'HPP',
    saldoNormal: 'D',
    isSystem: true
  }));
  const akunBiaya: Akun[] = units.map(u => ({
    kode: u.kodeBiaya,
    nama: `Biaya ${u.nama}`,
    kategori: 'BIAYA',
    saldoNormal: 'D',
    isSystem: true
  }));
  
  // Sort default akun
  const defaultAkun = [...DEFAULT_AKUN];
  
  // Get custom accounts (not system)
  const customAkun = existingAkun.filter(a => !a.isSystem);
  
  return [...defaultAkun, ...akunPendapatan, ...akunHpp, ...akunBiaya, ...customAkun].sort((a, b) => a.kode.localeCompare(b.kode));
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      unitUsaha: DEFAULT_UNIT_USAHA,
      akun: generateAkunFromUnitUsaha(DEFAULT_UNIT_USAHA),
      saldoAwal: [],
      transaksiKas: [],
      inventaris: [],
      persediaan: [],
      piutang: [],
      hutang: [],
      jurnalMemorial: [],
      shuConfig: DEFAULT_SHU_CONFIG,

      setConfig: (config) => set({ config }),
      setUnitUsaha: (unitUsaha) => set((state) => ({ 
        unitUsaha, 
        akun: generateAkunFromUnitUsaha(unitUsaha, state.akun) 
      })),
      setAkun: (akun) => set({ akun }),
      addAkun: (newAkun) => set((state) => ({ 
        akun: [...state.akun, newAkun].sort((a, b) => a.kode.localeCompare(b.kode)) 
      })),
      updateAkun: (kode, updatedAkun) => set((state) => ({
        akun: state.akun.map((a) => (a.kode === kode ? updatedAkun : a)).sort((a, b) => a.kode.localeCompare(b.kode)),
      })),
      deleteAkun: (kode) => set((state) => ({
        akun: state.akun.filter((a) => a.kode !== kode),
      })),
      setSaldoAwal: (saldoAwal) => set({ saldoAwal }),
      addTransaksiKas: (transaksi) => set((state) => ({ transaksiKas: [...state.transaksiKas, transaksi] })),
      updateTransaksiKas: (id, transaksi) => set((state) => ({
        transaksiKas: state.transaksiKas.map((t) => (t.id === id ? transaksi : t)),
      })),
      deleteTransaksiKas: (id) => set((state) => ({
        transaksiKas: state.transaksiKas.filter((t) => t.id !== id),
      })),
      addInventaris: (item) => set((state) => ({ inventaris: [...state.inventaris, item] })),
      updateInventaris: (id, item) => set((state) => ({
        inventaris: state.inventaris.map((i) => (i.id === id ? item : i)),
      })),
      deleteInventaris: (id) => set((state) => ({
        inventaris: state.inventaris.filter((i) => i.id !== id),
      })),
      addPersediaan: (item) => set((state) => ({ persediaan: [...state.persediaan, item] })),
      updatePersediaan: (id, item) => set((state) => ({
        persediaan: state.persediaan.map((p) => (p.id === id ? item : p)),
      })),
      deletePersediaan: (id) => set((state) => ({
        persediaan: state.persediaan.filter((p) => p.id !== id),
      })),
      addPiutang: (item) => set((state) => ({ piutang: [...state.piutang, item] })),
      updatePiutang: (id, item) => set((state) => ({
        piutang: state.piutang.map((p) => (p.id === id ? item : p)),
      })),
      deletePiutang: (id) => set((state) => ({
        piutang: state.piutang.filter((p) => p.id !== id),
      })),
      addHutang: (item) => set((state) => ({ hutang: [...state.hutang, item] })),
      updateHutang: (id, item) => set((state) => ({
        hutang: state.hutang.map((h) => (h.id === id ? item : h)),
      })),
      deleteHutang: (id) => set((state) => ({
        hutang: state.hutang.filter((h) => h.id !== id),
      })),
      addJurnalMemorial: (jurnal) => set((state) => ({ jurnalMemorial: [...state.jurnalMemorial, jurnal] })),
      updateJurnalMemorial: (id, jurnal) => set((state) => ({
        jurnalMemorial: state.jurnalMemorial.map((j) => (j.id === id ? jurnal : j)),
      })),
      deleteJurnalMemorial: (id) => set((state) => ({
        jurnalMemorial: state.jurnalMemorial.filter((j) => j.id !== id),
      })),
      setShuConfig: (shuConfig) => set({ shuConfig }),
      resetData: () => set({
        config: DEFAULT_CONFIG,
        unitUsaha: DEFAULT_UNIT_USAHA,
        akun: generateAkunFromUnitUsaha(DEFAULT_UNIT_USAHA),
        saldoAwal: [],
        transaksiKas: [],
        inventaris: [],
        persediaan: [],
        piutang: [],
        hutang: [],
        jurnalMemorial: [],
        shuConfig: DEFAULT_SHU_CONFIG,
      }),
    }),
    {
      name: 'bumdes-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
