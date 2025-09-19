import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({
        username: "", email: "", first_name: "", last_name: "", password: ""
    });
    const [submitting, setSub] = useState(false);
    const [error, setErr] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    function set<K extends keyof typeof form>(k: K, v: string) {
        setForm(s => ({ ...s, [k]: v }));
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setErr(null); setOk(null);
        setSub(true);
        try {
            await register(form);
            setOk("Hesap oluşturuldu, şimdi giriş yapın.");
            setTimeout(() => nav("/login"), 800);
        } catch (err: any) {
            setErr(err?.message || "Kayıt başarısız");
        } finally {
            setSub(false);
        }
    }

    return (
        <div style={{ maxWidth: 420, margin: "32px auto" }}>
            <h2>Kayıt</h2>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
                <input placeholder="Kullanıcı adı" value={form.username} onChange={e => set("username", e.target.value)} required />
                <input placeholder="E-posta" value={form.email} onChange={e => set("email", e.target.value)} required />
                <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="Ad" value={form.first_name} onChange={e => set("first_name", e.target.value)} required style={{ flex: 1 }} />
                    <input placeholder="Soyad" value={form.last_name} onChange={e => set("last_name", e.target.value)} required style={{ flex: 1 }} />
                </div>
                <input placeholder="Şifre" type="password" value={form.password} onChange={e => set("password", e.target.value)} required />
                {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}
                {ok && <div style={{ color: "green", fontSize: 13 }}>{ok}</div>}
                <button disabled={submitting} style={{ padding: "8px 10px" }}>
                    {submitting ? "Gönderiliyor…" : "Kayıt Ol"}
                </button>
            </form>
            <p style={{ marginTop: 8, fontSize: 13 }}>
                Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
            </p>
        </div>
    );
}
