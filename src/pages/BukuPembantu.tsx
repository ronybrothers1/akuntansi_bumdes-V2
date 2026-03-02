import React, { useState } from 'react';
import { useStore } from '../store';
import { formatCurrency, formatDate, generateId } from '../utils/format';
import { exportToExcel, exportToPDF } from '../utils/export';
import { Download, Plus, FileText, X, AlertCircle } from 'lucide-react';
import { Inventaris, Persediaan, Piutang, Hutang } from '../types';

export default function BukuPembantu() {
  const { inventaris, persediaan, piutang, hutang, config, addInventaris, addPersediaan, addPiutang, addHutang } = useStore();
  const [activeTab, setActiveTab] = useState<'INVENTARIS' | 'PERSEDIAAN' | 'PIUTANG' | 'HUTANG'>('INVENTARIS');

  const [isModalInvOpen, setIsModalInvOpen] = useState(false);
  const [isModalPersOpen, setIsModalPersOpen] = useState(false);
  const [isModalPiuOpen, setIsModalPiuOpen] = useState(false);
  const [isModalHutOpen, setIsModalHutOpen] = useState(false);

  const [invForm, setInvForm] = useState<Omit<Inventaris, 'id'>>({
    namaBarang: '', satuan: '', tglPembelian: new Date().toISOString().split('T')[0], jumlah: 1, hargaBeli: 0, umurEkonomis: 1
  });

  const [persForm, setPersForm] = useState<Omit<Persediaan, 'id'>>({
    bulan: new Date().toISOString().slice(0, 7), kodeBarang: '', namaBarang: '', satuan: '', volAwal: 0, masuk: 0, keluar: 0, hargaBeli: 0, hargaJual: 0
  });

  const [piuForm, setPiuForm] = useState<Omit<Piutang, 'id' | 'angsuran'>>({
    nama: '', alamat: '', tanggalAkad: new Date().toISOString().split('T')[0], jumlahPinjaman: 0, bungaPersen: 0, jangkaWaktu: 1
  });

  const [hutForm, setHutForm] = useState<Omit<Hutang, 'id' | 'angsuran'>>({
    namaKreditur: '', tanggalAkad: new Date().toISOString().split('T')[0], jumlahPinjaman: 0, bungaPersen: 0, jangkaWaktu: 1
  });

  const handleAddInv = (e: React.FormEvent) => {
    e.preventDefault();
    addInventaris({ ...invForm, id: generateId() });
    setIsModalInvOpen(false);
  };

  const handleAddPers = (e: React.FormEvent) => {
    e.preventDefault();
    addPersediaan({ ...persForm, id: generateId() });
    setIsModalPersOpen(false);
  };

  const handleAddPiu = (e: React.FormEvent) => {
    e.preventDefault();
    addPiutang({ ...piuForm, id: generateId(), angsuran: [] });
    setIsModalPiuOpen(false);
  };

  const handleAddHut = (e: React.FormEvent) => {
    e.preventDefault();
    addHutang({ ...hutForm, id: generateId(), angsuran: [] });
    setIsModalHutOpen(false);
  };

  const handleExportExcel = () => {
    if (activeTab === 'INVENTARIS') {
      const data = inventaris.map((item, index) => {
        const tahunBeli = new Date(item.tglPembelian).getFullYear();
        const tahunSekarang = new Date().getFullYear();
        const tahunKe = Math.max(0, tahunSekarang - tahunBeli);
        const penyusutanPerTahun = item.hargaBeli / item.umurEkonomis;
        const akumulasi = Math.min(item.hargaBeli, penyusutanPerTahun * tahunKe);
        const nilaiBuku = item.hargaBeli - akumulasi;
        
        return {
          no: index + 1,
          namaBarang: item.namaBarang,
          tglPembelian: formatDate(item.tglPembelian),
          hargaBeli: item.hargaBeli,
          umurEkonomis: item.umurEkonomis,
          penyusutanPerTahun,
          akumulasi,
          nilaiBuku
        };
      });
      exportToExcel(data, [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Barang', key: 'namaBarang', width: 30 },
        { header: 'Tgl Beli', key: 'tglPembelian', width: 15 },
        { header: 'Harga Beli', key: 'hargaBeli', width: 15 },
        { header: 'Umur (Thn)', key: 'umurEkonomis', width: 10 },
        { header: 'Penyusutan/Thn', key: 'penyusutanPerTahun', width: 15 },
        { header: 'Akumulasi', key: 'akumulasi', width: 15 },
        { header: 'Nilai Buku', key: 'nilaiBuku', width: 15 }
      ], 'Buku_Inventaris', 'Inventaris', config, 'BUKU INVENTARIS (ASET TETAP)');
    } else if (activeTab === 'PERSEDIAAN') {
      const data = persediaan.map((item, index) => {
        const stokAkhir = item.volAwal + item.masuk - item.keluar;
        const nilaiAkhir = stokAkhir * item.hargaBeli;
        return {
          no: index + 1,
          namaBarang: item.namaBarang,
          volAwal: item.volAwal,
          masuk: item.masuk,
          keluar: item.keluar,
          stokAkhir,
          hargaBeli: item.hargaBeli,
          nilaiAkhir
        };
      });
      exportToExcel(data, [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Barang', key: 'namaBarang', width: 30 },
        { header: 'Awal', key: 'volAwal', width: 10 },
        { header: 'Masuk', key: 'masuk', width: 10 },
        { header: 'Keluar', key: 'keluar', width: 10 },
        { header: 'Akhir', key: 'stokAkhir', width: 10 },
        { header: 'Harga Beli', key: 'hargaBeli', width: 15 },
        { header: 'Nilai Akhir', key: 'nilaiAkhir', width: 15 }
      ], 'Buku_Persediaan', 'Persediaan', config, 'BUKU MUTASI PERSEDIAAN');
    } else if (activeTab === 'PIUTANG') {
      const data = piutang.map((item, index) => {
        const totalAngsuranPokok = item.angsuran.reduce((sum, a) => sum + a.pokok, 0);
        const sisaPokok = item.jumlahPinjaman - totalAngsuranPokok;
        const angsuranPerBulan = (item.jumlahPinjaman / item.jangkaWaktu) + (item.jumlahPinjaman * (item.bungaPersen/100));
        return {
          no: index + 1,
          nama: item.nama,
          tanggalAkad: formatDate(item.tanggalAkad),
          jumlahPinjaman: item.jumlahPinjaman,
          jangkaWaktu: item.jangkaWaktu,
          angsuranPerBulan,
          sisaPokok,
          status: sisaPokok <= 0 ? 'Lunas' : 'Aktif'
        };
      });
      exportToExcel(data, [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Debitur', key: 'nama', width: 30 },
        { header: 'Tgl Akad', key: 'tanggalAkad', width: 15 },
        { header: 'Plafon', key: 'jumlahPinjaman', width: 15 },
        { header: 'Tenor (Bln)', key: 'jangkaWaktu', width: 10 },
        { header: 'Angsuran/Bln', key: 'angsuranPerBulan', width: 15 },
        { header: 'Sisa Pokok', key: 'sisaPokok', width: 15 },
        { header: 'Status', key: 'status', width: 10 }
      ], 'Buku_Piutang', 'Piutang', config, 'BUKU PIUTANG (SIMPAN PINJAM)');
    } else if (activeTab === 'HUTANG') {
      const data = hutang.map((item, index) => {
        const totalAngsuranPokok = item.angsuran.reduce((sum, a) => sum + a.pokok, 0);
        const sisaPokok = item.jumlahPinjaman - totalAngsuranPokok;
        const angsuranPerBulan = (item.jumlahPinjaman / item.jangkaWaktu) + (item.jumlahPinjaman * (item.bungaPersen/100));
        return {
          no: index + 1,
          namaKreditur: item.namaKreditur,
          tanggalAkad: formatDate(item.tanggalAkad),
          jumlahPinjaman: item.jumlahPinjaman,
          jangkaWaktu: item.jangkaWaktu,
          angsuranPerBulan,
          sisaPokok,
          status: sisaPokok <= 0 ? 'Lunas' : 'Aktif'
        };
      });
      exportToExcel(data, [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Kreditur', key: 'namaKreditur', width: 30 },
        { header: 'Tgl Akad', key: 'tanggalAkad', width: 15 },
        { header: 'Plafon', key: 'jumlahPinjaman', width: 15 },
        { header: 'Tenor (Bln)', key: 'jangkaWaktu', width: 10 },
        { header: 'Angsuran/Bln', key: 'angsuranPerBulan', width: 15 },
        { header: 'Sisa Pokok', key: 'sisaPokok', width: 15 },
        { header: 'Status', key: 'status', width: 10 }
      ], 'Buku_Hutang', 'Hutang', config, 'BUKU HUTANG');
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'INVENTARIS') {
      const data = inventaris.map((item, index) => {
        const tahunBeli = new Date(item.tglPembelian).getFullYear();
        const tahunSekarang = new Date().getFullYear();
        const tahunKe = Math.max(0, tahunSekarang - tahunBeli);
        const penyusutanPerTahun = item.hargaBeli / item.umurEkonomis;
        const akumulasi = Math.min(item.hargaBeli, penyusutanPerTahun * tahunKe);
        const nilaiBuku = item.hargaBeli - akumulasi;
        
        return {
          no: index + 1,
          namaBarang: item.namaBarang,
          tglPembelian: formatDate(item.tglPembelian),
          hargaBeli: item.hargaBeli.toLocaleString('id-ID'),
          umurEkonomis: item.umurEkonomis,
          penyusutanPerTahun: penyusutanPerTahun.toLocaleString('id-ID'),
          akumulasi: akumulasi.toLocaleString('id-ID'),
          nilaiBuku: nilaiBuku.toLocaleString('id-ID')
        };
      });
      exportToPDF(data, [
        { header: 'No', dataKey: 'no' },
        { header: 'Nama Barang', dataKey: 'namaBarang' },
        { header: 'Tgl Beli', dataKey: 'tglPembelian' },
        { header: 'Harga Beli', dataKey: 'hargaBeli' },
        { header: 'Umur', dataKey: 'umurEkonomis' },
        { header: 'Penyusutan/Thn', dataKey: 'penyusutanPerTahun' },
        { header: 'Akumulasi', dataKey: 'akumulasi' },
        { header: 'Nilai Buku', dataKey: 'nilaiBuku' }
      ], 'Buku_Inventaris', 'BUKU INVENTARIS (ASET TETAP)', config, 'landscape');
    } else if (activeTab === 'PERSEDIAAN') {
      const data = persediaan.map((item, index) => {
        const stokAkhir = item.volAwal + item.masuk - item.keluar;
        const nilaiAkhir = stokAkhir * item.hargaBeli;
        return {
          no: index + 1,
          namaBarang: item.namaBarang,
          volAwal: item.volAwal,
          masuk: item.masuk,
          keluar: item.keluar,
          stokAkhir,
          hargaBeli: item.hargaBeli.toLocaleString('id-ID'),
          nilaiAkhir: nilaiAkhir.toLocaleString('id-ID')
        };
      });
      exportToPDF(data, [
        { header: 'No', dataKey: 'no' },
        { header: 'Nama Barang', dataKey: 'namaBarang' },
        { header: 'Awal', dataKey: 'volAwal' },
        { header: 'Masuk', dataKey: 'masuk' },
        { header: 'Keluar', dataKey: 'keluar' },
        { header: 'Akhir', dataKey: 'stokAkhir' },
        { header: 'Harga Beli', dataKey: 'hargaBeli' },
        { header: 'Nilai Akhir', dataKey: 'nilaiAkhir' }
      ], 'Buku_Persediaan', 'BUKU MUTASI PERSEDIAAN', config, 'landscape');
    } else if (activeTab === 'PIUTANG') {
      const data = piutang.map((item, index) => {
        const totalAngsuranPokok = item.angsuran.reduce((sum, a) => sum + a.pokok, 0);
        const sisaPokok = item.jumlahPinjaman - totalAngsuranPokok;
        const angsuranPerBulan = (item.jumlahPinjaman / item.jangkaWaktu) + (item.jumlahPinjaman * (item.bungaPersen/100));
        return {
          no: index + 1,
          nama: item.nama,
          tanggalAkad: formatDate(item.tanggalAkad),
          jumlahPinjaman: item.jumlahPinjaman.toLocaleString('id-ID'),
          jangkaWaktu: item.jangkaWaktu,
          angsuranPerBulan: angsuranPerBulan.toLocaleString('id-ID'),
          sisaPokok: sisaPokok.toLocaleString('id-ID'),
          status: sisaPokok <= 0 ? 'Lunas' : 'Aktif'
        };
      });
      exportToPDF(data, [
        { header: 'No', dataKey: 'no' },
        { header: 'Nama Debitur', dataKey: 'nama' },
        { header: 'Tgl Akad', dataKey: 'tanggalAkad' },
        { header: 'Plafon', dataKey: 'jumlahPinjaman' },
        { header: 'Tenor', dataKey: 'jangkaWaktu' },
        { header: 'Angsuran/Bln', dataKey: 'angsuranPerBulan' },
        { header: 'Sisa Pokok', dataKey: 'sisaPokok' },
        { header: 'Status', dataKey: 'status' }
      ], 'Buku_Piutang', 'BUKU PIUTANG (SIMPAN PINJAM)', config, 'landscape');
    } else if (activeTab === 'HUTANG') {
      const data = hutang.map((item, index) => {
        const totalAngsuranPokok = item.angsuran.reduce((sum, a) => sum + a.pokok, 0);
        const sisaPokok = item.jumlahPinjaman - totalAngsuranPokok;
        const angsuranPerBulan = (item.jumlahPinjaman / item.jangkaWaktu) + (item.jumlahPinjaman * (item.bungaPersen/100));
        return {
          no: index + 1,
          namaKreditur: item.namaKreditur,
          tanggalAkad: formatDate(item.tanggalAkad),
          jumlahPinjaman: item.jumlahPinjaman.toLocaleString('id-ID'),
          jangkaWaktu: item.jangkaWaktu,
          angsuranPerBulan: angsuranPerBulan.toLocaleString('id-ID'),
          sisaPokok: sisaPokok.toLocaleString('id-ID'),
          status: sisaPokok <= 0 ? 'Lunas' : 'Aktif'
        };
      });
      exportToPDF(data, [
        { header: 'No', dataKey: 'no' },
        { header: 'Nama Kreditur', dataKey: 'namaKreditur' },
        { header: 'Tgl Akad', dataKey: 'tanggalAkad' },
        { header: 'Plafon', dataKey: 'jumlahPinjaman' },
        { header: 'Tenor', dataKey: 'jangkaWaktu' },
        { header: 'Angsuran/Bln', dataKey: 'angsuranPerBulan' },
        { header: 'Sisa Pokok', dataKey: 'sisaPokok' },
        { header: 'Status', dataKey: 'status' }
      ], 'Buku_Hutang', 'BUKU HUTANG', config, 'landscape');
    }
  };

  const renderInventaris = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="font-semibold text-gray-800">Buku Inventaris (Aset Tetap)</h2>
        <button 
          onClick={() => setIsModalInvOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah Aset
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-sm">
              <th className="p-3 border-b font-semibold w-12 text-center">No</th>
              <th className="p-3 border-b font-semibold">Nama Barang</th>
              <th className="p-3 border-b font-semibold text-center">Tgl Beli</th>
              <th className="p-3 border-b font-semibold text-right">Harga Beli</th>
              <th className="p-3 border-b font-semibold text-center">Umur (Thn)</th>
              <th className="p-3 border-b font-semibold text-right">Penyusutan/Thn</th>
              <th className="p-3 border-b font-semibold text-right">Akumulasi</th>
              <th className="p-3 border-b font-semibold text-right">Nilai Buku</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {inventaris.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">Belum ada data inventaris.</td></tr>
            ) : (
              inventaris.map((item, index) => {
                const tahunBeli = new Date(item.tglPembelian).getFullYear();
                const tahunSekarang = new Date().getFullYear();
                const tahunKe = Math.max(0, tahunSekarang - tahunBeli);
                const penyusutanPerTahun = item.hargaBeli / item.umurEkonomis;
                const akumulasi = Math.min(item.hargaBeli, penyusutanPerTahun * tahunKe);
                const nilaiBuku = item.hargaBeli - akumulasi;

                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-center text-gray-500">{index + 1}</td>
                    <td className="p-3 font-medium text-gray-800">{item.namaBarang}</td>
                    <td className="p-3 text-center">{formatDate(item.tglPembelian)}</td>
                    <td className="p-3 text-right font-mono text-gray-600">{item.hargaBeli.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-center">{item.umurEkonomis}</td>
                    <td className="p-3 text-right font-mono text-red-600">{penyusutanPerTahun.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-mono text-red-600">{akumulasi.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-mono font-medium text-green-600">{nilaiBuku.toLocaleString('id-ID')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPersediaan = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="font-semibold text-gray-800">Buku Mutasi Persediaan</h2>
        <button 
          onClick={() => setIsModalPersOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah Barang
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-sm">
              <th className="p-3 border-b font-semibold w-12 text-center">No</th>
              <th className="p-3 border-b font-semibold">Nama Barang</th>
              <th className="p-3 border-b font-semibold text-center">Awal</th>
              <th className="p-3 border-b font-semibold text-center text-green-600">Masuk</th>
              <th className="p-3 border-b font-semibold text-center text-red-600">Keluar</th>
              <th className="p-3 border-b font-semibold text-center">Akhir</th>
              <th className="p-3 border-b font-semibold text-right">Harga Beli</th>
              <th className="p-3 border-b font-semibold text-right">Nilai Akhir</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {persediaan.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">Belum ada data persediaan.</td></tr>
            ) : (
              persediaan.map((item, index) => {
                const stokAkhir = item.volAwal + item.masuk - item.keluar;
                const nilaiAkhir = stokAkhir * item.hargaBeli;

                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-center text-gray-500">{index + 1}</td>
                    <td className="p-3 font-medium text-gray-800">{item.namaBarang}</td>
                    <td className="p-3 text-center">{item.volAwal}</td>
                    <td className="p-3 text-center text-green-600">{item.masuk}</td>
                    <td className="p-3 text-center text-red-600">{item.keluar}</td>
                    <td className="p-3 text-center font-bold">{stokAkhir}</td>
                    <td className="p-3 text-right font-mono text-gray-600">{item.hargaBeli.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-mono font-medium text-blue-600">{nilaiAkhir.toLocaleString('id-ID')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPiutang = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="font-semibold text-gray-800">Buku Piutang (Simpan Pinjam)</h2>
        <button 
          onClick={() => setIsModalPiuOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah Debitur
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-sm">
              <th className="p-3 border-b font-semibold w-12 text-center">No</th>
              <th className="p-3 border-b font-semibold">Nama Debitur</th>
              <th className="p-3 border-b font-semibold text-center">Tgl Akad</th>
              <th className="p-3 border-b font-semibold text-right">Plafon</th>
              <th className="p-3 border-b font-semibold text-center">Tenor</th>
              <th className="p-3 border-b font-semibold text-right">Angsuran/Bln</th>
              <th className="p-3 border-b font-semibold text-right">Sisa Pokok</th>
              <th className="p-3 border-b font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {piutang.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">Belum ada data piutang.</td></tr>
            ) : (
              piutang.map((item, index) => {
                const totalAngsuranPokok = item.angsuran.reduce((sum, a) => sum + a.pokok, 0);
                const sisaPokok = item.jumlahPinjaman - totalAngsuranPokok;
                const angsuranPerBulan = (item.jumlahPinjaman / item.jangkaWaktu) + (item.jumlahPinjaman * (item.bungaPersen/100));

                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-center text-gray-500">{index + 1}</td>
                    <td className="p-3 font-medium text-gray-800">{item.nama}</td>
                    <td className="p-3 text-center">{formatDate(item.tanggalAkad)}</td>
                    <td className="p-3 text-right font-mono text-gray-600">{item.jumlahPinjaman.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-center">{item.jangkaWaktu} bln</td>
                    <td className="p-3 text-right font-mono text-blue-600">{angsuranPerBulan.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-mono font-medium text-red-600">{sisaPokok.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-center">
                      {sisaPokok <= 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Lunas</span>
                      ) : (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Aktif</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderHutang = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="font-semibold text-gray-800">Buku Hutang</h2>
        <button 
          onClick={() => setIsModalHutOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah Kreditur
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-sm">
              <th className="p-3 border-b font-semibold w-12 text-center">No</th>
              <th className="p-3 border-b font-semibold">Nama Kreditur</th>
              <th className="p-3 border-b font-semibold text-center">Tgl Akad</th>
              <th className="p-3 border-b font-semibold text-right">Plafon</th>
              <th className="p-3 border-b font-semibold text-center">Tenor</th>
              <th className="p-3 border-b font-semibold text-right">Angsuran/Bln</th>
              <th className="p-3 border-b font-semibold text-right">Sisa Pokok</th>
              <th className="p-3 border-b font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {hutang.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">Belum ada data hutang.</td></tr>
            ) : (
              hutang.map((item, index) => {
                const totalAngsuranPokok = item.angsuran.reduce((sum, a) => sum + a.pokok, 0);
                const sisaPokok = item.jumlahPinjaman - totalAngsuranPokok;
                const angsuranPerBulan = (item.jumlahPinjaman / item.jangkaWaktu) + (item.jumlahPinjaman * (item.bungaPersen/100));

                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-center text-gray-500">{index + 1}</td>
                    <td className="p-3 font-medium text-gray-800">{item.namaKreditur}</td>
                    <td className="p-3 text-center">{formatDate(item.tanggalAkad)}</td>
                    <td className="p-3 text-right font-mono text-gray-600">{item.jumlahPinjaman.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-center">{item.jangkaWaktu} bln</td>
                    <td className="p-3 text-right font-mono text-blue-600">{angsuranPerBulan.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-mono font-medium text-red-600">{sisaPokok.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-center">
                      {sisaPokok <= 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Lunas</span>
                      ) : (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Aktif</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Buku Pembantu</h1>
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden">
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'INVENTARIS' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('INVENTARIS')}
        >
          Buku Inventaris
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'PERSEDIAAN' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('PERSEDIAAN')}
        >
          Buku Persediaan
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'PIUTANG' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('PIUTANG')}
        >
          Buku Piutang
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'HUTANG' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('HUTANG')}
        >
          Buku Hutang
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'INVENTARIS' && renderInventaris()}
        {activeTab === 'PERSEDIAAN' && renderPersediaan()}
        {activeTab === 'PIUTANG' && renderPiutang()}
        {activeTab === 'HUTANG' && renderHutang()}
      </div>

      {/* Modals */}
      {isModalInvOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Tambah Aset Inventaris</h2>
              <button onClick={() => setIsModalInvOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddInv} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg" value={invForm.namaBarang} onChange={e => setInvForm({...invForm, namaBarang: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                  <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg" value={invForm.satuan} onChange={e => setInvForm({...invForm, satuan: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Beli</label>
                  <input type="date" required className="w-full p-2 border border-gray-300 rounded-lg" value={invForm.tglPembelian} onChange={e => setInvForm({...invForm, tglPembelian: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                  <input type="number" required min="1" className="w-full p-2 border border-gray-300 rounded-lg" value={invForm.jumlah} onChange={e => setInvForm({...invForm, jumlah: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Umur Ekonomis (Thn)</label>
                  <input type="number" required min="1" className="w-full p-2 border border-gray-300 rounded-lg" value={invForm.umurEkonomis} onChange={e => setInvForm({...invForm, umurEkonomis: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli Total</label>
                <input type="number" required min="0" className="w-full p-2 border border-gray-300 rounded-lg" value={invForm.hargaBeli} onChange={e => setInvForm({...invForm, hargaBeli: Number(e.target.value)})} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalInvOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalPersOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Tambah Persediaan</h2>
              <button onClick={() => setIsModalPersOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddPers} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                  <input type="month" required className="w-full p-2 border border-gray-300 rounded-lg" value={persForm.bulan} onChange={e => setPersForm({...persForm, bulan: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang</label>
                  <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg" value={persForm.kodeBarang} onChange={e => setPersForm({...persForm, kodeBarang: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg" value={persForm.namaBarang} onChange={e => setPersForm({...persForm, namaBarang: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                  <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg" value={persForm.satuan} onChange={e => setPersForm({...persForm, satuan: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume Awal</label>
                  <input type="number" required min="0" className="w-full p-2 border border-gray-300 rounded-lg" value={persForm.volAwal} onChange={e => setPersForm({...persForm, volAwal: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Masuk</label>
                  <input type="number" required min="0" className="w-full p-2 border border-gray-300 rounded-lg" value={persForm.masuk} onChange={e => setPersForm({...persForm, masuk: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keluar</label>
                  <input type="number" required min="0" className="w-full p-2 border border-gray-300 rounded-lg" value={persForm.keluar} onChange={e => setPersForm({...persForm, keluar: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
                  <input type="number" required min="0" className="w-full p-2 border border-gray-300 rounded-lg" value={persForm.hargaBeli} onChange={e => setPersForm({...persForm, hargaBeli: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
                  <input type="number" required min="0" className="w-full p-2 border border-gray-300 rounded-lg" value={persForm.hargaJual} onChange={e => setPersForm({...persForm, hargaJual: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalPersOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalPiuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Tambah Debitur</h2>
              <button onClick={() => setIsModalPiuOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddPiu} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Debitur</label>
                <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg" value={piuForm.nama} onChange={e => setPiuForm({...piuForm, nama: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg" value={piuForm.alamat} onChange={e => setPiuForm({...piuForm, alamat: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akad</label>
                  <input type="date" required className="w-full p-2 border border-gray-300 rounded-lg" value={piuForm.tanggalAkad} onChange={e => setPiuForm({...piuForm, tanggalAkad: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jangka Waktu (Bln)</label>
                  <input type="number" required min="1" className="w-full p-2 border border-gray-300 rounded-lg" value={piuForm.jangkaWaktu} onChange={e => setPiuForm({...piuForm, jangkaWaktu: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pinjaman</label>
                  <input type="number" required min="0" className="w-full p-2 border border-gray-300 rounded-lg" value={piuForm.jumlahPinjaman} onChange={e => setPiuForm({...piuForm, jumlahPinjaman: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bunga (%) per Bulan</label>
                  <input type="number" required min="0" step="0.1" className="w-full p-2 border border-gray-300 rounded-lg" value={piuForm.bungaPersen} onChange={e => setPiuForm({...piuForm, bungaPersen: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalPiuOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalHutOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Tambah Kreditur</h2>
              <button onClick={() => setIsModalHutOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddHut} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kreditur</label>
                <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg" value={hutForm.namaKreditur} onChange={e => setHutForm({...hutForm, namaKreditur: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akad</label>
                  <input type="date" required className="w-full p-2 border border-gray-300 rounded-lg" value={hutForm.tanggalAkad} onChange={e => setHutForm({...hutForm, tanggalAkad: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jangka Waktu (Bln)</label>
                  <input type="number" required min="1" className="w-full p-2 border border-gray-300 rounded-lg" value={hutForm.jangkaWaktu} onChange={e => setHutForm({...hutForm, jangkaWaktu: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pinjaman</label>
                  <input type="number" required min="0" className="w-full p-2 border border-gray-300 rounded-lg" value={hutForm.jumlahPinjaman} onChange={e => setHutForm({...hutForm, jumlahPinjaman: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bunga (%) per Bulan</label>
                  <input type="number" required min="0" step="0.1" className="w-full p-2 border border-gray-300 rounded-lg" value={hutForm.bungaPersen} onChange={e => setHutForm({...hutForm, bungaPersen: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalHutOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
