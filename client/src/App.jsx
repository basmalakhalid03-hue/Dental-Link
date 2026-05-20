import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import CreateCase from './pages/CreateCase';
import Team from './pages/Team';
import AdminUsers from './pages/AdminUsers';
import DeliveryDashboard from './pages/DeliveryDashboard';
import WorkflowTemplates from './pages/WorkflowTemplates';
import Profile from './pages/Profile';
import CrownTypes from './pages/CrownTypes';

// "/" → landing for guests, /dashboard redirect for logged-in users
const LandingRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

// Protected pages: redirect to /login if not authenticated
const ProtectedRoute = ({ children, adminOnly = false, roles = null }) => {
  const { user, isAdmin, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Auth pages: redirect to /dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* Landing — smart: guest = landing, logged-in = /dashboard */}
        <Route path="/" element={<LandingRoute />} />

        {/* Auth */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected app — pathless layout route so sub-paths stay absolute */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/cases"      element={<Cases />} />
          <Route path="/cases/new"  element={<ProtectedRoute roles={['ADMIN','TECHNICIAN','DOCTOR']}><CreateCase /></ProtectedRoute>} />
          <Route path="/cases/:id"  element={<CaseDetail />} />
          <Route path="/team"       element={<ProtectedRoute adminOnly={true}><Team /></ProtectedRoute>} />
          <Route path="/admin/users"     element={<ProtectedRoute adminOnly={true}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/workflow"     element={<ProtectedRoute adminOnly={true}><WorkflowTemplates /></ProtectedRoute>} />
          <Route path="/admin/crown-types" element={<ProtectedRoute adminOnly={true}><CrownTypes /></ProtectedRoute>} />
          <Route path="/delivery"   element={<ProtectedRoute roles={['ADMIN','DELIVERY_AGENT']}><DeliveryDashboard /></ProtectedRoute>} />
          <Route path="/profile"    element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
