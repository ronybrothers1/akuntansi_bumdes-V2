import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { formatCurrency, formatDate, generateId } from '../utils/format';
import { exportToExcel, exportToPDF } from '../utils/export';
import { Plus, Edit2, Trash2, Search, Download, FileText, PlusCircle, MinusCircle } from 'lucide-react';
import { JurnalMemorial } from '../types';

export default function JurnalMemorialPage() {
  const { jurnalMemorial, addJurnalMemorial, updateJurnalMemorial, deleteJurnalMemorial, akun, config } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  
  const [formData, setFormData] = useState<Omit<JurnalMemorial, 'id'>>({
    tanggal: new Date().toISOString().split('T')[0],
    noBukti: '',
    uraian: '',
    detail: [{ kodeAkun: '', debet: 0, kredit: 0 }, { kodeAkun: '', debet: 0, kredit: 0 }]
  });

  const handleOpenModal = (jurnal?: JurnalMemorial) => {
    if (jurnal) {
      setEditingId(jurnal.id);
      setFormData({
        tanggal: jurnal.tanggal,
        noBukti: jurnal.noBukti,
        uraian: jurnal.uraian,
        detail: [...jurnal.detail],
      });
    } else {
      setEditingId(null);
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        noBukti: '',
        uraian: '',
        detail: [{ kodeAkun: '', debet: 0, kredit: 0 }, { kodeAkun: '', debet: 0, kredit: 0 }]
      });
    }
    setIsModalOpen(true);
  };

  const handleAddDetail = () => {
    setFormData({
      ...formData,
      detail: [...formData.detail, { kodeAkun: '', debet: 0, kredit: 0 }]
    });
  };

  const handleRemoveDetail = (index: number) => {
    const newDetail = [...formData.detail];
    newDetail.splice(index, 1);
    setFormData({ ...formData, detail: newDetail });
  };

  const handleDetailChange = (index: number, field: 'kodeAkun' | 'debet' | 'kredit', value: string | number) => {
    const newDetail = [...formData.detail];
    newDetail[index] = { ...newDetail[index], [field]: value };
    
    // If setting debet > 0, set kredit to 0 and vice versa
    if (field === 'debet' && Number(value) > 0) newDetail[index].kredit = 0;
    if (field === 'kredit' && Number(value) > 0) newDetail[index].debet = 0;
    
    setFormData({ ...formData, detail: newDetail });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.detail.some(d => !d.kodeAkun)) {
      alert('Semua baris detail harus memiliki akun!');
      return;
    }
    
    const totalDebet = formData.detail.reduce((sum, d) => sum + (d.debet || 0), 0);
    const totalKredit = formData.detail.reduce((sum, d) => sum + (d.kredit || 0), 0);
    
    if (totalDebet !== totalKredit) {
      alert(`Jurnal tidak balance!\nTotal Debet: ${totalDebet}\nTotal Kredit: ${totalKredit}`);
      return;
    }
    
    if (totalDebet === 0) {
      alert('Nominal jurnal tidak boleh 0!');
      return;
    }

    const isDuplicate = jurnalMemorial.some(j => j.noBukti === formData.noBukti && j.id !== editingId);
    if (isDuplicate) {
      alert(`Nomor Bukti ${formData.noBukti} sudah digunakan!`);
      return;
    }

    if (editingId) {
      updateJurnalMemorial(editingId, { ...formData, id: editingId });
    } else {
      addJurnalMemorial({ ...formData, id: generateId() });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
      deleteJurnalMemorial(id);
    }
  };

  const filteredJurnal = useMemo(() => {
    return [...jurnalMemorial]
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
      .filter(j => {
        const matchSearch = j.uraian.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            j.noBukti.toLowerCase().includes(searchTerm.toLowerCase());
        const matchBulan = filterBulan ? j.tanggal.startsWith(filterBulan) : true;
        return matchSearch && matchBulan;
      });
  }, [jurnalMemorial, searchTerm, filterBulan]);

  const handleExportExcel = () => {
    const data: any[] = [];
    let no = 1;
    
    filteredJurnal.forEach(j => {
      j.detail.forEach((d, i) => {
        data.push({
          no: i === 0 ? no++ : '',
          tanggal: i === 0 ? formatDate(j.tanggal) : '',
          noBukti: i === 0 ? j.noBukti : '',
          uraian: i === 0 ? j.uraian : '',
          kodeAkun: d.kodeAkun,
          namaAkun: akun.find(a => a.kode === d.kodeAkun)?.nama || '',
          debet: d.debet,
          kredit: d.kredit
        });
      });
    });

    exportToExcel(
      data,
      [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'No Bukti', key: 'noBukti', width: 15 },
        { header: 'Uraian', key: 'uraian', width: 30 },
        { header: 'Kode Akun', key: 'kodeAkun', width: 15 },
        { header: 'Nama Akun', key: 'namaAkun', width: 25 },
        { header: 'Debet (Rp)', key: 'debet', width: 15 },
        { header: 'Kredit (Rp)', key: 'kredit', width: 15 },
      ],
      'Jurnal_Memorial',
      'Jurnal Memorial',
      config,
      'JURNAL MEMORIAL'
    );
  };

  const handleExportPDF = () => {
    const data: any[] = [];
    let no = 1;
    
    filteredJurnal.forEach(j => {
      j.detail.forEach((d, i) => {
        data.push({
          no: i === 0 ? no++ : '',
          tanggal: i === 0 ? formatDate(j.tanggal) : '',
          noBukti: i === 0 ? j.noBukti : '',
          uraian: i === 0 ? j.uraian : '',
          akun: `${d.kodeAkun} - ${akun.find(a => a.kode === d.kodeAkun)?.nama || ''}`,
          debet: d.debet > 0 ? d.debet.toLocaleString('id-ID') : '-',
          kredit: d.kredit > 0 ? d.kredit.toLocaleString('id-ID') : '-'
        });
      });
    });

    exportToPDF(
      data,
      [
        { header: 'No', dataKey: 'no' },
        { header: 'Tanggal', dataKey: 'tanggal' },
        { header: 'No Bukti', dataKey: 'noBukti' },
        { header: 'Uraian', dataKey: 'uraian' },
        { header: 'Akun', dataKey: 'akun' },
        { header: 'Debet (Rp)', dataKey: 'debet' },
        { header: 'Kredit (Rp)', dataKey: 'kredit' },
      ],
      'Jurnal_Memorial',
      'JURNAL MEMORIAL',
      config,
      'landscape'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Jurnal Memorial</h1>
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            onClick={() => handleOpenModal()}
          >
            <Plus size={16} /> Tambah Jurnal
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <input 
            type="month" 
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white text-sm">
                <th className="p-3 font-semibold text-center w-12 border-r border-blue-500">No</th>
                <th className="p-3 font-semibold border-r border-blue-500">Tanggal</th>
                <th className="p-3 font-semibold border-r border-blue-500">No Bukti</th>
                <th className="p-3 font-semibold border-r border-blue-500">Uraian</th>
                <th className="p-3 font-semibold border-r border-blue-500">Akun</th>
                <th className="p-3 font-semibold text-right border-r border-blue-500">Debet (Rp)</th>
                <th className="p-3 font-semibold text-right border-r border-blue-500">Kredit (Rp)</th>
                <th className="p-3 font-semibold text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredJurnal.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Belum ada jurnal memorial. Klik "Tambah Jurnal" untuk memulai.
                  </td>
                </tr>
              ) : (
                filteredJurnal.map((j, index) => (
                  <React.Fragment key={j.id}>
                    {j.detail.map((d, i) => {
                      const namaAkun = akun.find(a => a.kode === d.kodeAkun)?.nama || '-';
                      return (
                        <tr key={`${j.id}-${i}`} className={`border-b hover:bg-gray-50 ${i === 0 ? 'border-t-2 border-t-gray-200' : ''}`}>
                          {i === 0 && (
                            <>
                              <td className="p-3 text-center text-gray-500" rowSpan={j.detail.length}>{index + 1}</td>
                              <td className="p-3" rowSpan={j.detail.length}>{formatDate(j.tanggal)}</td>
                              <td className="p-3 font-mono text-gray-600" rowSpan={j.detail.length}>{j.noBukti}</td>
                              <td className="p-3 whitespace-normal" rowSpan={j.detail.length}>{j.uraian}</td>
                            </>
                          )}
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs ${d.kredit > 0 ? 'ml-4' : ''}`}>
                              {d.kodeAkun} - {namaAkun}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-gray-900">
                            {d.debet > 0 ? d.debet.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="p-3 text-right font-mono text-gray-900">
                            {d.kredit > 0 ? d.kredit.toLocaleString('id-ID') : '-'}
                          </td>
                          {i === 0 && (
                            <td className="p-3 text-center" rowSpan={j.detail.length}>
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleOpenModal(j)}
                                  className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(j.id)}
                                  className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Jurnal Memorial' : 'Tambah Jurnal Memorial'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                    <input 
                      type="date" 
                      required
                      value={formData.tanggal}
                      onChange={e => setFormData({...formData, tanggal: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No Bukti</label>
                    <input 
                      type="text" 
                      required
                      value={formData.noBukti}
                      onChange={e => setFormData({...formData, noBukti: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono"
                      placeholder="JM-001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uraian Transaksi</label>
                  <textarea 
                    required
                    rows={2}
                    value={formData.uraian}
                    onChange={e => setFormData({...formData, uraian: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Keterangan jurnal..."
                  />
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Detail Jurnal</label>
                    <button
                      type="button"
                      onClick={handleAddDetail}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                    >
                      <PlusCircle size={16} /> Tambah Baris
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-sm">
                          <th className="p-2 border-b font-semibold">Akun</th>
                          <th className="p-2 border-b font-semibold w-40 text-right">Debet</th>
                          <th className="p-2 border-b font-semibold w-40 text-right">Kredit</th>
                          <th className="p-2 border-b font-semibold w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.detail.map((d, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="p-2">
                              <select 
                                required
                                value={d.kodeAkun}
                                onChange={e => handleDetailChange(i, 'kodeAkun', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                              >
                                <option value="">-- Pilih Akun --</option>
                                {akun.map(a => (
                                  <option key={a.kode} value={a.kode}>{a.kode} - {a.nama}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                min="0"
                                value={d.debet || ''}
                                onChange={e => handleDetailChange(i, 'debet', Number(e.target.value))}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-right font-mono text-sm"
                                placeholder="0"
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                min="0"
                                value={d.kredit || ''}
                                onChange={e => handleDetailChange(i, 'kredit', Number(e.target.value))}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-right font-mono text-sm"
                                placeholder="0"
                              />
                            </td>
                            <td className="p-2 text-center">
                              {formData.detail.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDetail(i)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <MinusCircle size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-medium text-sm">
                        <tr>
                          <td className="p-2 text-right">TOTAL:</td>
                          <td className={`p-2 text-right font-mono ${formData.detail.reduce((sum, d) => sum + (d.debet || 0), 0) !== formData.detail.reduce((sum, d) => sum + (d.kredit || 0), 0) ? 'text-red-600' : 'text-green-600'}`}>
                            {formData.detail.reduce((sum, d) => sum + (d.debet || 0), 0).toLocaleString('id-ID')}
                          </td>
                          <td className={`p-2 text-right font-mono ${formData.detail.reduce((sum, d) => sum + (d.debet || 0), 0) !== formData.detail.reduce((sum, d) => sum + (d.kredit || 0), 0) ? 'text-red-600' : 'text-green-600'}`}>
                            {formData.detail.reduce((sum, d) => sum + (d.kredit || 0), 0).toLocaleString('id-ID')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-4 flex justify-end gap-3 border-t border-gray-200 bg-gray-50 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
