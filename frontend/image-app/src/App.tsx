import { Routes, Route, Navigate, useLocation, Location } from "react-router-dom";
import Header from "./components/Header";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import MyProfile from "./pages/MyProfile";
import UserProfile from "./pages/UserProfile";
import CreatePostPage from "./pages/CreatePost";
import AiCreatePostPage from "./pages/AiCreatePost";
import HashtagPage from "./pages/Hashtag";
import PostModal from "./pages/PostModal";

function Protected({ children }: { children: React.JSX.Element }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Yükleniyor…</div>;
  return token ? children : <Navigate to="/login" replace />;
}

type LocationState = {
  backgroundLocation?: Location;
};

export default function App() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const backgroundLocation = state?.backgroundLocation;

  return (
    <>
      <Header />

      {/* ✅ Arka plan route'ları: modal açıldığında Home/Tag/User sayfası arkada kalır */}
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreatePostPage />} />
        <Route path="/ai/create" element={<AiCreatePostPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tag/:tag" element={<HashtagPage />} />

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

      {/* ✅ Modal route: sadece background varsa dialog olarak aç */}
      {backgroundLocation && (
        <Routes>
          <Route path="/post/:id" element={<PostModal />} />
        </Routes>
      )}
    </>
  );
}
