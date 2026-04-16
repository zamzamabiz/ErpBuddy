import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import DocumentTest from "./pages/DocumentTest";
import { AccountsPage } from "./modules/accounts";
import Journal from "./pages/Journal";
import JournalDetail from "./pages/JournalDetail";
import Payments from "./pages/Payments";
import Invoice from "./pages/Invoice";
import SalesInvoiceForm from "./pages/SalesInvoiceForm";
import Purchase from "./pages/Purchase";
import Sales from "./pages/Sales";
import LedgerPage from "./modules/reports/pages/LedgerPage";
import TrialBalancePage from "./modules/reports/pages/TrialBalancePage";
import SummaryPage from "./modules/reports/pages/SummaryPage";

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  
  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  // Check for valid token on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // If on a protected route without token, redirect to login
    if (!token && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/document-test" element={<ProtectedRoute><DocumentTest /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
        <Route path="/journal/:id" element={<ProtectedRoute><JournalDetail /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/sales/new" element={<ProtectedRoute><SalesInvoiceForm /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
        <Route path="/invoice/:id" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
        <Route path="/purchase" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="tenants" element={<div className='p-8'>Tenants Page</div>} />
          <Route path="companies" element={<div className='p-8'>Companies Page</div>} />
          <Route path="branches" element={<div className='p-8'>Branches Page</div>} />
          <Route path="users" element={<div className='p-8'>Users Page</div>} />
          <Route path="plans" element={<div className='p-8'>Subscription Plans Page</div>} />
          <Route path="subscriptions" element={<div className='p-8'>Subscriptions Page</div>} />
          <Route path="reports/ledger" element={<LedgerPage />} />
          <Route path="reports/trial-balance" element={<TrialBalancePage />} />
          <Route path="reports/summary" element={<SummaryPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
