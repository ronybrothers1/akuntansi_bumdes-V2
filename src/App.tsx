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
import JurnalMemorial from './pages/JurnalMemorial';
import BukuPembantu from './pages/BukuPembantu';
import MutasiNeraca from './pages/MutasiNeraca';
import LaporanKeuangan from './pages/LaporanKeuangan';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AuthLayout } from './auth/AuthLayout';

const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthLayout />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="setup" element={<Setup />} />
          <Route path="kas-harian" element={<KasHarian />} />
          <Route path="jurnal-memorial" element={<JurnalMemorial />} />
          <Route path="jurnal" element={<Jurnal />} />
          <Route path="buku-pembantu" element={<BukuPembantu />} />
          <Route path="mutasi-neraca" element={<MutasiNeraca />} />
          <Route path="laporan" element={<LaporanKeuangan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
