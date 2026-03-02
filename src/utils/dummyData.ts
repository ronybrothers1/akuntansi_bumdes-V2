import { TransaksiKas, SaldoAwal, Inventaris, Persediaan, Piutang } from '../types';

export const DUMMY_SALDO_AWAL: SaldoAwal[] = [
  { kodeAkun: '11', debet: 15000000, kredit: 0 },
  { kodeAkun: '12', debet: 50000000, kredit: 0 },
  { kodeAkun: '14', debet: 5000000, kredit: 0 },
  { kodeAkun: '16', debet: 10000000, kredit: 0 },
  { kodeAkun: '31', debet: 0, kredit: 20000000 },
  { kodeAkun: '33', debet: 0, kredit: 60000000 },
];

export const DUMMY_TRANSAKSI: TransaksiKas[] = [
  {
    id: 't1',
    tanggal: '2025-01-05',
    noBukti: 'BKM-001',
    akunKas: '11',
    kodeAkun: '41',
    uraian: 'Pendapatan Toko Sembako minggu 1',
    masuk: 2500000,
    keluar: 0,
  },
  {
    id: 't2',
    tanggal: '2025-01-08',
    noBukti: 'BKK-001',
    akunKas: '11',
    kodeAkun: '51',
    uraian: 'Pembelian stok sembako',
    masuk: 0,
    keluar: 1500000,
  },
  {
    id: 't3',
    tanggal: '2025-01-12',
    noBukti: 'BKM-002',
    akunKas: '11',
    kodeAkun: '44',
    uraian: 'Angsuran pinjaman Pak Budi',
    masuk: 550000,
    keluar: 0,
  },
  {
    id: 't4',
    tanggal: '2025-01-15',
    noBukti: 'BKK-002',
    akunKas: '11',
    kodeAkun: '59',
    uraian: 'Biaya listrik dan air',
    masuk: 0,
    keluar: 300000,
  },
  {
    id: 't5',
    tanggal: '2025-01-20',
    noBukti: 'BKM-003',
    akunKas: '11',
    kodeAkun: '42',
    uraian: 'Pendapatan Apotik',
    masuk: 1200000,
    keluar: 0,
  },
];

export const DUMMY_INVENTARIS: Inventaris[] = [
  {
    id: 'i1',
    namaBarang: 'Komputer Kasir',
    satuan: 'Unit',
    tglPembelian: '2024-06-15',
    jumlah: 1,
    hargaBeli: 5000000,
    umurEkonomis: 4,
  },
  {
    id: 'i2',
    namaBarang: 'Etalase Kaca',
    satuan: 'Unit',
    tglPembelian: '2024-07-01',
    jumlah: 2,
    hargaBeli: 2500000,
    umurEkonomis: 5,
  }
];

export const DUMMY_PERSEDIAAN: Persediaan[] = [
  {
    id: 'p1',
    bulan: '2025-01',
    kodeBarang: 'BRG-001',
    namaBarang: 'Beras Premium 5kg',
    satuan: 'Sak',
    volAwal: 20,
    masuk: 50,
    keluar: 45,
    hargaBeli: 65000,
    hargaJual: 75000,
  },
  {
    id: 'p2',
    bulan: '2025-01',
    kodeBarang: 'BRG-002',
    namaBarang: 'Minyak Goreng 2L',
    satuan: 'Pcs',
    volAwal: 15,
    masuk: 30,
    keluar: 25,
    hargaBeli: 32000,
    hargaJual: 36000,
  }
];

export const DUMMY_PIUTANG: Piutang[] = [
  {
    id: 'pi1',
    nama: 'Budi Santoso',
    alamat: 'RT 01 RW 02',
    tanggalAkad: '2024-10-01',
    jumlahPinjaman: 5000000,
    bungaPersen: 1,
    jangkaWaktu: 10,
    angsuran: [
      { bulanKe: 1, tanggalBayar: '2024-11-05', pokok: 500000, bunga: 50000 },
      { bulanKe: 2, tanggalBayar: '2024-12-05', pokok: 500000, bunga: 50000 },
      { bulanKe: 3, tanggalBayar: '2025-01-12', pokok: 500000, bunga: 50000 },
    ]
  },
  {
    id: 'pi2',
    nama: 'Siti Aminah',
    alamat: 'RT 03 RW 01',
    tanggalAkad: '2024-12-15',
    jumlahPinjaman: 2000000,
    bungaPersen: 1.5,
    jangkaWaktu: 5,
    angsuran: [
      { bulanKe: 1, tanggalBayar: '2025-01-15', pokok: 400000, bunga: 30000 },
    ]
  }
];
