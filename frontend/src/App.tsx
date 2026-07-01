import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import History from "./pages/History";
import PurchaseDetail from "./pages/PurchaseDetail";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
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
    </Routes>
  );
}

export default App;
