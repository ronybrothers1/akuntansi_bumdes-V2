import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Save, Plus, Trash2, AlertTriangle, Database } from 'lucide-react';
import { UnitUsaha, SaldoAwal } from '../types';
import { DUMMY_SALDO_AWAL, DUMMY_TRANSAKSI, DUMMY_INVENTARIS, DUMMY_PERSEDIAAN, DUMMY_PIUTANG } from '../utils/dummyData';

export default function Setup() {
  const { config, setConfig, unitUsaha, setUnitUsaha, akun, saldoAwal, setSaldoAwal, addTransaksiKas, addInventaris, addPersediaan, addPiutang, resetData } = useStore();
  
  const [localConfig, setLocalConfig] = useState(config);
  const [localUnitUsaha, setLocalUnitUsaha] = useState<UnitUsaha[]>(unitUsaha);
  const [localSaldoAwal, setLocalSaldoAwal] = useState<SaldoAwal[]>([]);

  useEffect(() => {
    setLocalSaldoAwal(
      akun.map(a => {
        const existing = saldoAwal.find(s => s.kodeAkun === a.kode);
        return existing || { kodeAkun: a.kode, debet: 0, kredit: 0 };
      })
    );
  }, [akun, saldoAwal]);

  const handleLoadDummyData = () => {
    if (window.confirm('PERINGATAN: Ini akan mereset data Anda dan memuat data contoh. Lanjutkan?')) {
      resetData();
      setSaldoAwal(DUMMY_SALDO_AWAL);
      DUMMY_TRANSAKSI.forEach(t => addTransaksiKas(t));
      DUMMY_INVENTARIS.forEach(i => addInventaris(i));
      DUMMY_PERSEDIAAN.forEach(p => addPersediaan(p));
      DUMMY_PIUTANG.forEach(p => addPiutang(p));
      alert('Data contoh berhasil dimuat! Silakan refresh halaman.');
      window.location.reload();
    }
  };

  const handleSaveConfig = () => {
    setConfig(localConfig);
    alert('Data BUMDes berhasil disimpan!');
  };

  const handleAddUnitUsaha = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    // Generate next available codes
    const nextPendapatan = `4${localUnitUsaha.length + 1}`;
    const nextBiaya = `5${localUnitUsaha.length + 1}`;
    
    setLocalUnitUsaha([
      ...localUnitUsaha, 
      { id: newId, nama: '', kodePendapatan: nextPendapatan, kodeBiaya: nextBiaya }
    ]);
  };

  const handleSaveUnitUsaha = () => {
    setUnitUsaha(localUnitUsaha);
    alert('Unit Usaha berhasil disimpan!');
  };

  const handleSaveSaldoAwal = () => {
    // Validate balance
    const totalDebet = localSaldoAwal.reduce((sum, s) => sum + (s.debet || 0), 0);
    const totalKredit = localSaldoAwal.reduce((sum, s) => sum + (s.kredit || 0), 0);
    
    if (totalDebet !== totalKredit) {
      alert(`Saldo Awal tidak balance!\nTotal Debet: ${totalDebet}\nTotal Kredit: ${totalKredit}`);
      return;
    }
    
    setSaldoAwal(localSaldoAwal);
    alert('Saldo Awal berhasil disimpan!');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Setup Awal BUMDes</h1>
        <button 
          onClick={handleLoadDummyData}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Database size={16} /> Muat Data Contoh
        </button>
      </div>

      {/* 1. DATA BUMDES */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">1. Data Identitas BUMDes</h2>
          <button 
            onClick={handleSaveConfig}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Save size={16} /> Simpan Data
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama BUMDes</label>
              <input 
                type="text" 
                value={localConfig.namaBumdes}
                onChange={e => setLocalConfig({...localConfig, namaBumdes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desa</label>
                <input 
                  type="text" 
                  value={localConfig.namaDesa}
                  onChange={e => setLocalConfig({...localConfig, namaDesa: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                <input 
                  type="text" 
                  value={localConfig.kecamatan}
                  onChange={e => setLocalConfig({...localConfig, kecamatan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten</label>
                <input 
                  type="text" 
                  value={localConfig.kabupaten}
                  onChange={e => setLocalConfig({...localConfig, kabupaten: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Periode</label>
                <input 
                  type="number" 
                  value={localConfig.periodeTahun}
                  onChange={e => setLocalConfig({...localConfig, periodeTahun: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bulan Mulai</label>
                <input 
                  type="number" min="1" max="12"
                  value={localConfig.periodeBulanMulai}
                  onChange={e => setLocalConfig({...localConfig, periodeBulanMulai: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bulan Selesai</label>
                <input 
                  type="number" min="1" max="12"
                  value={localConfig.periodeBulanSelesai}
                  onChange={e => setLocalConfig({...localConfig, periodeBulanSelesai: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Direktur</label>
              <input 
                type="text" 
                value={localConfig.direktur}
                onChange={e => setLocalConfig({...localConfig, direktur: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bendahara</label>
              <input 
                type="text" 
                value={localConfig.bendahara}
                onChange={e => setLocalConfig({...localConfig, bendahara: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sekretaris</label>
              <input 
                type="text" 
                value={localConfig.sekretaris}
                onChange={e => setLocalConfig({...localConfig, sekretaris: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. UNIT USAHA */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">2. Unit Usaha BUMDes</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleAddUnitUsaha}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Tambah Unit
            </button>
            <button 
              onClick={handleSaveUnitUsaha}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Save size={16} /> Simpan Unit
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 flex items-start gap-3 text-sm">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <p>Setiap unit usaha otomatis akan dibuatkan akun Pendapatan (Kode 4x) dan Biaya (Kode 5x) di Daftar Akun.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm">
                  <th className="p-3 border-b font-semibold">Nama Unit Usaha</th>
                  <th className="p-3 border-b font-semibold w-32">Kode Pendapatan</th>
                  <th className="p-3 border-b font-semibold w-32">Kode Biaya</th>
                  <th className="p-3 border-b font-semibold w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {localUnitUsaha.map((u, i) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={u.nama}
                        onChange={e => {
                          const newUnits = [...localUnitUsaha];
                          newUnits[i].nama = e.target.value;
                          setLocalUnitUsaha(newUnits);
                        }}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                        placeholder="Nama Unit Usaha"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={u.kodePendapatan}
                        readOnly
                        className="w-full px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-gray-500 font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={u.kodeBiaya}
                        readOnly
                        className="w-full px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-gray-500 font-mono"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button 
                        onClick={() => setLocalUnitUsaha(localUnitUsaha.filter(unit => unit.id !== u.id))}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. SALDO AWAL */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">3. Saldo Awal Neraca</h2>
          <button 
            onClick={handleSaveSaldoAwal}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Save size={16} /> Simpan Saldo
          </button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm">
                  <th className="p-3 border-b font-semibold w-24">Kode</th>
                  <th className="p-3 border-b font-semibold">Nama Akun</th>
                  <th className="p-3 border-b font-semibold text-right w-48">Debet (Rp)</th>
                  <th className="p-3 border-b font-semibold text-right w-48">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {akun.filter(a => ['AKTIVA', 'HUTANG', 'MODAL'].includes(a.kategori)).map((a) => {
                  const saldo = localSaldoAwal.find(s => s.kodeAkun === a.kode) || { debet: 0, kredit: 0 };
                  return (
                    <tr key={a.kode} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-gray-600">{a.kode}</td>
                      <td className="p-3">{a.nama}</td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          value={saldo.debet || ''}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setLocalSaldoAwal(prev => prev.map(s => s.kodeAkun === a.kode ? { ...s, debet: val } : s));
                          }}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 text-right font-mono"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          value={saldo.kredit || ''}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setLocalSaldoAwal(prev => prev.map(s => s.kodeAkun === a.kode ? { ...s, kredit: val } : s));
                          }}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 text-right font-mono"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={2} className="p-3 text-right">TOTAL:</td>
                  <td className="p-3 text-right font-mono text-green-600">
                    {localSaldoAwal.reduce((sum, s) => sum + (s.debet || 0), 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-right font-mono text-green-600">
                    {localSaldoAwal.reduce((sum, s) => sum + (s.kredit || 0), 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
