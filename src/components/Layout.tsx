import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, BookOpen, FileText, 
  BarChart3, Menu, X, FileSpreadsheet
} from 'lucide-react';
import { useStore } from '../store';

const SidebarItem = ({ icon: Icon, label, to, isActive, onClick }: any) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-green-600 text-white' 
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { config } = useStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Settings, label: 'Setup Awal', to: '/setup' },
    { icon: BookOpen, label: 'Buku Kas Harian', to: '/kas-harian' },
    { icon: FileText, label: 'Jurnal', to: '/jurnal' },
    { icon: FileSpreadsheet, label: 'Buku Pembantu', to: '/buku-pembantu' },
    { icon: BarChart3, label: 'Mutasi Neraca', to: '/mutasi-neraca' },
    { icon: FileText, label: 'Laporan Keuangan', to: '/laporan' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-500">BUMDes App</h1>
            <p className="text-xs text-gray-400 mt-1">{config.namaBumdes || 'Belum di-setup'}</p>
          </div>
          <button 
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={location.pathname === item.to}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 text-center">
            Sistem Akuntansi BUMDes v1.0<br/>
            Dikembangkan oleh<br/>
            <span className="text-gray-300 font-medium">Imam Sahroni Darmawan</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
                {config.namaBumdes || 'Sistem Akuntansi BUMDes'}
              </h2>
              <p className="text-xs text-gray-500 hidden sm:block">
                Periode: {config.periodeTahun} (Bulan {config.periodeBulanMulai} - {config.periodeBulanSelesai})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Action buttons can be injected here by pages */}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-6 print:p-0 print:overflow-visible">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 text-xs py-3 text-center print:hidden">
          Sistem Akuntansi BUMDes v1.0 | Dikembangkan oleh Imam Sahroni Darmawan
        </footer>
      </main>
    </div>
  );
}
