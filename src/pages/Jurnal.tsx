import React, { useState } from 'react';
import { useStore } from '../store';
import { calculateJurnal } from '../utils/accounting';
import { formatDate } from '../utils/format';
import { exportToExcel, exportToPDF } from '../utils/export';
import { FileText, Download, CheckCircle, XCircle } from 'lucide-react';

export default function Jurnal() {
  const { transaksiKas, jurnalMemorial, akun, config } = useStore();
  const [activeTab, setActiveTab] = useState<'JUM' | 'JUK' | 'JM'>('JUM');

  const { jum, juk, jm } = calculateJurnal(transaksiKas, jurnalMemorial);

  const handleExportExcel = () => {
    if (activeTab === 'JUM') {
      const data = jum.flatMap(t => {
        const namaAkunDebet = akun.find(a => a.kode === t.akunDebet)?.nama || '';
        const namaAkunKredit = akun.find(a => a.kode === t.akunKredit)?.nama || '';
        return [
          { tanggal: formatDate(t.tanggal), noBukti: t.noBukti, keterangan: namaAkunDebet, ref: t.akunDebet, debet: t.debet, kredit: 0 },
          { tanggal: '', noBukti: '', keterangan: `(${t.uraian}) ${namaAkunKredit}`, ref: t.akunKredit, debet: 0, kredit: t.debet }
        ];
      });
      exportToExcel(data, [
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'No Bukti', key: 'noBukti', width: 15 },
        { header: 'Keterangan', key: 'keterangan', width: 40 },
        { header: 'Ref', key: 'ref', width: 10 },
        { header: 'Debet (Rp)', key: 'debet', width: 15 },
        { header: 'Kredit (Rp)', key: 'kredit', width: 15 }
      ], 'Jurnal_Penerimaan_Kas', 'JUM', config, 'JURNAL PENERIMAAN KAS');
    } else if (activeTab === 'JUK') {
      const data = juk.flatMap(t => {
        const namaAkunDebet = akun.find(a => a.kode === t.akunDebet)?.nama || '';
        const namaAkunKredit = akun.find(a => a.kode === t.akunKredit)?.nama || '';
        return [
          { tanggal: formatDate(t.tanggal), noBukti: t.noBukti, keterangan: `${namaAkunDebet} (${t.uraian})`, ref: t.akunDebet, debet: t.debet, kredit: 0 },
          { tanggal: '', noBukti: '', keterangan: namaAkunKredit, ref: t.akunKredit, debet: 0, kredit: t.debet }
        ];
      });
      exportToExcel(data, [
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'No Bukti', key: 'noBukti', width: 15 },
        { header: 'Keterangan', key: 'keterangan', width: 40 },
        { header: 'Ref', key: 'ref', width: 10 },
        { header: 'Debet (Rp)', key: 'debet', width: 15 },
        { header: 'Kredit (Rp)', key: 'kredit', width: 15 }
      ], 'Jurnal_Pengeluaran_Kas', 'JUK', config, 'JURNAL PENGELUARAN KAS');
    } else if (activeTab === 'JM') {
      const data = jm.flatMap(j => 
        j.detail.map((d, idx) => {
          const namaAkun = akun.find(a => a.kode === d.kodeAkun)?.nama || '';
          return {
            tanggal: idx === 0 ? formatDate(j.tanggal) : '',
            noBukti: idx === 0 ? j.noBukti : '',
            keterangan: idx === 0 ? `${namaAkun} (${j.uraian})` : namaAkun,
            ref: d.kodeAkun,
            debet: d.debet || 0,
            kredit: d.kredit || 0
          };
        })
      );
      exportToExcel(data, [
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'No Bukti', key: 'noBukti', width: 15 },
        { header: 'Keterangan', key: 'keterangan', width: 40 },
        { header: 'Ref', key: 'ref', width: 10 },
        { header: 'Debet (Rp)', key: 'debet', width: 15 },
        { header: 'Kredit (Rp)', key: 'kredit', width: 15 }
      ], 'Jurnal_Memorial', 'JM', config, 'JURNAL MEMORIAL');
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'JUM') {
      const data = jum.flatMap(t => {
        const namaAkunDebet = akun.find(a => a.kode === t.akunDebet)?.nama || '';
        const namaAkunKredit = akun.find(a => a.kode === t.akunKredit)?.nama || '';
        return [
          { tanggal: formatDate(t.tanggal), noBukti: t.noBukti, keterangan: namaAkunDebet, ref: t.akunDebet, debet: t.debet.toLocaleString('id-ID'), kredit: '-' },
          { tanggal: '', noBukti: '', keterangan: `(${t.uraian}) ${namaAkunKredit}`, ref: t.akunKredit, debet: '-', kredit: t.debet.toLocaleString('id-ID') }
        ];
      });
      exportToPDF(data, [
        { header: 'Tanggal', dataKey: 'tanggal' },
        { header: 'No Bukti', dataKey: 'noBukti' },
        { header: 'Keterangan', dataKey: 'keterangan' },
        { header: 'Ref', dataKey: 'ref' },
        { header: 'Debet (Rp)', dataKey: 'debet' },
        { header: 'Kredit (Rp)', dataKey: 'kredit' }
      ], 'Jurnal_Penerimaan_Kas', 'JURNAL PENERIMAAN KAS', config, 'landscape');
    } else if (activeTab === 'JUK') {
      const data = juk.flatMap(t => {
        const namaAkunDebet = akun.find(a => a.kode === t.akunDebet)?.nama || '';
        const namaAkunKredit = akun.find(a => a.kode === t.akunKredit)?.nama || '';
        return [
          { tanggal: formatDate(t.tanggal), noBukti: t.noBukti, keterangan: `${namaAkunDebet} (${t.uraian})`, ref: t.akunDebet, debet: t.debet.toLocaleString('id-ID'), kredit: '-' },
          { tanggal: '', noBukti: '', keterangan: namaAkunKredit, ref: t.akunKredit, debet: '-', kredit: t.debet.toLocaleString('id-ID') }
        ];
      });
      exportToPDF(data, [
        { header: 'Tanggal', dataKey: 'tanggal' },
        { header: 'No Bukti', dataKey: 'noBukti' },
        { header: 'Keterangan', dataKey: 'keterangan' },
        { header: 'Ref', dataKey: 'ref' },
        { header: 'Debet (Rp)', dataKey: 'debet' },
        { header: 'Kredit (Rp)', dataKey: 'kredit' }
      ], 'Jurnal_Pengeluaran_Kas', 'JURNAL PENGELUARAN KAS', config, 'landscape');
    } else if (activeTab === 'JM') {
      const data = jm.flatMap(j => 
        j.detail.map((d, idx) => {
          const namaAkun = akun.find(a => a.kode === d.kodeAkun)?.nama || '';
          return {
            tanggal: idx === 0 ? formatDate(j.tanggal) : '',
            noBukti: idx === 0 ? j.noBukti : '',
            keterangan: idx === 0 ? `${namaAkun} (${j.uraian})` : namaAkun,
            ref: d.kodeAkun,
            debet: d.debet > 0 ? d.debet.toLocaleString('id-ID') : '-',
            kredit: d.kredit > 0 ? d.kredit.toLocaleString('id-ID') : '-'
          };
        })
      );
      exportToPDF(data, [
        { header: 'Tanggal', dataKey: 'tanggal' },
        { header: 'No Bukti', dataKey: 'noBukti' },
        { header: 'Keterangan', dataKey: 'keterangan' },
        { header: 'Ref', dataKey: 'ref' },
        { header: 'Debet (Rp)', dataKey: 'debet' },
        { header: 'Kredit (Rp)', dataKey: 'kredit' }
      ], 'Jurnal_Memorial', 'JURNAL MEMORIAL', config, 'landscape');
    }
  };

  const renderJurnalMasuk = () => {
    let totalDebet = 0;
    let totalKredit = 0;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-green-600 text-white text-sm">
              <th className="p-3 font-semibold border-r border-green-500 w-24">Tanggal</th>
              <th className="p-3 font-semibold border-r border-green-500 w-32">No Bukti</th>
              <th className="p-3 font-semibold border-r border-green-500">Keterangan</th>
              <th className="p-3 font-semibold border-r border-green-500 w-24 text-center">Ref</th>
              <th className="p-3 font-semibold border-r border-green-500 w-40 text-right">Debet (Rp)</th>
              <th className="p-3 font-semibold w-40 text-right">Kredit (Rp)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {jum.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Tidak ada data Jurnal Penerimaan Kas.</td></tr>
            )}
            {jum.map((t, i) => {
              totalDebet += t.debet;
              totalKredit += t.debet; // Karena double entry
              const namaAkunDebet = akun.find(a => a.kode === t.akunDebet)?.nama;
              const namaAkunKredit = akun.find(a => a.kode === t.akunKredit)?.nama;

              return (
                <React.Fragment key={t.id}>
                  {/* Baris Debet (Kas) */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 align-top" rowSpan={2}>{formatDate(t.tanggal)}</td>
                    <td className="p-3 font-mono text-gray-600 align-top" rowSpan={2}>{t.noBukti}</td>
                    <td className="p-3 font-medium text-gray-800">{namaAkunDebet}</td>
                    <td className="p-3 text-center font-mono text-gray-500">{t.akunDebet}</td>
                    <td className="p-3 text-right font-mono text-green-600">{t.debet.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-mono text-gray-400">-</td>
                  </tr>
                  {/* Baris Kredit (Akun Lawan) */}
                  <tr className="border-b-2 border-gray-200 hover:bg-gray-50">
                    <td className="p-3 pl-8 text-gray-600 italic">({t.uraian})<br/>{namaAkunKredit}</td>
                    <td className="p-3 text-center font-mono text-gray-500">{t.akunKredit}</td>
                    <td className="p-3 text-right font-mono text-gray-400">-</td>
                    <td className="p-3 text-right font-mono text-green-600">{t.debet.toLocaleString('id-ID')}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          {jum.length > 0 && (
            <tfoot className="bg-gray-50 font-bold text-sm border-t-2 border-gray-300">
              <tr>
                <td colSpan={4} className="p-3 text-right text-gray-700">TOTAL JURNAL PENERIMAAN KAS:</td>
                <td className="p-3 text-right font-mono text-green-700">{totalDebet.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-mono text-green-700">{totalKredit.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colSpan={6} className="p-3 text-center">
                  {totalDebet === totalKredit ? (
                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle size={16} /> BALANCE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      <XCircle size={16} /> TIDAK BALANCE
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  };

  const renderJurnalKeluar = () => {
    let totalDebet = 0;
    let totalKredit = 0;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-red-600 text-white text-sm">
              <th className="p-3 font-semibold border-r border-red-500 w-24">Tanggal</th>
              <th className="p-3 font-semibold border-r border-red-500 w-32">No Bukti</th>
              <th className="p-3 font-semibold border-r border-red-500">Keterangan</th>
              <th className="p-3 font-semibold border-r border-red-500 w-24 text-center">Ref</th>
              <th className="p-3 font-semibold border-r border-red-500 w-40 text-right">Debet (Rp)</th>
              <th className="p-3 font-semibold w-40 text-right">Kredit (Rp)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {juk.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Tidak ada data Jurnal Pengeluaran Kas.</td></tr>
            )}
            {juk.map((t, i) => {
              totalDebet += t.debet;
              totalKredit += t.debet; // Karena double entry
              const namaAkunDebet = akun.find(a => a.kode === t.akunDebet)?.nama;
              const namaAkunKredit = akun.find(a => a.kode === t.akunKredit)?.nama;

              return (
                <React.Fragment key={t.id}>
                  {/* Baris Debet (Akun Lawan) */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 align-top" rowSpan={2}>{formatDate(t.tanggal)}</td>
                    <td className="p-3 font-mono text-gray-600 align-top" rowSpan={2}>{t.noBukti}</td>
                    <td className="p-3 font-medium text-gray-800">{namaAkunDebet}<br/><span className="text-gray-500 font-normal italic">({t.uraian})</span></td>
                    <td className="p-3 text-center font-mono text-gray-500">{t.akunDebet}</td>
                    <td className="p-3 text-right font-mono text-red-600">{t.debet.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-mono text-gray-400">-</td>
                  </tr>
                  {/* Baris Kredit (Kas) */}
                  <tr className="border-b-2 border-gray-200 hover:bg-gray-50">
                    <td className="p-3 pl-8 text-gray-600">{namaAkunKredit}</td>
                    <td className="p-3 text-center font-mono text-gray-500">{t.akunKredit}</td>
                    <td className="p-3 text-right font-mono text-gray-400">-</td>
                    <td className="p-3 text-right font-mono text-red-600">{t.debet.toLocaleString('id-ID')}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          {juk.length > 0 && (
            <tfoot className="bg-gray-50 font-bold text-sm border-t-2 border-gray-300">
              <tr>
                <td colSpan={4} className="p-3 text-right text-gray-700">TOTAL JURNAL PENGELUARAN KAS:</td>
                <td className="p-3 text-right font-mono text-red-700">{totalDebet.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-mono text-red-700">{totalKredit.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colSpan={6} className="p-3 text-center">
                  {totalDebet === totalKredit ? (
                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle size={16} /> BALANCE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      <XCircle size={16} /> TIDAK BALANCE
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  };

  const renderJurnalMemorial = () => {
    let totalDebet = 0;
    let totalKredit = 0;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white text-sm">
              <th className="p-3 font-semibold border-r border-blue-500 w-24">Tanggal</th>
              <th className="p-3 font-semibold border-r border-blue-500 w-32">No Bukti</th>
              <th className="p-3 font-semibold border-r border-blue-500">Keterangan</th>
              <th className="p-3 font-semibold border-r border-blue-500 w-24 text-center">Ref</th>
              <th className="p-3 font-semibold border-r border-blue-500 w-40 text-right">Debet (Rp)</th>
              <th className="p-3 font-semibold w-40 text-right">Kredit (Rp)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {jm.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Tidak ada data Jurnal Memorial.</td></tr>
            )}
            {jm.map((j) => {
              const rowSpan = j.detail.length;
              return j.detail.map((d, idx) => {
                totalDebet += d.debet || 0;
                totalKredit += d.kredit || 0;
                const namaAkun = akun.find(a => a.kode === d.kodeAkun)?.nama;
                const isFirst = idx === 0;
                const isLast = idx === rowSpan - 1;

                return (
                  <tr key={`${j.id}-${idx}`} className={`hover:bg-gray-50 ${isLast ? 'border-b-2 border-gray-200' : 'border-b border-gray-100'}`}>
                    {isFirst && (
                      <>
                        <td className="p-3 align-top" rowSpan={rowSpan}>{formatDate(j.tanggal)}</td>
                        <td className="p-3 font-mono text-gray-600 align-top" rowSpan={rowSpan}>{j.noBukti}</td>
                      </>
                    )}
                    <td className={`p-3 ${d.kredit > 0 ? 'pl-8 text-gray-600' : 'font-medium text-gray-800'}`}>
                      {namaAkun}
                      {isFirst && <div className="text-gray-500 font-normal italic mt-1">({j.uraian})</div>}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-500">{d.kodeAkun}</td>
                    <td className="p-3 text-right font-mono text-blue-600">{d.debet > 0 ? d.debet.toLocaleString('id-ID') : '-'}</td>
                    <td className="p-3 text-right font-mono text-blue-600">{d.kredit > 0 ? d.kredit.toLocaleString('id-ID') : '-'}</td>
                  </tr>
                );
              });
            })}
          </tbody>
          {jm.length > 0 && (
            <tfoot className="bg-gray-50 font-bold text-sm border-t-2 border-gray-300">
              <tr>
                <td colSpan={4} className="p-3 text-right text-gray-700">TOTAL JURNAL MEMORIAL:</td>
                <td className="p-3 text-right font-mono text-blue-700">{totalDebet.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-mono text-blue-700">{totalKredit.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colSpan={6} className="p-3 text-center">
                  {totalDebet === totalKredit ? (
                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle size={16} /> BALANCE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      <XCircle size={16} /> TIDAK BALANCE
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Jurnal Otomatis</h1>
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
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'JUM' 
                ? 'border-green-600 text-green-700 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('JUM')}
          >
            Jurnal Penerimaan Kas (JUM)
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'JUK' 
                ? 'border-red-600 text-red-700 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('JUK')}
          >
            Jurnal Pengeluaran Kas (JUK)
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'JM' 
                ? 'border-blue-600 text-blue-700 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('JM')}
          >
            Jurnal Memorial (JM)
          </button>
        </div>

        {/* Content */}
        <div className="p-0">
          {activeTab === 'JUM' && renderJurnalMasuk()}
          {activeTab === 'JUK' && renderJurnalKeluar()}
          {activeTab === 'JM' && renderJurnalMemorial()}
        </div>
      </div>
    </div>
  );
}
