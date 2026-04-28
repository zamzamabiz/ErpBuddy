import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import DocumentTest from "./pages/DocumentTest";
import Journal from "./pages/Journal";
import JournalDetail from "./pages/JournalDetail";
import Payments from "./pages/Payments";
import Invoice from "./pages/Invoice";
import SalesInvoiceForm from "./pages/SalesInvoiceForm";
import Purchase from "./pages/Purchase";
import Sales from "./pages/Sales";

// Modules
import { AccountsPage } from "./modules/accounts";
import LedgerPage from "./modules/reports/pages/LedgerPage";
import TrialBalancePage from "./modules/reports/pages/TrialBalancePage";
import SummaryPage from "./modules/reports/pages/SummaryPage";

// Rice Trading Module
import RiceLayout from "./modules/rice/RiceLayout";
import RiceLotsList from "./modules/rice/RiceLotsList";
import NewLotForm from "./modules/rice/NewLotForm";
import SellLot from "./modules/rice/SellLot";
import RiceReports from "./modules/rice/RiceReports";

// 🔐 Protected Route - Simple token check (no hooks to prevent loops)
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC ROUTE */}
        <Route path="/login" element={<Login />} />

        {/* PROTECTED ROUTES WITH LAYOUT */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Core Pages */}
          <Route path="document-test" element={<DocumentTest />} />
          <Route path="accounts" element={<AccountsPage />} />

          {/* Journal */}
          <Route path="journal" element={<Journal />} />
          <Route path="journal/:id" element={<JournalDetail />} />

          {/* Finance */}
          <Route path="payments" element={<Payments />} />
          <Route path="invoice/:id" element={<Invoice />} />

          {/* Sales */}
          <Route path="sales" element={<Sales />} />
          <Route path="sales/new" element={<SalesInvoiceForm />} />

          {/* Purchase */}
          <Route path="purchase" element={<Purchase />} />

          {/* Reports */}
          <Route path="reports/ledger" element={<LedgerPage />} />
          <Route path="reports/trial-balance" element={<TrialBalancePage />} />
          <Route path="reports/summary" element={<SummaryPage />} />

          {/* Admin (placeholders) */}
          <Route path="tenants" element={<div className="p-8">Tenants Page</div>} />
          <Route path="companies" element={<div className="p-8">Companies Page</div>} />
          <Route path="branches" element={<div className="p-8">Branches Page</div>} />
          <Route path="users" element={<div className="p-8">Users Page</div>} />
          <Route path="plans" element={<div className="p-8">Subscription Plans Page</div>} />
          <Route path="subscriptions" element={<div className="p-8">Subscriptions Page</div>} />
        </Route>

        {/* RICE TRADING MODULE */}
        <Route
          path="/rice"
          element={
            <ProtectedRoute>
              <RiceLayout />
            </ProtectedRoute>
          }
        >
          <Route path="lots" element={<RiceLotsList />} />
          <Route path="lots/new" element={<NewLotForm />} />
          <Route path="lots/:id" element={<RiceLotsList />} />
          <Route path="sell/:id" element={<SellLot />} />
          <Route path="inventory" element={<RiceLotsList />} />
          <Route path="sales" element={<SellLot />} />
          <Route path="reports" element={<RiceReports />} />
        </Route>

        {/* FALLBACK ROUTE - Redirect to login if not authenticated, otherwise dashboard */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;