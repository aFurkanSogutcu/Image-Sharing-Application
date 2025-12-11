import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import MyProfile from "./pages/MyProfile";
import UserProfile from "./pages/UserProfile";
import CreatePostPage from "./pages/CreatePost";
import AiCreatePostPage from "./pages/AiCreatePost";

function Protected({ children }: { children: React.JSX.Element }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Yükleniyor…</div>;
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreatePostPage />} />
        <Route path="/ai/create" element={<AiCreatePostPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Benim profilim (korumalı) */}
        <Route
          path="/profile"
          element={
            <Protected>
              <MyProfile />
            </Protected>
          }
        />
        {/* Başkasının profili (public) */}
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
