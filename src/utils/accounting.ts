import { TransaksiKas, JurnalMemorial, SaldoAwal, Akun } from '../types';

export const calculateJurnal = (
  transaksiKas: TransaksiKas[],
  jurnalMemorial: JurnalMemorial[]
) => {
  // JUM: Jurnal Uang Masuk (Kas bertambah -> Debet Kas, Kredit Akun Lain)
  const jum = transaksiKas
    .filter((t) => t.masuk > 0)
    .map((t) => ({
      ...t,
      debet: t.masuk,
      kredit: 0, // Kas di debet, akun t.kodeAkun di kredit
      akunDebet: t.akunKas || '11', // Kas atau Bank
      akunKredit: t.kodeAkun,
    }));

  // JUK: Jurnal Uang Keluar (Kas berkurang -> Kredit Kas, Debet Akun Lain)
  const juk = transaksiKas
    .filter((t) => t.keluar > 0)
    .map((t) => ({
      ...t,
      debet: t.keluar, // Akun t.kodeAkun di debet
      kredit: 0, // Kas di kredit
      akunDebet: t.kodeAkun,
      akunKredit: t.akunKas || '11', // Kas atau Bank
    }));

  return { jum, juk, jm: jurnalMemorial };
};

export const calculateBukuBesar = (
  akun: Akun[],
  saldoAwal: SaldoAwal[],
  transaksiKas: TransaksiKas[],
  jurnalMemorial: JurnalMemorial[]
) => {
  const mutasi: Record<string, { awalD: number; awalK: number; mutasiD: number; mutasiK: number; akhirD: number; akhirK: number }> = {};

  // Initialize with 0
  akun.forEach((a) => {
    mutasi[a.kode] = { awalD: 0, awalK: 0, mutasiD: 0, mutasiK: 0, akhirD: 0, akhirK: 0 };
  });

  // Saldo Awal
  saldoAwal.forEach((s) => {
    if (mutasi[s.kodeAkun]) {
      mutasi[s.kodeAkun].awalD = s.debet || 0;
      mutasi[s.kodeAkun].awalK = s.kredit || 0;
    }
  });

  // Mutasi dari Kas Harian
  transaksiKas.forEach((t) => {
    const akunKas = t.akunKas || '11';
    // Uang Masuk
    if (t.masuk > 0) {
      if (mutasi[akunKas]) mutasi[akunKas].mutasiD += t.masuk;
      if (mutasi[t.kodeAkun]) mutasi[t.kodeAkun].mutasiK += t.masuk;
    }
    // Uang Keluar
    if (t.keluar > 0) {
      if (mutasi[akunKas]) mutasi[akunKas].mutasiK += t.keluar;
      if (mutasi[t.kodeAkun]) mutasi[t.kodeAkun].mutasiD += t.keluar;
    }
  });

  // Mutasi dari Jurnal Memorial
  jurnalMemorial.forEach((jm) => {
    jm.detail.forEach((d) => {
      if (mutasi[d.kodeAkun]) {
        mutasi[d.kodeAkun].mutasiD += d.debet || 0;
        mutasi[d.kodeAkun].mutasiK += d.kredit || 0;
      }
    });
  });

  // Calculate Saldo Akhir
  akun.forEach((a) => {
    const m = mutasi[a.kode];
    const totalD = m.awalD + m.mutasiD;
    const totalK = m.awalK + m.mutasiK;

    if (a.saldoNormal === 'D') {
      const saldo = totalD - totalK;
      if (saldo >= 0) {
        m.akhirD = saldo;
        m.akhirK = 0;
      } else {
        m.akhirD = 0;
        m.akhirK = Math.abs(saldo);
      }
    } else {
      const saldo = totalK - totalD;
      if (saldo >= 0) {
        m.akhirK = saldo;
        m.akhirD = 0;
      } else {
        m.akhirK = 0;
        m.akhirD = Math.abs(saldo);
      }
    }
  });

  return mutasi;
};

