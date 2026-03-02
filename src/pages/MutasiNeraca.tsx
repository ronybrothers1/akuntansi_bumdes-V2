import React from 'react';
import { useStore } from '../store';
import { calculateBukuBesar } from '../utils/accounting';
import { exportToExcel, exportToPDF } from '../utils/export';
import { Download, CheckCircle, XCircle, FileText } from 'lucide-react';

export default function MutasiNeraca() {
  const { akun, saldoAwal, transaksiKas, jurnalMemorial, config } = useStore();
  
  const mutasiBukuBesar = calculateBukuBesar(akun, saldoAwal, transaksiKas, jurnalMemorial);

  let sumAwalD = 0;
  let sumAwalK = 0;
  let sumMutasiD = 0;
  let sumMutasiK = 0;
  let sumAkhirD = 0;
  let sumAkhirK = 0;

  const handleExportExcel = () => {
    const data = akun.map(a => {
      const m = mutasiBukuBesar[a.kode];
      if (!m) return null;
      if (m.awalD === 0 && m.awalK === 0 && m.mutasiD === 0 && m.mutasiK === 0 && m.akhirD === 0 && m.akhirK === 0) return null;
      return {
        kode: a.kode,
        nama: a.nama,
        awalD: m.awalD,
        awalK: m.awalK,
        mutasiD: m.mutasiD,
        mutasiK: m.mutasiK,
        akhirD: m.akhirD,
        akhirK: m.akhirK
      };
    }).filter(Boolean);

    exportToExcel(data, [
      { header: 'Kode', key: 'kode', width: 10 },
      { header: 'Nama Akun', key: 'nama', width: 30 },
      { header: 'Awal Debet', key: 'awalD', width: 15 },
      { header: 'Awal Kredit', key: 'awalK', width: 15 },
      { header: 'Mutasi Debet', key: 'mutasiD', width: 15 },
      { header: 'Mutasi Kredit', key: 'mutasiK', width: 15 },
      { header: 'Akhir Debet', key: 'akhirD', width: 15 },
      { header: 'Akhir Kredit', key: 'akhirK', width: 15 }
    ], 'Mutasi_Neraca', 'Mutasi Neraca', config, 'MUTASI NERACA / NERACA LAJUR');
  };

  const handleExportPDF = () => {
    const data = akun.map(a => {
      const m = mutasiBukuBesar[a.kode];
      if (!m) return null;
      if (m.awalD === 0 && m.awalK === 0 && m.mutasiD === 0 && m.mutasiK === 0 && m.akhirD === 0 && m.akhirK === 0) return null;
      return {
        kode: a.kode,
        nama: a.nama,
        awalD: m.awalD > 0 ? m.awalD.toLocaleString('id-ID') : '-',
        awalK: m.awalK > 0 ? m.awalK.toLocaleString('id-ID') : '-',
        mutasiD: m.mutasiD > 0 ? m.mutasiD.toLocaleString('id-ID') : '-',
        mutasiK: m.mutasiK > 0 ? m.mutasiK.toLocaleString('id-ID') : '-',
        akhirD: m.akhirD > 0 ? m.akhirD.toLocaleString('id-ID') : '-',
        akhirK: m.akhirK > 0 ? m.akhirK.toLocaleString('id-ID') : '-'
      };
    }).filter(Boolean);

    exportToPDF(data, [
      { header: 'Kode', dataKey: 'kode' },
      { header: 'Nama Akun', dataKey: 'nama' },
      { header: 'Awal D', dataKey: 'awalD' },
      { header: 'Awal K', dataKey: 'awalK' },
      { header: 'Mutasi D', dataKey: 'mutasiD' },
      { header: 'Mutasi K', dataKey: 'mutasiK' },
      { header: 'Akhir D', dataKey: 'akhirD' },
      { header: 'Akhir K', dataKey: 'akhirK' }
    ], 'Mutasi_Neraca', 'MUTASI NERACA / NERACA LAJUR', config, 'landscape');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Mutasi Neraca / Neraca Lajur</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportExcel}
            className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Download size={16} /> Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-800 text-white text-sm">
                <th className="p-3 font-semibold border-r border-gray-700 w-20 text-center" rowSpan={2}>Kode</th>
                <th className="p-3 font-semibold border-r border-gray-700 min-w-[200px]" rowSpan={2}>Nama Akun</th>
                <th className="p-3 font-semibold border-r border-gray-700 text-center" colSpan={2}>Saldo Awal</th>
                <th className="p-3 font-semibold border-r border-gray-700 text-center" colSpan={2}>Mutasi</th>
                <th className="p-3 font-semibold border-r border-gray-700 text-center" colSpan={2}>Saldo Akhir</th>
              </tr>
              <tr className="bg-gray-700 text-white text-sm">
                <th className="p-2 font-semibold border-r border-gray-600 text-right w-32">Debet</th>
                <th className="p-2 font-semibold border-r border-gray-600 text-right w-32">Kredit</th>
                <th className="p-2 font-semibold border-r border-gray-600 text-right w-32">Debet</th>
                <th className="p-2 font-semibold border-r border-gray-600 text-right w-32">Kredit</th>
                <th className="p-2 font-semibold border-r border-gray-600 text-right w-32">Debet</th>
                <th className="p-2 font-semibold border-r border-gray-600 text-right w-32">Kredit</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {akun.map((a) => {
                const m = mutasiBukuBesar[a.kode];
                if (!m) return null;

                sumAwalD += m.awalD;
                sumAwalK += m.awalK;
                sumMutasiD += m.mutasiD;
                sumMutasiK += m.mutasiK;
                sumAkhirD += m.akhirD;
                sumAkhirK += m.akhirK;

                // Only show rows that have some value
                if (m.awalD === 0 && m.awalK === 0 && m.mutasiD === 0 && m.mutasiK === 0 && m.akhirD === 0 && m.akhirK === 0) {
                  return null;
                }

                return (
                  <tr key={a.kode} className="border-b hover:bg-gray-50 even:bg-gray-50/50">
                    <td className="p-3 font-mono text-gray-500 text-center">{a.kode}</td>
                    <td className="p-3 font-medium text-gray-800">{a.nama}</td>
                    
                    <td className="p-3 text-right font-mono text-gray-600">{m.awalD > 0 ? m.awalD.toLocaleString('id-ID') : '-'}</td>
                    <td className="p-3 text-right font-mono text-gray-600 border-r border-gray-100">{m.awalK > 0 ? m.awalK.toLocaleString('id-ID') : '-'}</td>
                    
                    <td className="p-3 text-right font-mono text-blue-600">{m.mutasiD > 0 ? m.mutasiD.toLocaleString('id-ID') : '-'}</td>
                    <td className="p-3 text-right font-mono text-blue-600 border-r border-gray-100">{m.mutasiK > 0 ? m.mutasiK.toLocaleString('id-ID') : '-'}</td>
                    
                    <td className="p-3 text-right font-mono font-medium text-green-600">{m.akhirD > 0 ? m.akhirD.toLocaleString('id-ID') : '-'}</td>
                    <td className="p-3 text-right font-mono font-medium text-green-600">{m.akhirK > 0 ? m.akhirK.toLocaleString('id-ID') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 font-bold text-sm border-t-2 border-gray-300">
              <tr>
                <td colSpan={2} className="p-3 text-right text-gray-700">TOTAL:</td>
                
                <td className="p-3 text-right font-mono text-gray-900">{sumAwalD.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-mono text-gray-900 border-r border-gray-200">{sumAwalK.toLocaleString('id-ID')}</td>
                
                <td className="p-3 text-right font-mono text-blue-700">{sumMutasiD.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-mono text-blue-700 border-r border-gray-200">{sumMutasiK.toLocaleString('id-ID')}</td>
                
                <td className="p-3 text-right font-mono text-green-700">{sumAkhirD.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-mono text-green-700">{sumAkhirK.toLocaleString('id-ID')}</td>
              </tr>
              <tr className="bg-white">
                <td colSpan={2} className="p-3 text-right text-gray-500 font-normal">Status Balance:</td>
                
                <td colSpan={2} className="p-3 text-center border-r border-gray-200">
                  {sumAwalD === sumAwalK ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full"><CheckCircle size={14} /> BALANCE</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs bg-red-50 px-2 py-1 rounded-full"><XCircle size={14} /> TIDAK BALANCE</span>
                  )}
                </td>
                
                <td colSpan={2} className="p-3 text-center border-r border-gray-200">
                  {sumMutasiD === sumMutasiK ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full"><CheckCircle size={14} /> BALANCE</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs bg-red-50 px-2 py-1 rounded-full"><XCircle size={14} /> TIDAK BALANCE</span>
                  )}
                </td>
                
                <td colSpan={2} className="p-3 text-center">
                  {sumAkhirD === sumAkhirK ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full"><CheckCircle size={14} /> BALANCE</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs bg-red-50 px-2 py-1 rounded-full"><XCircle size={14} /> TIDAK BALANCE</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
