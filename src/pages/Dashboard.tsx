import React from 'react';
import { useStore } from '../store';
import { formatCurrency, formatDate } from '../utils/format';
import { calculateJurnal, calculateBukuBesar, calculateLabaRugi, calculateNeraca, calculateArusKas, calculateRasioKeuangan } from '../utils/accounting';
import { exportConsolidatedExcel } from '../utils/export';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, 
  PieChart as PieChartIcon, BarChart as BarChartIcon,
  Download, Bell, Calendar
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const { config, akun, saldoAwal, transaksiKas, jurnalMemorial, shuConfig, piutang, hutang } = useStore();

  const { jum, juk, jm } = calculateJurnal(transaksiKas, jurnalMemorial);
  const mutasiBukuBesar = calculateBukuBesar(akun, saldoAwal, transaksiKas, jurnalMemorial);
  const { pendapatan, hpp, biaya, totalPendapatan, totalHpp, labaKotor, totalBiaya, labaRugi } = calculateLabaRugi(akun, mutasiBukuBesar);
  const { aktiva, hutang: neracaHutang, modal, totalAktiva, totalPasiva } = calculateNeraca(akun, mutasiBukuBesar, labaRugi);
  const { detailOperasi, detailInvestasi, detailPendanaan, arusKasOperasi, arusKasInvestasi, arusKasPendanaan, kenaikanPenurunanKas } = calculateArusKas(akun, transaksiKas);
  const rasio = calculateRasioKeuangan(aktiva, neracaHutang, modal, totalAktiva, totalPasiva, labaRugi, totalPendapatan);

  // Calculate Jatuh Tempo
  const getJatuhTempo = (items: any[], type: 'Piutang' | 'Hutang') => {
    return items.map(item => {
      const angsuranKe = item.angsuran.length + 1;
      if (angsuranKe > item.jangkaWaktu) return null; // Lunas

      const tglAkad = new Date(item.tanggalAkad);
      const tglJatuhTempo = new Date(tglAkad.getFullYear(), tglAkad.getMonth() + angsuranKe, tglAkad.getDate());
      
      const angsuranPerBulan = (item.jumlahPinjaman / item.jangkaWaktu) + (item.jumlahPinjaman * (item.bungaPersen/100));

      return {
        id: item.id,
        nama: type === 'Piutang' ? item.nama : item.namaKreditur,
        type,
        jatuhTempo: tglJatuhTempo,
        jumlah: angsuranPerBulan,
        angsuranKe,
        jangkaWaktu: item.jangkaWaktu
      };
    }).filter(Boolean);
  };

  const semuaJatuhTempo = [...getJatuhTempo(piutang, 'Piutang'), ...getJatuhTempo(hutang, 'Hutang')]
    .sort((a, b) => a!.jatuhTempo.getTime() - b!.jatuhTempo.getTime())
    .slice(0, 5); // Ambil 5 terdekat

  const handleExportSemua = () => {
    const modalAwal = saldoAwal.filter(s => akun.find(a => a.kode === s.kodeAkun)?.kategori === 'MODAL')
                               .reduce((sum, s) => sum + (s.kredit || 0) - (s.debet || 0), 0);
    const prive = 0;
    const modalAkhir = modalAwal + labaRugi - prive;
    
    const saldoKasAwal = saldoAwal.filter(s => s.kodeAkun === '11' || s.kodeAkun === '12')
                                  .reduce((sum, s) => sum + (s.debet || 0) - (s.kredit || 0), 0);
    const saldoKasAkhir = saldoKasAwal + kenaikanPenurunanKas;

    const sheets = [
      {
        sheetName: 'Laba Rugi',
        title: 'LAPORAN LABA RUGI',
        columns: [{ header: 'Uraian', key: 'uraian', width: 40 }, { header: 'Jumlah (Rp)', key: 'jumlah', width: 20 }],
        data: [
          ...pendapatan.map(p => ({ uraian: p.nama, jumlah: p.jumlah })),
          { uraian: 'Total Pendapatan', jumlah: totalPendapatan },
          { uraian: '', jumlah: '' },
          ...hpp.map(h => ({ uraian: h.nama, jumlah: h.jumlah })),
          { uraian: 'Total HPP', jumlah: -totalHpp },
          { uraian: '', jumlah: '' },
          { uraian: 'LABA KOTOR', jumlah: labaKotor },
          { uraian: '', jumlah: '' },
          ...biaya.map(b => ({ uraian: b.nama, jumlah: b.jumlah })),
          { uraian: 'Total Biaya', jumlah: -totalBiaya },
          { uraian: '', jumlah: '' },
          { uraian: 'SISA HASIL USAHA (SHU) BERSIH', jumlah: labaRugi }
        ]
      },
      {
        sheetName: 'Pembagian SHU',
        title: 'LAPORAN PEMBAGIAN SHU',
        columns: [{ header: 'Alokasi', key: 'uraian', width: 40 }, { header: 'Persentase', key: 'persentase', width: 15 }, { header: 'Jumlah (Rp)', key: 'jumlah', width: 20 }],
        data: [
          { uraian: 'SISA HASIL USAHA (SHU)', persentase: '', jumlah: labaRugi },
          { uraian: '', persentase: '', jumlah: '' },
          { uraian: '1. Cadangan Modal BUMDes', persentase: `${shuConfig.cadanganModal}%`, jumlah: (labaRugi * shuConfig.cadanganModal) / 100 },
          { uraian: '2. Jasa Anggota / PADes', persentase: `${shuConfig.jasaAnggota}%`, jumlah: (labaRugi * shuConfig.jasaAnggota) / 100 },
          { uraian: '3. Pengembangan Usaha', persentase: `${shuConfig.pengembanganUsaha}%`, jumlah: (labaRugi * shuConfig.pengembanganUsaha) / 100 },
          { uraian: '4. Dana Sosial', persentase: `${shuConfig.danaSosial}%`, jumlah: (labaRugi * shuConfig.danaSosial) / 100 },
          { uraian: '5. Dana Pendidikan', persentase: `${shuConfig.danaPendidikan}%`, jumlah: (labaRugi * shuConfig.danaPendidikan) / 100 },
          { uraian: '6. Kas BUMDes / Pengurus', persentase: `${shuConfig.kasBumdes}%`, jumlah: (labaRugi * shuConfig.kasBumdes) / 100 },
          { uraian: '', persentase: '', jumlah: '' },
          { uraian: 'TOTAL ALOKASI (100%)', persentase: '', jumlah: labaRugi }
        ]
      },
      {
        sheetName: 'Perubahan Modal',
        title: 'LAPORAN PERUBAHAN MODAL',
        columns: [{ header: 'Uraian', key: 'uraian', width: 40 }, { header: 'Jumlah (Rp)', key: 'jumlah', width: 20 }],
        data: [
          { uraian: 'Modal Awal', jumlah: modalAwal },
          { uraian: 'Laba (Rugi) Bersih', jumlah: labaRugi },
          { uraian: 'Prive / Pengambilan', jumlah: -prive },
          { uraian: '', jumlah: '' },
          { uraian: 'MODAL AKHIR', jumlah: modalAkhir }
        ]
      },
      {
        sheetName: 'Neraca',
        title: 'NERACA (BALANCE SHEET)',
        columns: [
          { header: 'Aktiva', key: 'aktiva', width: 30 }, 
          { header: 'Jumlah (Rp)', key: 'jumlahAktiva', width: 20 },
          { header: 'Pasiva', key: 'pasiva', width: 30 }, 
          { header: 'Jumlah (Rp)', key: 'jumlahPasiva', width: 20 }
        ],
        data: [
          { aktiva: 'AKTIVA', jumlahAktiva: '', pasiva: 'PASIVA', jumlahPasiva: '' },
          ...Array.from({ length: Math.max(aktiva.length, neracaHutang.length + modal.length) }).map((_, i) => ({
            aktiva: aktiva[i]?.nama || '',
            jumlahAktiva: aktiva[i]?.jumlah ?? '',
            pasiva: i < neracaHutang.length ? neracaHutang[i]?.nama : modal[i - neracaHutang.length]?.nama || '',
            jumlahPasiva: i < neracaHutang.length ? neracaHutang[i]?.jumlah : modal[i - neracaHutang.length]?.jumlah ?? '',
          })),
          { aktiva: '', jumlahAktiva: '', pasiva: '', jumlahPasiva: '' },
          { aktiva: 'TOTAL AKTIVA', jumlahAktiva: totalAktiva, pasiva: 'TOTAL PASIVA', jumlahPasiva: totalPasiva }
        ]
      },
      {
        sheetName: 'Arus Kas',
        title: 'LAPORAN ARUS KAS',
        columns: [{ header: 'Uraian', key: 'uraian', width: 50 }, { header: 'Jumlah (Rp)', key: 'jumlah', width: 20 }],
        data: [
          { uraian: 'ARUS KAS DARI AKTIVITAS OPERASI', jumlah: '' },
          ...detailOperasi.map(d => ({ uraian: `  ${d.uraian}`, jumlah: d.masuk > 0 ? d.masuk : -d.keluar })),
          { uraian: 'Arus Kas Bersih dari Aktivitas Operasi', jumlah: arusKasOperasi },
          { uraian: '', jumlah: '' },
          { uraian: 'ARUS KAS DARI AKTIVITAS INVESTASI', jumlah: '' },
          ...detailInvestasi.map(d => ({ uraian: `  ${d.uraian}`, jumlah: d.masuk > 0 ? d.masuk : -d.keluar })),
          { uraian: 'Arus Kas Bersih dari Aktivitas Investasi', jumlah: arusKasInvestasi },
          { uraian: '', jumlah: '' },
          { uraian: 'ARUS KAS DARI AKTIVITAS PENDANAAN', jumlah: '' },
          ...detailPendanaan.map(d => ({ uraian: `  ${d.uraian}`, jumlah: d.masuk > 0 ? d.masuk : -d.keluar })),
          { uraian: 'Arus Kas Bersih dari Aktivitas Pendanaan', jumlah: arusKasPendanaan },
          { uraian: '', jumlah: '' },
          { uraian: 'KENAIKAN (PENURUNAN) KAS', jumlah: kenaikanPenurunanKas },
          { uraian: 'SALDO KAS AWAL', jumlah: saldoKasAwal },
          { uraian: 'SALDO KAS AKHIR', jumlah: saldoKasAkhir }
        ]
      },
      {
        sheetName: 'Rasio Keuangan',
        title: 'ANALISIS RASIO KEUANGAN',
        columns: [{ header: 'Kategori', key: 'kategori', width: 20 }, { header: 'Rasio', key: 'rasio', width: 40 }, { header: 'Nilai', key: 'nilai', width: 15 }],
        data: [
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
        ]
      }
    ];

    exportConsolidatedExcel(sheets, 'Laporan_Keuangan_Konsolidasi', config);
  };

  // Data for charts
  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
    datasets: [
      {
        label: 'Pendapatan',
        data: Array(12).fill(0).map((_, i) => {
          // Calculate monthly revenue
          return transaksiKas
            .filter(t => new Date(t.tanggal).getMonth() === i && akun.find(a => a.kode === t.kodeAkun)?.kategori === 'PENDAPATAN')
            .reduce((sum, t) => sum + t.masuk, 0);
        }),
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // green-500
      },
      {
        label: 'Biaya',
        data: Array(12).fill(0).map((_, i) => {
          // Calculate monthly expenses
          return transaksiKas
            .filter(t => new Date(t.tanggal).getMonth() === i && akun.find(a => a.kode === t.kodeAkun)?.kategori === 'BIAYA')
            .reduce((sum, t) => sum + t.keluar, 0);
        }),
        backgroundColor: 'rgba(239, 68, 68, 0.8)', // red-500
      },
    ],
  };

  const pieChartData = {
    labels: ['Kas', 'Bank', 'Piutang', 'Persediaan', 'Aset Tetap'],
    datasets: [
      {
        data: [
          (mutasiBukuBesar['11']?.akhirD || 0) - (mutasiBukuBesar['11']?.akhirK || 0),
          (mutasiBukuBesar['12']?.akhirD || 0) - (mutasiBukuBesar['12']?.akhirK || 0),
          (mutasiBukuBesar['13']?.akhirD || 0) - (mutasiBukuBesar['13']?.akhirK || 0),
          ((mutasiBukuBesar['14']?.akhirD || 0) - (mutasiBukuBesar['14']?.akhirK || 0)) + ((mutasiBukuBesar['15']?.akhirD || 0) - (mutasiBukuBesar['15']?.akhirK || 0)),
          (mutasiBukuBesar['16']?.akhirD || 0) - (mutasiBukuBesar['16']?.akhirK || 0),
        ],
        backgroundColor: [
          '#16a34a', // green-600
          '#3b82f6', // blue-500
          '#f59e0b', // amber-500
          '#8b5cf6', // violet-500
          '#ec4899', // pink-500
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button 
          onClick={handleExportSemua}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Download size={16} />
          Export Semua Laporan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Aset</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono">
            {formatCurrency(totalAktiva)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Pendapatan</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono">
            {formatCurrency(totalPendapatan)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Biaya</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono">
            {formatCurrency(totalBiaya)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-gray-500">SHU Berjalan</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
          <p className={`text-2xl font-bold font-mono ${labaRugi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(labaRugi)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChartIcon size={20} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800">Pendapatan vs Biaya</h3>
          </div>
          <div className="h-72">
            <Bar 
              data={barChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
              }} 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={20} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800">Komposisi Aset</h3>
          </div>
          <div className="h-72 flex items-center justify-center">
            <Pie 
              data={pieChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Jatuh Tempo & About App */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jatuh Tempo Reminders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-800">Pengingat Jatuh Tempo</h3>
            </div>
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              {semuaJatuhTempo.length} Tagihan Terdekat
            </span>
          </div>
          
          {semuaJatuhTempo.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Tidak ada tagihan yang mendekati jatuh tempo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {semuaJatuhTempo.map((item, idx) => {
                const isLate = item.jatuhTempo < new Date();
                const isPiutang = item.type === 'Piutang';
                return (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${isLate ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${isPiutang ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                      <div>
                        <p className="font-medium text-gray-800">{item.nama}</p>
                        <p className="text-xs text-gray-500">
                          {isPiutang ? 'Piutang' : 'Hutang'} • Angsuran {item.angsuranKe}/{item.jangkaWaktu}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-gray-900">{formatCurrency(item.jumlah)}</p>
                      <p className={`text-xs font-medium ${isLate ? 'text-red-600' : 'text-gray-500'}`}>
                        {isLate ? 'Terlewat: ' : 'Jatuh tempo: '} 
                        {formatDate(item.jatuhTempo.toISOString().split('T')[0])}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* About App Card */}
        <div className="bg-gray-900 text-white rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-500 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
            
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 relative z-10">
              <span className="text-green-400">🌿</span> Sistem Akuntansi BUMDes v1.0
            </h3>
            <p className="text-gray-300 text-sm mb-4 relative z-10">
              Aplikasi akuntansi digital untuk Badan Usaha Milik Desa (BUMDes). 
              Dirancang untuk memudahkan pencatatan keuangan secara otomatis dan akurat.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-800 text-xs text-gray-400 relative z-10">
            <p>Dikembangkan oleh: <span className="text-white font-medium">Imam Sahroni Darmawan</span></p>
            <p className="mt-1">Hak cipta dilindungi. Tidak untuk diperjualbelikan.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