export const calculateLabaRugi = (
  akun: Akun[],
  mutasiBukuBesar: Record<string, any>
) => {
  let totalPendapatan = 0;
  let totalHpp = 0;
  let totalBiaya = 0;
  const detailPendapatan: { kode: string; nama: string; jumlah: number }[] = [];
  const detailHpp: { kode: string; nama: string; jumlah: number }[] = [];
  const detailBiaya: { kode: string; nama: string; jumlah: number }[] = [];

  akun.forEach((a) => {
    const m = mutasiBukuBesar[a.kode];
    if (!m) return;

    if (a.kategori === 'PENDAPATAN') {
      const saldo = m.akhirK - m.akhirD; // Normal K
      if (saldo !== 0) {
        detailPendapatan.push({ kode: a.kode, nama: a.nama, jumlah: saldo });
        totalPendapatan += saldo;
      }
    } else if (a.kategori === 'HPP') {
      const saldo = m.akhirD - m.akhirK; // Normal D
      if (saldo !== 0) {
        detailHpp.push({ kode: a.kode, nama: a.nama, jumlah: saldo });
        totalHpp += saldo;
      }
    } else if (a.kategori === 'BIAYA') {
      const saldo = m.akhirD - m.akhirK; // Normal D
      if (saldo !== 0) {
        detailBiaya.push({ kode: a.kode, nama: a.nama, jumlah: saldo });
        totalBiaya += saldo;
      }
    }
  });

  const labaKotor = totalPendapatan - totalHpp;
  const labaBersih = labaKotor - totalBiaya;

  return {
    pendapatan: detailPendapatan,
    hpp: detailHpp,
    biaya: detailBiaya,
    totalPendapatan,
    totalHpp,
    labaKotor,
    totalBiaya,
    labaRugi: labaBersih,
  };
};

export const calculateNeraca = (
  akun: Akun[],
  mutasiBukuBesar: Record<string, any>,
  labaRugiBerjalan: number
) => {
  let totalAktiva = 0;
  let totalPasiva = 0;
  const detailAktiva: { kode: string; nama: string; jumlah: number }[] = [];
  const detailHutang: { kode: string; nama: string; jumlah: number }[] = [];
  const detailModal: { kode: string; nama: string; jumlah: number }[] = [];

  akun.forEach((a) => {
    const m = mutasiBukuBesar[a.kode];
    if (!m) return;

    if (a.kategori === 'AKTIVA') {
      let saldo = m.akhirD - m.akhirK;
      if (a.saldoNormal === 'K') saldo = m.akhirK - m.akhirD; // e.g. Akumulasi Penyusutan
      
      if (saldo !== 0 || m.awalD !== 0 || m.awalK !== 0) {
        detailAktiva.push({ kode: a.kode, nama: a.nama, jumlah: a.saldoNormal === 'K' ? -saldo : saldo });
        totalAktiva += a.saldoNormal === 'K' ? -saldo : saldo;
      }
    } else if (a.kategori === 'HUTANG') {
      const saldo = m.akhirK - m.akhirD;
      if (saldo !== 0 || m.awalD !== 0 || m.awalK !== 0) {
        detailHutang.push({ kode: a.kode, nama: a.nama, jumlah: saldo });
        totalPasiva += saldo;
      }
    } else if (a.kategori === 'MODAL') {
      const saldo = m.akhirK - m.akhirD;
      if (saldo !== 0 || m.awalD !== 0 || m.awalK !== 0) {
        detailModal.push({ kode: a.kode, nama: a.nama, jumlah: saldo });
        totalPasiva += saldo;
      }
    }
  });

  // Tambahkan laba rugi tahun berjalan ke modal
  if (labaRugiBerjalan !== 0) {
    const existingLaba = detailModal.find(m => m.kode === '35');
    if (existingLaba) {
      existingLaba.jumlah += labaRugiBerjalan;
    } else {
      detailModal.push({ kode: '35', nama: 'Laba Tahun Berjalan', jumlah: labaRugiBerjalan });
    }
    totalPasiva += labaRugiBerjalan;
  }

  return {
    aktiva: detailAktiva,
    hutang: detailHutang,
    modal: detailModal,
    totalAktiva,
    totalPasiva,
    isBalance: totalAktiva === totalPasiva,
  };
};

