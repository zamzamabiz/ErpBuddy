import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const location = useLocation();
  const [userRole, setUserRole] = useState('User');

  // Get user role from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'User');
      }
    } catch (err) {
      console.error('Error reading user role:', err);
      setUserRole('User');
    }
  }, []);

  const isActive = (path) => {
    return location.pathname === path ? "bg-blue-700 rounded px-2 py-1" : "";
  };

  // Define role-based menu items
  // Admin has full access, Accountant has reports + journal, User has limited access
  const allMenuItems = [
    { label: "Dashboard", path: "/", roles: ['Admin', 'Accountant', 'User'] },
    // Masters (Admin only)
    { label: "Accounts", path: "/accounts", roles: ['Admin', 'Accountant'] },
    // Journal & Accounting (Admin, Accountant)
    { label: "Journal", path: "/journal", roles: ['Admin', 'Accountant'] },
    // Finance (Admin, Accountant)
    { label: "Payments", path: "/payments", roles: ['Admin', 'Accountant'] },
    // System Management (Admin only)
    { label: "Tenants", path: "/tenants", roles: ['Admin'] },
    { label: "Companies", path: "/companies", roles: ['Admin'] },
    { label: "Branches", path: "/branches", roles: ['Admin'] },
    { label: "Users", path: "/users", roles: ['Admin'] },
    { label: "Subscription Plans", path: "/plans", roles: ['Admin'] },
    { label: "Subscriptions", path: "/subscriptions", roles: ['Admin'] },
    { label: "Document Test", path: "/document-test", roles: ['Admin'] },
    // Reports (Admin, Accountant)
    { label: "📊 General Ledger", path: "/reports/ledger", roles: ['Admin', 'Accountant'] },
    { label: "📋 Trial Balance", path: "/reports/trial-balance", roles: ['Admin', 'Accountant'] },
    { label: "💼 Financial Summary", path: "/reports/summary", roles: ['Admin', 'Accountant', 'User'] }
  ];

  // Filter menu items based on user role
  const visibleMenuItems = allMenuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="w-64 bg-blue-900 text-white min-h-screen p-4 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold">ErpBuddy</h1>
        <p className="text-xs text-blue-200 mt-1">Role: <span className="font-semibold">{userRole}</span></p>
      </div>

      <nav className="flex flex-col space-y-2">
        {visibleMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-2 py-1 rounded hover:bg-blue-700 transition text-sm ${isActive(
              item.path
            )}`}
            title={`Access: ${item.roles.join(', ')}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Role Info Footer */}
      <div className="mt-8 pt-4 border-t border-blue-700">
        <p className="text-xs text-blue-200">
          {userRole === 'Admin' && '👑 Administrator - Full system access'}
          {userRole === 'Accountant' && '📊 Accountant - Reports & Accounting'}
          {userRole === 'User' && '👤 User - Limited access'}
        </p>
      </div>
    </div>
  );
}