/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import KasHarian from './pages/KasHarian';
import Jurnal from './pages/Jurnal';
import BukuPembantu from './pages/BukuPembantu';
import MutasiNeraca from './pages/MutasiNeraca';
import LaporanKeuangan from './pages/LaporanKeuangan';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="setup" element={<Setup />} />
          <Route path="kas-harian" element={<KasHarian />} />
          <Route path="jurnal" element={<Jurnal />} />
          <Route path="buku-pembantu" element={<BukuPembantu />} />
          <Route path="mutasi-neraca" element={<MutasiNeraca />} />
          <Route path="laporan" element={<LaporanKeuangan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
