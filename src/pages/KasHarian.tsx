import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { formatCurrency, formatDate, generateId } from '../utils/format';
import { exportToExcel, exportToPDF } from '../utils/export';
import { Plus, Edit2, Trash2, Search, Download, FileText } from 'lucide-react';
import { TransaksiKas } from '../types';

export default function KasHarian() {
  const { transaksiKas, addTransaksiKas, updateTransaksiKas, deleteTransaksiKas, akun, config, saldoAwal } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterKasBank, setFilterKasBank] = useState('ALL'); // 'ALL', '11', '12'
  
  const [formData, setFormData] = useState<Omit<TransaksiKas, 'id'>>({
    tanggal: new Date().toISOString().split('T')[0],
    noBukti: '',
    akunKas: '11', // Default to Kas
    kodeAkun: '',
    uraian: '',
    masuk: 0,
    keluar: 0,
  });

  const handleOpenModal = (transaksi?: TransaksiKas) => {
    if (transaksi) {
      setEditingId(transaksi.id);
      setFormData({
        tanggal: transaksi.tanggal,
        noBukti: transaksi.noBukti,
        akunKas: transaksi.akunKas || '11',
        kodeAkun: transaksi.kodeAkun,
        uraian: transaksi.uraian,
        masuk: transaksi.masuk,
        keluar: transaksi.keluar,
      });
    } else {
      setEditingId(null);
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        noBukti: '',
        akunKas: '11',
        kodeAkun: '',
        uraian: '',
        masuk: 0,
        keluar: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeAkun) {
      alert('Pilih akun terlebih dahulu!');
      return;
    }
    if (formData.masuk === 0 && formData.keluar === 0) {
      alert('Nominal masuk atau keluar harus diisi!');
      return;
    }

    // Validasi No Bukti
    const isDuplicate = transaksiKas.some(t => t.noBukti === formData.noBukti && t.id !== editingId);
    if (isDuplicate) {
      alert(`Nomor Bukti ${formData.noBukti} sudah digunakan! Silakan gunakan nomor bukti lain.`);
      return;
    }

    if (editingId) {
      updateTransaksiKas(editingId, { ...formData, id: editingId });
    } else {
      addTransaksiKas({ ...formData, id: generateId() });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      deleteTransaksiKas(id);
    }
  };

  // Sort and calculate running balance
  const sortedTransaksi = useMemo(() => {
    const saldoAwalKas = saldoAwal.find(s => s.kodeAkun === '11');
    const saldoAwalBank = saldoAwal.find(s => s.kodeAkun === '12');
    const awalKas = (saldoAwalKas?.debet || 0) - (saldoAwalKas?.kredit || 0);
    const awalBank = (saldoAwalBank?.debet || 0) - (saldoAwalBank?.kredit || 0);
    
    const sorted = [...transaksiKas].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    
    let saldoKas = awalKas;
    let saldoBank = awalBank;

    return sorted.map(t => {
      const isBank = t.akunKas === '12';
      if (isBank) {
        saldoBank = saldoBank + t.masuk - t.keluar;
        return { ...t, saldo: saldoBank };
      } else {
        saldoKas = saldoKas + t.masuk - t.keluar;
        return { ...t, saldo: saldoKas };
      }
    });
  }, [transaksiKas, saldoAwal]);

  // Filter
  const filteredTransaksi = useMemo(() => {
    return sortedTransaksi.filter(t => {
      const matchSearch = t.uraian.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.noBukti.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBulan = filterBulan ? t.tanggal.startsWith(filterBulan) : true;
      const matchKasBank = filterKasBank === 'ALL' ? true : (t.akunKas || '11') === filterKasBank;
      return matchSearch && matchBulan && matchKasBank;
    });
  }, [sortedTransaksi, searchTerm, filterBulan, filterKasBank]);

  const handleExportExcel = () => {
    const data = filteredTransaksi.map((t, i) => ({
      no: i + 1,
      tanggal: formatDate(t.tanggal),
      noBukti: t.noBukti,
      akun: `${t.kodeAkun} - ${akun.find(a => a.kode === t.kodeAkun)?.nama || ''}`,
      uraian: t.uraian,
      masuk: t.masuk,
      keluar: t.keluar,
      saldo: t.saldo
    }));

    exportToExcel(
      data,
      [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'No Bukti', key: 'noBukti', width: 15 },
        { header: 'Akun', key: 'akun', width: 25 },
        { header: 'Uraian', key: 'uraian', width: 40 },
        { header: 'Masuk (Rp)', key: 'masuk', width: 15 },
        { header: 'Keluar (Rp)', key: 'keluar', width: 15 },
        { header: 'Saldo (Rp)', key: 'saldo', width: 15 },
      ],
      'Kas_Harian',
      'Kas Harian',
      config,
      'BUKU KAS HARIAN'
    );
  };

  const handleExportPDF = () => {
    const data = filteredTransaksi.map((t, i) => ({
      no: i + 1,
      tanggal: formatDate(t.tanggal),
      noBukti: t.noBukti,
      akun: `${t.kodeAkun} - ${akun.find(a => a.kode === t.kodeAkun)?.nama || ''}`,
      uraian: t.uraian,
      masuk: t.masuk.toLocaleString('id-ID'),
      keluar: t.keluar.toLocaleString('id-ID'),
      saldo: t.saldo.toLocaleString('id-ID')
    }));

    exportToPDF(
      data,
      [
        { header: 'No', dataKey: 'no' },
        { header: 'Tanggal', dataKey: 'tanggal' },
        { header: 'No Bukti', dataKey: 'noBukti' },
        { header: 'Akun', dataKey: 'akun' },
        { header: 'Uraian', dataKey: 'uraian' },
        { header: 'Masuk (Rp)', dataKey: 'masuk' },
        { header: 'Keluar (Rp)', dataKey: 'keluar' },
        { header: 'Saldo (Rp)', dataKey: 'saldo' },
      ],
      'Kas_Harian',
      'BUKU KAS HARIAN',
      config,
      'landscape'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Buku Kas Harian</h1>
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
          <button 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            onClick={() => handleOpenModal()}
          >
            <Plus size={16} /> Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari uraian atau no bukti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filterKasBank}
            onChange={(e) => setFilterKasBank(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
          >
            <option value="ALL">Semua Kas & Bank</option>
            <option value="11">Kas Tunai (11)</option>
            <option value="12">Bank (12)</option>
          </select>
        </div>
        <div className="w-full sm:w-48">
          <input 
            type="month" 
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-green-600 text-white text-sm">
                <th className="p-3 font-semibold text-center w-12 border-r border-green-500">No</th>
                <th className="p-3 font-semibold border-r border-green-500">Tanggal</th>
                <th className="p-3 font-semibold border-r border-green-500">No Bukti</th>
                <th className="p-3 font-semibold border-r border-green-500">Kas/Bank</th>
                <th className="p-3 font-semibold border-r border-green-500">Akun Lawan</th>
                <th className="p-3 font-semibold border-r border-green-500 min-w-[200px]">Uraian</th>
                <th className="p-3 font-semibold text-right border-r border-green-500">Masuk (Rp)</th>
                <th className="p-3 font-semibold text-right border-r border-green-500">Keluar (Rp)</th>
                <th className="p-3 font-semibold text-right border-r border-green-500">Saldo (Rp)</th>
                <th className="p-3 font-semibold text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredTransaksi.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    Belum ada transaksi kas. Klik "Tambah Transaksi" untuk memulai.
                  </td>
                </tr>
              ) : (
                filteredTransaksi.map((t, index) => {
                  const namaAkunLawan = akun.find(a => a.kode === t.kodeAkun)?.nama || '-';
                  const namaAkunKas = akun.find(a => a.kode === (t.akunKas || '11'))?.nama || 'Kas';
                  return (
                    <tr key={t.id} className="border-b hover:bg-gray-50 even:bg-gray-50/50">
                      <td className="p-3 text-center text-gray-500">{index + 1}</td>
                      <td className="p-3">{formatDate(t.tanggal)}</td>
                      <td className="p-3 font-mono text-gray-600">{t.noBukti}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md font-mono text-xs ${t.akunKas === '12' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {t.akunKas || '11'} - {namaAkunKas}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                          {t.kodeAkun} - {namaAkunLawan}
                        </span>
                      </td>
                      <td className="p-3 whitespace-normal">{t.uraian}</td>
                      <td className="p-3 text-right font-mono text-green-600">
                        {t.masuk > 0 ? t.masuk.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-red-600">
                        {t.keluar > 0 ? t.keluar.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-gray-900">
                        {t.saldo.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenModal(t)}
                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredTransaksi.length > 0 && (
              <tfoot className="bg-green-50 border-t-2 border-green-200 font-bold text-sm">
                <tr>
                  <td colSpan={5} className="p-3 text-right text-gray-700">TOTAL PERIODE INI:</td>
                  <td className="p-3 text-right font-mono text-green-700">
                    {filteredTransaksi.reduce((sum, t) => sum + t.masuk, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-right font-mono text-red-700">
                    {filteredTransaksi.reduce((sum, t) => sum + t.keluar, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-right font-mono text-gray-900">
                    {filteredTransaksi[filteredTransaksi.length - 1]?.saldo.toLocaleString('id-ID') || '0'}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Transaksi Kas' : 'Tambah Transaksi Kas'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={20} className="hidden" /> {/* Placeholder */}
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={formData.tanggal}
                    onChange={e => setFormData({...formData, tanggal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No Bukti</label>
                  <input 
                    type="text" 
                    required
                    value={formData.noBukti}
                    onChange={e => setFormData({...formData, noBukti: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-mono"
                    placeholder="BKM-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kas / Bank</label>
                  <select 
                    required
                    value={formData.akunKas}
                    onChange={e => setFormData({...formData, akunKas: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="11">11 - Kas Tunai</option>
                    <option value="12">12 - Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Akun Lawan</label>
                  <select 
                    required
                    value={formData.kodeAkun}
                    onChange={e => setFormData({...formData, kodeAkun: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">-- Pilih Akun --</option>
                    {akun.filter(a => a.kode !== formData.akunKas).map(a => (
                      <option key={a.kode} value={a.kode}>{a.kode} - {a.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uraian Transaksi</label>
                <textarea 
                  required
                  rows={2}
                  value={formData.uraian}
                  onChange={e => setFormData({...formData, uraian: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  placeholder="Keterangan transaksi..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pemasukan (Rp)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.masuk || ''}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setFormData({...formData, masuk: val, keluar: val > 0 ? 0 : formData.keluar});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-right font-mono"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pengeluaran (Rp)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.keluar || ''}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setFormData({...formData, keluar: val, masuk: val > 0 ? 0 : formData.masuk});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-right font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
