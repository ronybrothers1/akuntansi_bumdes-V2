import { Akun, UnitUsaha, ShuConfig, BumdesConfig } from './types';

export const DEFAULT_AKUN: Akun[] = [
  { kode: '11', nama: 'Kas', kategori: 'AKTIVA', saldoNormal: 'D' },
  { kode: '12', nama: 'Bank', kategori: 'AKTIVA', saldoNormal: 'D' },
  { kode: '13', nama: 'Piutang Dagang', kategori: 'AKTIVA', saldoNormal: 'D' },
  { kode: '14', nama: 'Persediaan Barang Dagang', kategori: 'AKTIVA', saldoNormal: 'D' },
  { kode: '15', nama: 'Persediaan Gas', kategori: 'AKTIVA', saldoNormal: 'D' },
  { kode: '16', nama: 'Peralatan', kategori: 'AKTIVA', saldoNormal: 'D' },
  { kode: '17', nama: 'Sewa Dibayar Dimuka', kategori: 'AKTIVA', saldoNormal: 'D' },
  { kode: '18', nama: 'Akumulasi Penyusutan', kategori: 'AKTIVA', saldoNormal: 'K' },
  { kode: '19', nama: 'Aset Tak Berwujud', kategori: 'AKTIVA', saldoNormal: 'D' },
  
  { kode: '21', nama: 'Hutang Usaha', kategori: 'HUTANG', saldoNormal: 'K' },
  { kode: '22', nama: 'Simpanan Anggota', kategori: 'HUTANG', saldoNormal: 'K' },
  { kode: '23', nama: 'Hutang Bank', kategori: 'HUTANG', saldoNormal: 'K' },
  
  { kode: '31', nama: 'Simpanan Pokok', kategori: 'MODAL', saldoNormal: 'K' },
  { kode: '32', nama: 'Simpanan Wajib', kategori: 'MODAL', saldoNormal: 'K' },
  { kode: '33', nama: 'Hibah Desa', kategori: 'MODAL', saldoNormal: 'K' },
  { kode: '34', nama: 'Laba Ditahan', kategori: 'MODAL', saldoNormal: 'K' },
  { kode: '35', nama: 'Laba Tahun Berjalan', kategori: 'MODAL', saldoNormal: 'K' },
  
  { kode: '59', nama: 'Biaya Operasional Pengurus / Biaya Lain-lain', kategori: 'BIAYA', saldoNormal: 'D' },
];

export const DEFAULT_UNIT_USAHA: UnitUsaha[] = [
  { id: '1', nama: 'Toko Sembako', kodePendapatan: '41', kodeHpp: '501', kodeBiaya: '51' },
  { id: '2', nama: 'Apotik', kodePendapatan: '42', kodeHpp: '502', kodeBiaya: '52' },
  { id: '3', nama: 'Agen Gas', kodePendapatan: '43', kodeHpp: '503', kodeBiaya: '53' },
  { id: '4', nama: 'Jasa Simpan Pinjam', kodePendapatan: '44', kodeHpp: '504', kodeBiaya: '54' },
];

export const DEFAULT_SHU_CONFIG: ShuConfig = {
  cadanganModal: 30,
  jasaAnggota: 20,
  pengembanganUsaha: 20,
  danaSosial: 10,
  danaPendidikan: 10,
  kasBumdes: 10,
};

export const DEFAULT_CONFIG: BumdesConfig = {
  namaBumdes: 'BUMDes Sejahtera',
  namaDesa: 'Sukamaju',
  kecamatan: 'Sukamaju',
  kabupaten: 'Sukamaju',
  direktur: 'Budi Santoso',
  bendahara: 'Siti Aminah',
  sekretaris: 'Agus Setiawan',
  penasehat: 'Kepala Desa',
  pengawas: 'BPD',
  periodeTahun: new Date().getFullYear(),
  periodeBulanMulai: 1,
  periodeBulanSelesai: 12,
};