export const calculateArusKas = (
  akun: Akun[],
  transaksiKas: TransaksiKas[]
) => {
  let operasiMasuk = 0;
  let operasiKeluar = 0;
  let investasiMasuk = 0;
  let investasiKeluar = 0;
  let pendanaanMasuk = 0;
  let pendanaanKeluar = 0;

  const detailOperasi: { uraian: string; masuk: number; keluar: number }[] = [];
  const detailInvestasi: { uraian: string; masuk: number; keluar: number }[] = [];
  const detailPendanaan: { uraian: string; masuk: number; keluar: number }[] = [];

  transaksiKas.forEach(t => {
    const akunLawan = akun.find(a => a.kode === t.kodeAkun);
    if (!akunLawan) return;

    const item = { uraian: t.uraian, masuk: t.masuk, keluar: t.keluar };

    // Kategori Operasi: Pendapatan, HPP, Biaya, Piutang, Persediaan, Sewa Dibayar Dimuka, Hutang Usaha
    if (['PENDAPATAN', 'HPP', 'BIAYA'].includes(akunLawan.kategori) || ['13', '14', '15', '17', '21'].includes(akunLawan.kode)) {
      detailOperasi.push(item);
      operasiMasuk += t.masuk;
      operasiKeluar += t.keluar;
    } 
    // Kategori Investasi: Peralatan, Akumulasi Penyusutan, Aset Tak Berwujud
    else if (['16', '18', '19'].includes(akunLawan.kode)) {
      detailInvestasi.push(item);
      investasiMasuk += t.masuk;
      investasiKeluar += t.keluar;
    }
    // Kategori Pendanaan: Modal, Hutang Bank, Simpanan Anggota
    else if (['MODAL'].includes(akunLawan.kategori) || ['22', '23'].includes(akunLawan.kode)) {
      detailPendanaan.push(item);
      pendanaanMasuk += t.masuk;
      pendanaanKeluar += t.keluar;
    }
  });

  const arusKasOperasi = operasiMasuk - operasiKeluar;
  const arusKasInvestasi = investasiMasuk - investasiKeluar;
  const arusKasPendanaan = pendanaanMasuk - pendanaanKeluar;
  const kenaikanPenurunanKas = arusKasOperasi + arusKasInvestasi + arusKasPendanaan;

  return {
    detailOperasi,
    detailInvestasi,
    detailPendanaan,
    arusKasOperasi,
    arusKasInvestasi,
    arusKasPendanaan,
    kenaikanPenurunanKas
  };
};

export const calculateRasioKeuangan = (
  aktiva: { kode: string; nama: string; jumlah: number }[],
  hutang: { kode: string; nama: string; jumlah: number }[],
  modal: { kode: string; nama: string; jumlah: number }[],
  totalAktiva: number,
  totalPasiva: number,
  labaRugi: number,
  totalPendapatan: number
) => {
  // Aktiva Lancar: Kas, Bank, Piutang, Persediaan, Sewa Dibayar Dimuka (Kode 11-17)
  const aktivaLancar = aktiva.filter(a => {
    const k = parseInt(a.kode);
    return k >= 11 && k <= 17;
  }).reduce((sum, a) => sum + a.jumlah, 0);

  // Persediaan: Kode 14, 15
  const persediaan = aktiva.filter(a => a.kode === '14' || a.kode === '15')
                           .reduce((sum, a) => sum + a.jumlah, 0);

  // Hutang Lancar: Hutang Usaha, Simpanan Anggota (Kode 21, 22)
  const hutangLancar = hutang.filter(h => h.kode === '21' || h.kode === '22')
                             .reduce((sum, h) => sum + h.jumlah, 0);

  const totalHutang = hutang.reduce((sum, h) => sum + h.jumlah, 0);
  const totalModal = modal.reduce((sum, m) => sum + m.jumlah, 0);

  // Likuiditas
  const currentRatio = hutangLancar > 0 ? (aktivaLancar / hutangLancar) * 100 : 0;
  const quickRatio = hutangLancar > 0 ? ((aktivaLancar - persediaan) / hutangLancar) * 100 : 0;

  // Solvabilitas
  const debtToAssetRatio = totalAktiva > 0 ? (totalHutang / totalAktiva) * 100 : 0;
  const debtToEquityRatio = totalModal > 0 ? (totalHutang / totalModal) * 100 : 0;

  // Profitabilitas
  const netProfitMargin = totalPendapatan > 0 ? (labaRugi / totalPendapatan) * 100 : 0;
  const returnOnAssets = totalAktiva > 0 ? (labaRugi / totalAktiva) * 100 : 0;
  const returnOnEquity = totalModal > 0 ? (labaRugi / totalModal) * 100 : 0;

  return {
    likuiditas: {
      currentRatio,
      quickRatio
    },
    solvabilitas: {
      debtToAssetRatio,
      debtToEquityRatio
    },
    profitabilitas: {
      netProfitMargin,
      returnOnAssets,
      returnOnEquity
    }
  };
};
