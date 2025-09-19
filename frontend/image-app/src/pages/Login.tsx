import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [submitting, setSub] = useState(false);
    const [error, setErr] = useState<string | null>(null);
    const nav = useNavigate();
    const loc = useLocation();
    const next = new URLSearchParams(loc.search).get("next") || "/";

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        setSub(true);
        try {
            await login(username.trim(), password);
            nav(next);
        } catch (err: any) {
            setErr(err?.message || "Giriş başarısız");
        } finally {
            setSub(false);
        }
    }

    return (
        <div style={{ maxWidth: 360, margin: "32px auto" }}>
            <h2>Giriş</h2>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
                <input placeholder="Kullanıcı adı" value={username} onChange={e => setU(e.target.value)} required />
                <input placeholder="Şifre" type="password" value={password} onChange={e => setP(e.target.value)} required />
                {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}
                <button disabled={submitting} style={{ padding: "8px 10px" }}>
                    {submitting ? "Gönderiliyor…" : "Giriş"}
                </button>
            </form>
            <p style={{ marginTop: 8, fontSize: 13 }}>
                Hesabın yok mu? <Link to="/register">Kayıt ol</Link>
            </p>
        </div>
    );
}
