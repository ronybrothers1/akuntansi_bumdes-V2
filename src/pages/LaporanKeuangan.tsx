import React, { useState } from 'react';
import { useStore } from '../store';
import { calculateBukuBesar, calculateLabaRugi, calculateNeraca, calculateArusKas, calculateRasioKeuangan } from '../utils/accounting';
import { exportToExcel, exportToPDF } from '../utils/export';
import { Download, Printer, FileText } from 'lucide-react';

export default function LaporanKeuangan() {
  const { config, akun, saldoAwal, transaksiKas, jurnalMemorial, shuConfig } = useStore();
  const [activeTab, setActiveTab] = useState<'LR' | 'SHU' | 'PM' | 'NERACA' | 'ARUS_KAS' | 'RASIO'>('LR');

  const mutasiBukuBesar = calculateBukuBesar(akun, saldoAwal, transaksiKas, jurnalMemorial);
  const { pendapatan, hpp, biaya, totalPendapatan, totalHpp, labaKotor, totalBiaya, labaRugi } = calculateLabaRugi(akun, mutasiBukuBesar);
  const { aktiva, hutang, modal, totalAktiva, totalPasiva, isBalance } = calculateNeraca(akun, mutasiBukuBesar, labaRugi);
  const { detailOperasi, detailInvestasi, detailPendanaan, arusKasOperasi, arusKasInvestasi, arusKasPendanaan, kenaikanPenurunanKas } = calculateArusKas(akun, transaksiKas);
  const rasio = calculateRasioKeuangan(aktiva, hutang, modal, totalAktiva, totalPasiva, labaRugi, totalPendapatan);

  // Calculate Modal Awal
  const modalAwal = saldoAwal.filter(s => akun.find(a => a.kode === s.kodeAkun)?.kategori === 'MODAL')
                             .reduce((sum, s) => sum + (s.kredit || 0) - (s.debet || 0), 0);
  
  // Calculate Prive / Pengambilan (if any)
  const prive = 0; // Assuming no prive account for now, or can be added later

  const modalAkhir = modalAwal + labaRugi - prive;
  
  // Saldo Kas Awal
  const saldoKasAwal = saldoAwal.filter(s => s.kodeAkun === '11' || s.kodeAkun === '12')
                                .reduce((sum, s) => sum + (s.debet || 0) - (s.kredit || 0), 0);
  const saldoKasAkhir = saldoKasAwal + kenaikanPenurunanKas;

  const handleExportExcel = () => {
    if (activeTab === 'LR') {
      const data = [
        ...pendapatan.map(p => ({ uraian: p.nama, jumlah: p.jumlah.toLocaleString('id-ID') })),
        { uraian: 'Total Pendapatan', jumlah: totalPendapatan.toLocaleString('id-ID') },
        { uraian: '', jumlah: '' },
        ...hpp.map(h => ({ uraian: h.nama, jumlah: h.jumlah.toLocaleString('id-ID') })),
        { uraian: 'Total HPP', jumlah: `(${totalHpp.toLocaleString('id-ID')})` },
        { uraian: '', jumlah: '' },
        { uraian: 'LABA KOTOR', jumlah: labaKotor.toLocaleString('id-ID') },
        { uraian: '', jumlah: '' },
        ...biaya.map(b => ({ uraian: b.nama, jumlah: b.jumlah.toLocaleString('id-ID') })),
        { uraian: 'Total Biaya', jumlah: `(${totalBiaya.toLocaleString('id-ID')})` },
        { uraian: '', jumlah: '' },
        { uraian: 'SISA HASIL USAHA (SHU) BERSIH', jumlah: labaRugi.toLocaleString('id-ID') }
      ];
      exportToExcel(data, [{ header: 'Uraian', key: 'uraian', width: 40 }, { header: 'Jumlah (Rp)', key: 'jumlah', width: 20 }], 'Laba_Rugi', 'Laba Rugi', config, 'LAPORAN LABA RUGI');
    } else if (activeTab === 'SHU') {
      const data = [
        { uraian: 'SISA HASIL USAHA (SHU)', persentase: '', jumlah: labaRugi.toLocaleString('id-ID') },
        { uraian: '', persentase: '', jumlah: '' },
        { uraian: '1. Cadangan Modal BUMDes', persentase: `${shuConfig.cadanganModal}%`, jumlah: ((labaRugi * shuConfig.cadanganModal) / 100).toLocaleString('id-ID') },
        { uraian: '2. Jasa Anggota / PADes', persentase: `${shuConfig.jasaAnggota}%`, jumlah: ((labaRugi * shuConfig.jasaAnggota) / 100).toLocaleString('id-ID') },
        { uraian: '3. Pengembangan Usaha', persentase: `${shuConfig.pengembanganUsaha}%`, jumlah: ((labaRugi * shuConfig.pengembanganUsaha) / 100).toLocaleString('id-ID') },
        { uraian: '4. Dana Sosial', persentase: `${shuConfig.danaSosial}%`, jumlah: ((labaRugi * shuConfig.danaSosial) / 100).toLocaleString('id-ID') },
        { uraian: '5. Dana Pendidikan', persentase: `${shuConfig.danaPendidikan}%`, jumlah: ((labaRugi * shuConfig.danaPendidikan) / 100).toLocaleString('id-ID') },
        { uraian: '6. Kas BUMDes / Pengurus', persentase: `${shuConfig.kasBumdes}%`, jumlah: ((labaRugi * shuConfig.kasBumdes) / 100).toLocaleString('id-ID') },
        { uraian: '', persentase: '', jumlah: '' },
        { uraian: 'TOTAL ALOKASI (100%)', persentase: '', jumlah: labaRugi.toLocaleString('id-ID') }
      ];
      exportToExcel(data, [{ header: 'Alokasi', key: 'uraian', width: 40 }, { header: 'Persentase', key: 'persentase', width: 15 }, { header: 'Jumlah (Rp)', key: 'jumlah', width: 20 }], 'Pembagian_SHU', 'Pembagian SHU', config, 'LAPORAN PEMBAGIAN SHU');
    } else if (activeTab === 'PM') {
      const data = [
        { uraian: 'Modal Awal', jumlah: modalAwal.toLocaleString('id-ID') },
        { uraian: 'Laba (Rugi) Bersih', jumlah: labaRugi.toLocaleString('id-ID') },
        { uraian: 'Prive / Pengambilan', jumlah: `(${prive.toLocaleString('id-ID')})` },
        { uraian: '', jumlah: '' },
        { uraian: 'MODAL AKHIR', jumlah: modalAkhir.toLocaleString('id-ID') }
      ];
      exportToExcel(data, [{ header: 'Uraian', key: 'uraian', width: 40 }, { header: 'Jumlah (Rp)', key: 'jumlah', width: 20 }], 'Perubahan_Modal', 'Perubahan Modal', config, 'LAPORAN PERUBAHAN MODAL');
    } else if (activeTab === 'NERACA') {
      const data = [
        { aktiva: 'AKTIVA', jumlahAktiva: '', pasiva: 'PASIVA', jumlahPasiva: '' },
        ...Array.from({ length: Math.max(aktiva.length, hutang.length + modal.length) }).map((_, i) => ({
          aktiva: aktiva[i]?.nama || '',
          jumlahAktiva: aktiva[i]?.jumlah !== undefined ? aktiva[i].jumlah.toLocaleString('id-ID') : '',
          pasiva: i < hutang.length ? hutang[i]?.nama : modal[i - hutang.length]?.nama || '',
          jumlahPasiva: i < hutang.length 
            ? (hutang[i]?.jumlah !== undefined ? hutang[i].jumlah.toLocaleString('id-ID') : '') 
            : (modal[i - hutang.length]?.jumlah !== undefined ? modal[i - hutang.length].jumlah.toLocaleString('id-ID') : ''),
        })),
        { aktiva: '', jumlahAktiva: '', pasiva: '', jumlahPasiva: '' },
        { aktiva: 'TOTAL AKTIVA', jumlahAktiva: totalAktiva.toLocaleString('id-ID'), pasiva: 'TOTAL PASIVA', jumlahPasiva: totalPasiva.toLocaleString('id-ID') }
      ];
      exportToExcel(data, [
        { header: 'Aktiva', key: 'aktiva', width: 30 }, 
        { header: 'Jumlah (Rp)', key: 'jumlahAktiva', width: 20 },
        { header: 'Pasiva', key: 'pasiva', width: 30 }, 
        { header: 'Jumlah (Rp)', key: 'jumlahPasiva', width: 20 }
      ], 'Neraca', 'Neraca', config, 'NERACA (BALANCE SHEET)');
    } else if (activeTab === 'ARUS_KAS') {
      const data = [
        { uraian: 'ARUS KAS DARI AKTIVITAS OPERASI', jumlah: '' },
        ...detailOperasi.map(d => ({ uraian: `  ${d.uraian}`, jumlah: (d.masuk > 0 ? d.masuk : -d.keluar).toLocaleString('id-ID') })),
        { uraian: 'Arus Kas Bersih dari Aktivitas Operasi', jumlah: arusKasOperasi.toLocaleString('id-ID') },
        { uraian: '', jumlah: '' },
        { uraian: 'ARUS KAS DARI AKTIVITAS INVESTASI', jumlah: '' },
        ...detailInvestasi.map(d => ({ uraian: `  ${d.uraian}`, jumlah: (d.masuk > 0 ? d.masuk : -d.keluar).toLocaleString('id-ID') })),
        { uraian: 'Arus Kas Bersih dari Aktivitas Investasi', jumlah: arusKasInvestasi.toLocaleString('id-ID') },
        { uraian: '', jumlah: '' },
        { uraian: 'ARUS KAS DARI AKTIVITAS PENDANAAN', jumlah: '' },
        ...detailPendanaan.map(d => ({ uraian: `  ${d.uraian}`, jumlah: (d.masuk > 0 ? d.masuk : -d.keluar).toLocaleString('id-ID') })),
        { uraian: 'Arus Kas Bersih dari Aktivitas Pendanaan', jumlah: arusKasPendanaan.toLocaleString('id-ID') },
        { uraian: '', jumlah: '' },
        { uraian: 'KENAIKAN (PENURUNAN) KAS', jumlah: kenaikanPenurunanKas.toLocaleString('id-ID') },
        { uraian: 'SALDO KAS AWAL', jumlah: saldoKasAwal.toLocaleString('id-ID') },
        { uraian: 'SALDO KAS AKHIR', jumlah: saldoKasAkhir.toLocaleString('id-ID') }
      ];
      exportToExcel(data, [{ header: 'Uraian', key: 'uraian', width: 50 }, { header: 'Jumlah (Rp)', key: 'jumlah', width: 20 }], 'Arus_Kas', 'Arus Kas', config, 'LAPORAN ARUS KAS');
    } else if (activeTab === 'RASIO') {
      const data = [
        { kategori: 'LIKUIDITAS', rasio: '', nilai: '' },
        { kategori: '', rasio: 'Current Ratio (Rasio Lancar)', nilai: `${rasio.likuiditas.currentRatio.toFixed(2)}%` },
        { kategori: '', rasio: 'Quick Ratio (Rasio Cepat)', nilai: `${rasio.likuiditas.quickRatio.toFixed(2)}%` },
        { kategori: '', rasio: '', nilai: '' },
        { kategori: 'SOLVABILITAS', rasio: '', nilai: '' },
        { kategori: '', rasio: 'Debt to Asset Ratio (DAR)', nilai: `${rasio.solvabilitas.debtToAssetRatio.toFixed(2)}%` },
        { kategori: '', rasio: 'Debt to Equity Ratio (DER)', nilai: `${rasio.solvabilitas.debtToEquityRatio.toFixed(2)}%` },
        { kategori: '', rasio: '', nilai: '' },
        { kategori: 'PROFITABILITAS', rasio: '', nilai: '' },
        { kategori: '', rasio: 'Net Profit Margin (NPM)', nilai: `${rasio.profitabilitas.netProfitMargin.toFixed(2)}%` },
        { kategori: '', rasio: 'Return on Assets (ROA)', nilai: `${rasio.profitabilitas.returnOnAssets.toFixed(2)}%` },
        { kategori: '', rasio: 'Return on Equity (ROE)', nilai: `${rasio.profitabilitas.returnOnEquity.toFixed(2)}%` },
      ];
      exportToExcel(data, [{ header: 'Kategori', key: 'kategori', width: 20 }, { header: 'Rasio', key: 'rasio', width: 40 }, { header: 'Nilai', key: 'nilai', width: 15 }], 'Rasio_Keuangan', 'Rasio Keuangan', config, 'ANALISIS RASIO KEUANGAN');
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'LR') {
      const data = [
        ...pendapatan.map(p => ({ uraian: p.nama, jumlah: p.jumlah.toLocaleString('id-ID') })),
        { uraian: 'Total Pendapatan', jumlah: totalPendapatan.toLocaleString('id-ID') },
        { uraian: '', jumlah: '' },
        ...hpp.map(h => ({ uraian: h.nama, jumlah: h.jumlah.toLocaleString('id-ID') })),
        { uraian: 'Total HPP', jumlah: `(${totalHpp.toLocaleString('id-ID')})` },
        { uraian: '', jumlah: '' },
        { uraian: 'LABA KOTOR', jumlah: labaKotor.toLocaleString('id-ID') },
        { uraian: '', jumlah: '' },
        ...biaya.map(b => ({ uraian: b.nama, jumlah: b.jumlah.toLocaleString('id-ID') })),
        { uraian: 'Total Biaya', jumlah: `(${totalBiaya.toLocaleString('id-ID')})` },
        { uraian: '', jumlah: '' },
        { uraian: 'SISA HASIL USAHA (SHU) BERSIH', jumlah: labaRugi.toLocaleString('id-ID') }
      ];
      exportToPDF(data, [{ header: 'Uraian', dataKey: 'uraian' }, { header: 'Jumlah (Rp)', dataKey: 'jumlah' }], 'Laba_Rugi', 'LAPORAN LABA RUGI', config);
    } else if (activeTab === 'SHU') {
      const data = [
        { uraian: 'SISA HASIL USAHA (SHU)', persentase: '', jumlah: labaRugi.toLocaleString('id-ID') },
        { uraian: '', persentase: '', jumlah: '' },
        { uraian: '1. Cadangan Modal BUMDes', persentase: `${shuConfig.cadanganModal}%`, jumlah: ((labaRugi * shuConfig.cadanganModal) / 100).toLocaleString('id-ID') },
        { uraian: '2. Jasa Anggota / PADes', persentase: `${shuConfig.jasaAnggota}%`, jumlah: ((labaRugi * shuConfig.jasaAnggota) / 100).toLocaleString('id-ID') },
        { uraian: '3. Pengembangan Usaha', persentase: `${shuConfig.pengembanganUsaha}%`, jumlah: ((labaRugi * shuConfig.pengembanganUsaha) / 100).toLocaleString('id-ID') },
        { uraian: '4. Dana Sosial', persentase: `${shuConfig.danaSosial}%`, jumlah: ((labaRugi * shuConfig.danaSosial) / 100).toLocaleString('id-ID') },
        { uraian: '5. Dana Pendidikan', persentase: `${shuConfig.danaPendidikan}%`, jumlah: ((labaRugi * shuConfig.danaPendidikan) / 100).toLocaleString('id-ID') },
        { uraian: '6. Kas BUMDes / Pengurus', persentase: `${shuConfig.kasBumdes}%`, jumlah: ((labaRugi * shuConfig.kasBumdes) / 100).toLocaleString('id-ID') },
        { uraian: '', persentase: '', jumlah: '' },
        { uraian: 'TOTAL ALOKASI (100%)', persentase: '', jumlah: labaRugi.toLocaleString('id-ID') }
      ];
      exportToPDF(data, [{ header: 'Alokasi', dataKey: 'uraian' }, { header: 'Persentase', dataKey: 'persentase' }, { header: 'Jumlah (Rp)', dataKey: 'jumlah' }], 'Pembagian_SHU', 'LAPORAN PEMBAGIAN SHU', config);
    } else if (activeTab === 'PM') {
      const data = [
        { uraian: 'Modal Awal', jumlah: modalAwal.toLocaleString('id-ID') },
        { uraian: 'Laba (Rugi) Bersih', jumlah: labaRugi.toLocaleString('id-ID') },
        { uraian: 'Prive / Pengambilan', jumlah: `(${prive.toLocaleString('id-ID')})` },
        { uraian: '', jumlah: '' },
        { uraian: 'MODAL AKHIR', jumlah: modalAkhir.toLocaleString('id-ID') }
      ];
      exportToPDF(data, [{ header: 'Uraian', dataKey: 'uraian' }, { header: 'Jumlah (Rp)', dataKey: 'jumlah' }], 'Perubahan_Modal', 'LAPORAN PERUBAHAN MODAL', config);
    } else if (activeTab === 'NERACA') {
      const data = [
        { aktiva: 'AKTIVA', jumlahAktiva: '', pasiva: 'PASIVA', jumlahPasiva: '' },
        ...Array.from({ length: Math.max(aktiva.length, hutang.length + modal.length) }).map((_, i) => ({
          aktiva: aktiva[i]?.nama || '',
          jumlahAktiva: aktiva[i]?.jumlah !== undefined ? aktiva[i].jumlah.toLocaleString('id-ID') : '',
          pasiva: i < hutang.length ? hutang[i]?.nama : modal[i - hutang.length]?.nama || '',
          jumlahPasiva: i < hutang.length 
            ? (hutang[i]?.jumlah !== undefined ? hutang[i].jumlah.toLocaleString('id-ID') : '') 
            : (modal[i - hutang.length]?.jumlah !== undefined ? modal[i - hutang.length].jumlah.toLocaleString('id-ID') : ''),
        })),
        { aktiva: '', jumlahAktiva: '', pasiva: '', jumlahPasiva: '' },
        { aktiva: 'TOTAL AKTIVA', jumlahAktiva: totalAktiva.toLocaleString('id-ID'), pasiva: 'TOTAL PASIVA', jumlahPasiva: totalPasiva.toLocaleString('id-ID') }
      ];
      exportToPDF(data, [
        { header: 'Aktiva', dataKey: 'aktiva' }, 
        { header: 'Jumlah (Rp)', dataKey: 'jumlahAktiva' },
        { header: 'Pasiva', dataKey: 'pasiva' }, 
        { header: 'Jumlah (Rp)', dataKey: 'jumlahPasiva' }
      ], 'Neraca', 'NERACA (BALANCE SHEET)', config, 'landscape');
    } else if (activeTab === 'ARUS_KAS') {
      const data = [
        { uraian: 'ARUS KAS DARI AKTIVITAS OPERASI', jumlah: '' },
        ...detailOperasi.map(d => ({ uraian: `  ${d.uraian}`, jumlah: (d.masuk > 0 ? d.masuk : -d.keluar).toLocaleString('id-ID') })),
        { uraian: 'Arus Kas Bersih dari Aktivitas Operasi', jumlah: arusKasOperasi.toLocaleString('id-ID') },
        { uraian: '', jumlah: '' },
        { uraian: 'ARUS KAS DARI AKTIVITAS INVESTASI', jumlah: '' },
        ...detailInvestasi.map(d => ({ uraian: `  ${d.uraian}`, jumlah: (d.masuk > 0 ? d.masuk : -d.keluar).toLocaleString('id-ID') })),
        { uraian: 'Arus Kas Bersih dari Aktivitas Investasi', jumlah: arusKasInvestasi.toLocaleString('id-ID') },
        { uraian: '', jumlah: '' },
        { uraian: 'ARUS KAS DARI AKTIVITAS PENDANAAN', jumlah: '' },
        ...detailPendanaan.map(d => ({ uraian: `  ${d.uraian}`, jumlah: (d.masuk > 0 ? d.masuk : -d.keluar).toLocaleString('id-ID') })),
        { uraian: 'Arus Kas Bersih dari Aktivitas Pendanaan', jumlah: arusKasPendanaan.toLocaleString('id-ID') },
        { uraian: '', jumlah: '' },
        { uraian: 'KENAIKAN (PENURUNAN) KAS', jumlah: kenaikanPenurunanKas.toLocaleString('id-ID') },
        { uraian: 'SALDO KAS AWAL', jumlah: saldoKasAwal.toLocaleString('id-ID') },
        { uraian: 'SALDO KAS AKHIR', jumlah: saldoKasAkhir.toLocaleString('id-ID') }
      ];
      exportToPDF(data, [{ header: 'Uraian', dataKey: 'uraian' }, { header: 'Jumlah (Rp)', dataKey: 'jumlah' }], 'Arus_Kas', 'LAPORAN ARUS KAS', config);
    } else if (activeTab === 'RASIO') {
      const data = [
        { kategori: 'LIKUIDITAS', rasio: '', nilai: '' },
        { kategori: '', rasio: 'Current Ratio (Rasio Lancar)', nilai: `${rasio.likuiditas.currentRatio.toFixed(2)}%` },
        { kategori: '', rasio: 'Quick Ratio (Rasio Cepat)', nilai: `${rasio.likuiditas.quickRatio.toFixed(2)}%` },
        { kategori: '', rasio: '', nilai: '' },
        { kategori: 'SOLVABILITAS', rasio: '', nilai: '' },
        { kategori: '', rasio: 'Debt to Asset Ratio (DAR)', nilai: `${rasio.solvabilitas.debtToAssetRatio.toFixed(2)}%` },
        { kategori: '', rasio: 'Debt to Equity Ratio (DER)', nilai: `${rasio.solvabilitas.debtToEquityRatio.toFixed(2)}%` },
        { kategori: '', rasio: '', nilai: '' },
        { kategori: 'PROFITABILITAS', rasio: '', nilai: '' },
        { kategori: '', rasio: 'Net Profit Margin (NPM)', nilai: `${rasio.profitabilitas.netProfitMargin.toFixed(2)}%` },
        { kategori: '', rasio: 'Return on Assets (ROA)', nilai: `${rasio.profitabilitas.returnOnAssets.toFixed(2)}%` },
        { kategori: '', rasio: 'Return on Equity (ROE)', nilai: `${rasio.profitabilitas.returnOnEquity.toFixed(2)}%` },
      ];
      exportToPDF(data, [{ header: 'Kategori', dataKey: 'kategori' }, { header: 'Rasio', dataKey: 'rasio' }, { header: 'Nilai', dataKey: 'nilai' }], 'Rasio_Keuangan', 'ANALISIS RASIO KEUANGAN', config);
    }
  };

  const renderLabaRugi = () => (
    <div className="p-8 bg-white max-w-4xl mx-auto border border-gray-200 shadow-sm rounded-xl print:shadow-none print:border-none">
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <h2 className="text-xl font-bold uppercase">{config.namaBumdes}</h2>
        <h3 className="text-lg font-semibold">LAPORAN LABA RUGI</h3>
        <p className="text-sm text-gray-600">Periode: {config.periodeBulanMulai} - {config.periodeBulanSelesai} Tahun {config.periodeTahun}</p>
      </div>

      <div className="space-y-6">
        {/* Pendapatan */}
        <div>
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">PENDAPATAN</h4>
          <table className="w-full text-sm">
            <tbody>
              {pendapatan.map(p => (
                <tr key={p.kode}>
                  <td className="py-1 pl-4 text-gray-700">{p.nama}</td>
                  <td className="py-1 text-right font-mono w-40">{p.jumlah.toLocaleString('id-ID')}</td>
                  <td className="py-1 w-40"></td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="py-2 pl-4">Total Pendapatan</td>
                <td></td>
                <td className="py-2 text-right font-mono border-t border-gray-400">{totalPendapatan.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* HPP */}
        <div>
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">HARGA POKOK PENJUALAN (HPP)</h4>
          <table className="w-full text-sm">
            <tbody>
              {hpp.map(h => (
                <tr key={h.kode}>
                  <td className="py-1 pl-4 text-gray-700">{h.nama}</td>
                  <td className="py-1 text-right font-mono w-40">{h.jumlah.toLocaleString('id-ID')}</td>
                  <td className="py-1 w-40"></td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="py-2 pl-4">Total HPP</td>
                <td></td>
                <td className="py-2 text-right font-mono border-t border-gray-400">({totalHpp.toLocaleString('id-ID')})</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Laba Kotor */}
        <div className="pt-2 border-t border-gray-400">
          <table className="w-full text-sm font-bold text-base">
            <tbody>
              <tr>
                <td className="py-2 text-gray-900">LABA KOTOR</td>
                <td className="py-2 text-right font-mono text-blue-700 w-40">
                  {labaKotor.toLocaleString('id-ID')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Biaya */}
        <div>
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">BIAYA-BIAYA</h4>
          <table className="w-full text-sm">
            <tbody>
              {biaya.map(b => (
                <tr key={b.kode}>
                  <td className="py-1 pl-4 text-gray-700">{b.nama}</td>
                  <td className="py-1 text-right font-mono w-40">{b.jumlah.toLocaleString('id-ID')}</td>
                  <td className="py-1 w-40"></td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="py-2 pl-4">Total Biaya</td>
                <td></td>
                <td className="py-2 text-right font-mono border-t border-gray-400">({totalBiaya.toLocaleString('id-ID')})</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Laba Bersih */}
        <div className="pt-4 border-t-2 border-gray-800">
          <table className="w-full text-sm font-bold text-lg">
            <tbody>
              <tr>
                <td className="py-2 text-gray-900">SISA HASIL USAHA (SHU) BERSIH</td>
                <td className="py-2 text-right font-mono text-green-700 w-40 border-b-4 border-double border-gray-800">
                  {labaRugi.toLocaleString('id-ID')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPembagianSHU = () => (
    <div className="p-8 bg-white max-w-4xl mx-auto border border-gray-200 shadow-sm rounded-xl print:shadow-none print:border-none">
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <h2 className="text-xl font-bold uppercase">{config.namaBumdes}</h2>
        <h3 className="text-lg font-semibold">LAPORAN PEMBAGIAN SHU</h3>
        <p className="text-sm text-gray-600">Periode: {config.periodeBulanMulai} - {config.periodeBulanSelesai} Tahun {config.periodeTahun}</p>
      </div>

      <div className="space-y-6">
        <table className="w-full text-sm">
          <tbody>
            <tr className="font-bold text-lg bg-gray-50">
              <td className="py-3 pl-4 border-b border-gray-300">SISA HASIL USAHA (SHU)</td>
              <td className="py-3 text-right font-mono border-b border-gray-300 w-48 text-green-700">
                {labaRugi.toLocaleString('id-ID')}
              </td>
            </tr>
            <tr><td colSpan={2} className="py-2"></td></tr>
            
            <tr className="font-semibold text-gray-800">
              <td className="py-2 border-b border-gray-300" colSpan={2}>ALOKASI PEMBAGIAN SHU:</td>
            </tr>
            <tr>
              <td className="py-2 pl-4 flex justify-between pr-8">
                <span>1. Cadangan Modal BUMDes</span>
                <span className="text-gray-500">{shuConfig.cadanganModal}%</span>
              </td>
              <td className="py-2 text-right font-mono">
                {((labaRugi * shuConfig.cadanganModal) / 100).toLocaleString('id-ID')}
              </td>
            </tr>
            <tr>
              <td className="py-2 pl-4 flex justify-between pr-8">
                <span>2. Jasa Anggota / PADes</span>
                <span className="text-gray-500">{shuConfig.jasaAnggota}%</span>
              </td>
              <td className="py-2 text-right font-mono">
                {((labaRugi * shuConfig.jasaAnggota) / 100).toLocaleString('id-ID')}
              </td>
            </tr>
            <tr>
              <td className="py-2 pl-4 flex justify-between pr-8">
                <span>3. Pengembangan Usaha</span>
                <span className="text-gray-500">{shuConfig.pengembanganUsaha}%</span>
              </td>
              <td className="py-2 text-right font-mono">
                {((labaRugi * shuConfig.pengembanganUsaha) / 100).toLocaleString('id-ID')}
              </td>
            </tr>
            <tr>
              <td className="py-2 pl-4 flex justify-between pr-8">
                <span>4. Dana Sosial</span>
                <span className="text-gray-500">{shuConfig.danaSosial}%</span>
              </td>
              <td className="py-2 text-right font-mono">
                {((labaRugi * shuConfig.danaSosial) / 100).toLocaleString('id-ID')}
              </td>
            </tr>
            <tr>
              <td className="py-2 pl-4 flex justify-between pr-8">
                <span>5. Dana Pendidikan</span>
                <span className="text-gray-500">{shuConfig.danaPendidikan}%</span>
              </td>
              <td className="py-2 text-right font-mono">
                {((labaRugi * shuConfig.danaPendidikan) / 100).toLocaleString('id-ID')}
              </td>
            </tr>
            <tr>
              <td className="py-2 pl-4 flex justify-between pr-8">
                <span>6. Kas BUMDes / Pengurus</span>
                <span className="text-gray-500">{shuConfig.kasBumdes}%</span>
              </td>
              <td className="py-2 text-right font-mono">
                {((labaRugi * shuConfig.kasBumdes) / 100).toLocaleString('id-ID')}
              </td>
            </tr>
            
            <tr className="font-bold bg-gray-50">
              <td className="py-3 pl-4 border-t-2 border-gray-800">TOTAL ALOKASI (100%)</td>
              <td className="py-3 text-right font-mono border-t-2 border-gray-800 border-b-4 border-double">
                {labaRugi.toLocaleString('id-ID')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPerubahanModal = () => (
    <div className="p-8 bg-white max-w-4xl mx-auto border border-gray-200 shadow-sm rounded-xl print:shadow-none print:border-none">
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <h2 className="text-xl font-bold uppercase">{config.namaBumdes}</h2>
        <h3 className="text-lg font-semibold">LAPORAN PERUBAHAN MODAL</h3>
        <p className="text-sm text-gray-600">Periode: {config.periodeBulanMulai} - {config.periodeBulanSelesai} Tahun {config.periodeTahun}</p>
      </div>

      <div className="space-y-6">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-2 font-semibold">Modal Awal</td>
              <td className="py-2 text-right font-mono w-48">{modalAwal.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td className="py-2 pl-4">Laba (Rugi) Bersih</td>
              <td className="py-2 text-right font-mono">{labaRugi.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td className="py-2 pl-4">Prive / Pengambilan</td>
              <td className="py-2 text-right font-mono border-b border-gray-400">({prive.toLocaleString('id-ID')})</td>
            </tr>
            <tr className="font-bold text-lg bg-gray-50">
              <td className="py-3">MODAL AKHIR</td>
              <td className="py-3 text-right font-mono border-b-4 border-double border-gray-800 text-green-700">
                {modalAkhir.toLocaleString('id-ID')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNeraca = () => (
    <div className="p-8 bg-white max-w-5xl mx-auto border border-gray-200 shadow-sm rounded-xl print:shadow-none print:border-none">
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <h2 className="text-xl font-bold uppercase">{config.namaBumdes}</h2>
        <h3 className="text-lg font-semibold">NERACA (BALANCE SHEET)</h3>
        <p className="text-sm text-gray-600">Per 31 Desember {config.periodeTahun}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* AKTIVA */}
        <div>
          <h4 className="font-bold text-gray-800 border-b-2 border-gray-800 pb-2 mb-4 text-center bg-gray-50">AKTIVA</h4>
          <table className="w-full text-sm">
            <tbody>
              {aktiva.map(a => (
                <tr key={a.kode}>
                  <td className="py-1.5 text-gray-700">{a.nama}</td>
                  <td className="py-1.5 text-right font-mono w-32">{a.jumlah.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PASIVA */}
        <div>
          <h4 className="font-bold text-gray-800 border-b-2 border-gray-800 pb-2 mb-4 text-center bg-gray-50">PASIVA</h4>
          
          <h5 className="font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1">HUTANG</h5>
          <table className="w-full text-sm mb-4">
            <tbody>
              {hutang.map(h => (
                <tr key={h.kode}>
                  <td className="py-1.5 text-gray-700">{h.nama}</td>
                  <td className="py-1.5 text-right font-mono w-32">{h.jumlah.toLocaleString('id-ID')}</td>
                </tr>
              ))}
              {hutang.length === 0 && (
                <tr><td colSpan={2} className="py-1.5 text-gray-400 italic">Tidak ada hutang</td></tr>
              )}
            </tbody>
          </table>

          <h5 className="font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1">MODAL</h5>
          <table className="w-full text-sm">
            <tbody>
              {modal.map(m => (
                <tr key={m.kode}>
                  <td className="py-1.5 text-gray-700">{m.nama}</td>
                  <td className="py-1.5 text-right font-mono w-32">{m.jumlah.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOTALS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-4 border-t-2 border-gray-800">
        <table className="w-full text-sm font-bold text-lg">
          <tbody>
            <tr>
              <td className="py-2">TOTAL AKTIVA</td>
              <td className="py-2 text-right font-mono w-40 border-b-4 border-double border-gray-800 text-green-700">
                {totalAktiva.toLocaleString('id-ID')}
              </td>
            </tr>
          </tbody>
        </table>
        <table className="w-full text-sm font-bold text-lg">
          <tbody>
            <tr>
              <td className="py-2">TOTAL PASIVA</td>
              <td className="py-2 text-right font-mono w-40 border-b-4 border-double border-gray-800 text-green-700">
                {totalPasiva.toLocaleString('id-ID')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {!isBalance && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center font-semibold print:hidden">
          ⚠️ PERHATIAN: NERACA TIDAK BALANCE! Selisih: {Math.abs(totalAktiva - totalPasiva).toLocaleString('id-ID')}
        </div>
      )}
    </div>
  );

  const renderArusKas = () => (
    <div className="p-8 bg-white max-w-4xl mx-auto border border-gray-200 shadow-sm rounded-xl print:shadow-none print:border-none">
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <h2 className="text-xl font-bold uppercase">{config.namaBumdes}</h2>
        <h3 className="text-lg font-semibold">LAPORAN ARUS KAS</h3>
        <p className="text-sm text-gray-600">Periode: {config.periodeBulanMulai} - {config.periodeBulanSelesai} Tahun {config.periodeTahun}</p>
      </div>

      <div className="space-y-6">
        {/* Aktivitas Operasi */}
        <div>
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">ARUS KAS DARI AKTIVITAS OPERASI</h4>
          <table className="w-full text-sm">
            <tbody>
              {detailOperasi.map((d, i) => (
                <tr key={i}>
                  <td className="py-1 pl-4 text-gray-700">{d.uraian}</td>
                  <td className="py-1 text-right font-mono w-40">{(d.masuk > 0 ? d.masuk : -d.keluar).toLocaleString('id-ID')}</td>
                  <td className="py-1 w-40"></td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="py-2 pl-4">Arus Kas Bersih dari Aktivitas Operasi</td>
                <td></td>
                <td className="py-2 text-right font-mono border-t border-gray-400">{arusKasOperasi.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Aktivitas Investasi */}
        <div>
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">ARUS KAS DARI AKTIVITAS INVESTASI</h4>
          <table className="w-full text-sm">
            <tbody>
              {detailInvestasi.map((d, i) => (
                <tr key={i}>
                  <td className="py-1 pl-4 text-gray-700">{d.uraian}</td>
                  <td className="py-1 text-right font-mono w-40">{(d.masuk > 0 ? d.masuk : -d.keluar).toLocaleString('id-ID')}</td>
                  <td className="py-1 w-40"></td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="py-2 pl-4">Arus Kas Bersih dari Aktivitas Investasi</td>
                <td></td>
                <td className="py-2 text-right font-mono border-t border-gray-400">{arusKasInvestasi.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Aktivitas Pendanaan */}
        <div>
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">ARUS KAS DARI AKTIVITAS PENDANAAN</h4>
          <table className="w-full text-sm">
            <tbody>
              {detailPendanaan.map((d, i) => (
                <tr key={i}>
                  <td className="py-1 pl-4 text-gray-700">{d.uraian}</td>
                  <td className="py-1 text-right font-mono w-40">{(d.masuk > 0 ? d.masuk : -d.keluar).toLocaleString('id-ID')}</td>
                  <td className="py-1 w-40"></td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="py-2 pl-4">Arus Kas Bersih dari Aktivitas Pendanaan</td>
                <td></td>
                <td className="py-2 text-right font-mono border-t border-gray-400">{arusKasPendanaan.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Kenaikan/Penurunan Kas */}
        <div className="pt-4 border-t-2 border-gray-800">
          <table className="w-full text-sm font-bold text-base">
            <tbody>
              <tr>
                <td className="py-2">KENAIKAN (PENURUNAN) KAS</td>
                <td className="py-2 text-right font-mono w-40 border-b border-gray-400">
                  {kenaikanPenurunanKas.toLocaleString('id-ID')}
                </td>
              </tr>
              <tr>
                <td className="py-2">SALDO KAS AWAL</td>
                <td className="py-2 text-right font-mono w-40 border-b border-gray-400">
                  {saldoKasAwal.toLocaleString('id-ID')}
                </td>
              </tr>
              <tr>
                <td className="py-2">SALDO KAS AKHIR</td>
                <td className="py-2 text-right font-mono w-40 border-b-4 border-double border-gray-800 text-green-700">
                  {saldoKasAkhir.toLocaleString('id-ID')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRasioKeuangan = () => (
    <div className="p-8 bg-white max-w-4xl mx-auto border border-gray-200 shadow-sm rounded-xl print:shadow-none print:border-none">
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <h2 className="text-xl font-bold uppercase">{config.namaBumdes}</h2>
        <h3 className="text-lg font-semibold">ANALISIS RASIO KEUANGAN</h3>
        <p className="text-sm text-gray-600">Periode: {config.periodeBulanMulai} - {config.periodeBulanSelesai} Tahun {config.periodeTahun}</p>
      </div>

      <div className="space-y-8">
        {/* Likuiditas */}
        <div>
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-4 text-lg">1. RASIO LIKUIDITAS</h4>
          <p className="text-sm text-gray-600 mb-2">Mengukur kemampuan BUMDes memenuhi kewajiban jangka pendek.</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="py-2 px-4 text-left font-semibold text-gray-700 w-1/2">Nama Rasio</th>
                <th className="py-2 px-4 text-right font-semibold text-gray-700">Nilai</th>
                <th className="py-2 px-4 text-left font-semibold text-gray-700">Interpretasi (Umum)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-800 font-medium">Current Ratio (Rasio Lancar)</td>
                <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">{rasio.likuiditas.currentRatio.toFixed(2)}%</td>
                <td className="py-3 px-4 text-gray-600 text-xs">
                  {rasio.likuiditas.currentRatio >= 200 ? 'Sangat Baik (Sangat Likuid)' : 
                   rasio.likuiditas.currentRatio >= 100 ? 'Baik (Likuid)' : 'Kurang Baik (Illikuid)'}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-800 font-medium">Quick Ratio (Rasio Cepat)</td>
                <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">{rasio.likuiditas.quickRatio.toFixed(2)}%</td>
                <td className="py-3 px-4 text-gray-600 text-xs">
                  {rasio.likuiditas.quickRatio >= 100 ? 'Sangat Baik' : 
                   rasio.likuiditas.quickRatio >= 50 ? 'Cukup Baik' : 'Kurang Baik'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Solvabilitas */}
        <div>
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-4 text-lg">2. RASIO SOLVABILITAS</h4>
          <p className="text-sm text-gray-600 mb-2">Mengukur sejauh mana aset BUMDes dibiayai oleh hutang.</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="py-2 px-4 text-left font-semibold text-gray-700 w-1/2">Nama Rasio</th>
                <th className="py-2 px-4 text-right font-semibold text-gray-700">Nilai</th>
                <th className="py-2 px-4 text-left font-semibold text-gray-700">Interpretasi (Umum)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-800 font-medium">Debt to Asset Ratio (DAR)</td>
                <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">{rasio.solvabilitas.debtToAssetRatio.toFixed(2)}%</td>
                <td className="py-3 px-4 text-gray-600 text-xs">
                  {rasio.solvabilitas.debtToAssetRatio <= 50 ? 'Aman (Risiko Rendah)' : 'Beresiko (Tergantung Hutang)'}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-800 font-medium">Debt to Equity Ratio (DER)</td>
                <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">{rasio.solvabilitas.debtToEquityRatio.toFixed(2)}%</td>
                <td className="py-3 px-4 text-gray-600 text-xs">
                  {rasio.solvabilitas.debtToEquityRatio <= 100 ? 'Aman (Modal > Hutang)' : 'Beresiko (Hutang > Modal)'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Profitabilitas */}
        <div>
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-4 text-lg">3. RASIO PROFITABILITAS</h4>
          <p className="text-sm text-gray-600 mb-2">Mengukur kemampuan BUMDes dalam menghasilkan laba.</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="py-2 px-4 text-left font-semibold text-gray-700 w-1/2">Nama Rasio</th>
                <th className="py-2 px-4 text-right font-semibold text-gray-700">Nilai</th>
                <th className="py-2 px-4 text-left font-semibold text-gray-700">Interpretasi (Umum)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-800 font-medium">Net Profit Margin (NPM)</td>
                <td className="py-3 px-4 text-right font-mono text-green-700 font-bold">{rasio.profitabilitas.netProfitMargin.toFixed(2)}%</td>
                <td className="py-3 px-4 text-gray-600 text-xs">
                  {rasio.profitabilitas.netProfitMargin >= 10 ? 'Sangat Baik' : 
                   rasio.profitabilitas.netProfitMargin > 0 ? 'Positif (Untung)' : 'Negatif (Rugi)'}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-800 font-medium">Return on Assets (ROA)</td>
                <td className="py-3 px-4 text-right font-mono text-green-700 font-bold">{rasio.profitabilitas.returnOnAssets.toFixed(2)}%</td>
                <td className="py-3 px-4 text-gray-600 text-xs">
                  Efisiensi penggunaan aset untuk laba.
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-800 font-medium">Return on Equity (ROE)</td>
                <td className="py-3 px-4 text-right font-mono text-green-700 font-bold">{rasio.profitabilitas.returnOnEquity.toFixed(2)}%</td>
                <td className="py-3 px-4 text-gray-600 text-xs">
                  Tingkat pengembalian atas modal.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Printer size={16} /> Cetak Laporan
          </button>
          <button 
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Download size={16} /> Export Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden print:hidden">
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'LR' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('LR')}
        >
          Laba Rugi
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'SHU' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('SHU')}
        >
          Pembagian SHU
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'PM' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('PM')}
        >
          Perubahan Modal
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'NERACA' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('NERACA')}
        >
          Neraca
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ARUS_KAS' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('ARUS_KAS')}
        >
          Arus Kas
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'RASIO' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('RASIO')}
        >
          Rasio Keuangan
        </button>
      </div>

      {/* Content */}
      <div className="print:block">
        <div className={`print:block ${activeTab === 'LR' ? 'block' : 'hidden print:hidden'}`}>
          {renderLabaRugi()}
        </div>
        <div className={`print:block ${activeTab === 'SHU' ? 'block' : 'hidden print:hidden'}`}>
          {renderPembagianSHU()}
        </div>
        <div className={`print:block ${activeTab === 'PM' ? 'block' : 'hidden print:hidden'}`}>
          {renderPerubahanModal()}
        </div>
        <div className={`print:block ${activeTab === 'NERACA' ? 'block' : 'hidden print:hidden'}`}>
          {renderNeraca()}
        </div>
        <div className={`print:block ${activeTab === 'ARUS_KAS' ? 'block' : 'hidden print:hidden'}`}>
          {renderArusKas()}
        </div>
        <div className={`print:block ${activeTab === 'RASIO' ? 'block' : 'hidden print:hidden'}`}>
          {renderRasioKeuangan()}
        </div>
      </div>
    </div>
  );
}
