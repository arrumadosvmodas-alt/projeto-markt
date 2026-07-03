import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import History from "./pages/History";
import PurchaseDetail from "./pages/PurchaseDetail";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Calendar } from "./pages/Calendar";
import "./styles/design-system.css";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />

        {/* Calendário */}
        <Route
          path="/calendario"
          element={
            <ProtectedRoute>
              <Layout>
                <Calendar />
              </Layout>
            </ProtectedRoute>
          }
        />

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
            <ProtectedRoute>
              <Layout>
                <Profile />
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
