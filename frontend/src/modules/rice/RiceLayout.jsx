import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

function RiceLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/rice/lots', name: '📦 Rice Lots', icon: '📦' },
    { path: '/rice/lots/new', name: '➕ New Lot', icon: '➕' },
    { path: '/rice/inventory', name: '📊 Inventory', icon: '📊' },
    { path: '/rice/sales', name: '💰 Sales', icon: '💰' },
    { path: '/rice/reports', name: '📈 Reports', icon: '📈' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-green-700">🌾 Rice Trading</h2>
          <p className="text-xs text-gray-500">Rice Trading Module</p>
        </div>
        <nav className="p-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg mb-1 ${
                location.pathname === item.path
                  ? 'bg-green-100 text-green-700 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              {item.icon} {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default RiceLayout;