import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import History from "./pages/History";
import PurchaseDetail from "./pages/PurchaseDetail";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import CheckoutSimulator from "./pages/CheckoutSimulator";
import PaymentCallback from "./pages/PaymentCallback";
import Wallet from "./pages/Wallet";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import "./styles/design-system.css";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />

        {/* Compras (modo individual) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/historico"
          element={
            <ProtectedRoute>
              <Layout>
                <History />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/historico/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <PurchaseDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analises"
          element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute allowExpired>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute allowExpired>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout-simulado"
          element={
            <ProtectedRoute allowExpired>
              <CheckoutSimulator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-callback"
          element={
            <ProtectedRoute allowExpired>
              <PaymentCallback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/carteira"
          element={
            <ProtectedRoute>
              <Layout>
                <Wallet />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
