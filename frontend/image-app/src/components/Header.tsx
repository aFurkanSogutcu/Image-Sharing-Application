import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import UploadModal from "./UploadModal";

export default function Header() {
    const { user, loading, logout } = useAuth();
    const nav = useNavigate();
    const [open, setOpen] = useState(false);

    return (
        <>
            <header style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "#fff", zIndex: 10
            }}>
                <Link to="/" style={{ textDecoration: "none", fontWeight: 700 }}>ImageApp</Link>

                {loading ? (
                    <span style={{ fontSize: 12, opacity: 0.7 }}>yükleniyor…</span>
                ) : user ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                            onClick={() => setOpen(true)}
                            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fafafa", cursor: "pointer" }}
                        >
                            Yükle
                        </button>
                        <Link to="/profile" style={{ textDecoration: "none" }}>
                            @{user.username}
                        </Link>
                        <button
                            onClick={() => { logout(); nav("/login"); }}
                            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
                        >
                            Çıkış
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                        <Link to="/login">Giriş</Link>
                        <Link to="/register">Kayıt</Link>
                    </div>
                )}
            </header>

            {/* Upload modal */}
            <UploadModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
