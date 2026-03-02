export type BumdesConfig = {
  namaBumdes: string;
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  direktur: string;
  bendahara: string;
  sekretaris: string;
  penasehat: string;
  pengawas: string;
  periodeTahun: number;
  periodeBulanMulai: number;
  periodeBulanSelesai: number;
};

export type UnitUsaha = {
  id: string;
  nama: string;
  kodePendapatan: string;
  kodeHpp: string;
  kodeBiaya: string;
};

export type Akun = {
  kode: string;
  nama: string;
  kategori: 'AKTIVA' | 'HUTANG' | 'MODAL' | 'PENDAPATAN' | 'HPP' | 'BIAYA';
  saldoNormal: 'D' | 'K';
};

export type SaldoAwal = {
  kodeAkun: string;
  debet: number;
  kredit: number;
};

export type TransaksiKas = {
  id: string;
  tanggal: string;
  noBukti: string;
  akunKas: string; // '11' for Kas, '12' for Bank
  kodeAkun: string;
  uraian: string;
  masuk: number;
  keluar: number;
};

export type Inventaris = {
  id: string;
  namaBarang: string;
  satuan: string;
  tglPembelian: string;
  jumlah: number;
  hargaBeli: number;
  umurEkonomis: number; // tahun
};

export type Persediaan = {
  id: string;
  bulan: string; // YYYY-MM
  kodeBarang: string;
  namaBarang: string;
  satuan: string;
  volAwal: number;
  masuk: number;
  keluar: number;
  hargaBeli: number;
  hargaJual: number;
};

export type Piutang = {
  id: string;
  nama: string;
  alamat: string;
  tanggalAkad: string;
  jumlahPinjaman: number;
  bungaPersen: number;
  jangkaWaktu: number; // bulan
  angsuran: {
    bulanKe: number;
    tanggalBayar: string;
    pokok: number;
    bunga: number;
  }[];
};

export type Hutang = {
  id: string;
  namaKreditur: string;
  tanggalAkad: string;
  jumlahPinjaman: number;
  bungaPersen: number;
  jangkaWaktu: number; // bulan
  angsuran: {
    bulanKe: number;
    tanggalBayar: string;
    pokok: number;
    bunga: number;
  }[];
};

export type JurnalMemorial = {
  id: string;
  tanggal: string;
  noBukti: string;
  uraian: string;
  detail: {
    kodeAkun: string;
    debet: number;
    kredit: number;
  }[];
};

export type ShuConfig = {
  cadanganModal: number;
  jasaAnggota: number;
  pengembanganUsaha: number;
  danaSosial: number;
  danaPendidikan: number;
  kasBumdes: number;
};
