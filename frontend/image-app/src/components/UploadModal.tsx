import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function UploadModal({ open, onClose }: Props) {
    const { token } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [desc, setDesc] = useState("");
    const [submitting, setSub] = useState(false);
    const [error, setErr] = useState<string | null>(null);

    if (!open) return null;

    function onFile(e: ChangeEvent<HTMLInputElement>) {
        setErr(null);
        const f = e.target.files?.[0] || null;
        setFile(f);
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        if (!token) { setErr("Giriş yapmalısın."); return; }
        if (!file) { setErr("Bir görsel seç."); return; }
        if (!file.type.startsWith("image/")) { setErr("Sadece görsel yükleyebilirsin."); return; }
        if (file.size > 20 * 1024 * 1024) { setErr("Dosya 20MB sınırını aşıyor."); return; }

        setSub(true);
        try {
            const form = new FormData();
            form.append("description", desc);
            form.append("file", file);
            // DİKKAT: multipart'ta Content-Type başlığını elle set etme; tarayıcı boundary'yi ekler.
            await apiFetch<void>("/image", { method: "POST", body: form }, token);
            // Başarılı → feed'e haber ver
            window.dispatchEvent(new CustomEvent("image:uploaded"));
            onClose();
            // formu sıfırla
            setFile(null); setDesc("");
        } catch (e: any) {
            setErr(e?.message || "Yükleme başarısız");
        } finally {
            setSub(false);
        }
    }

    return (
        <div
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
                display: "grid", placeItems: "center", zIndex: 50
            }}
            onClick={onClose}
        >
            <div
                style={{ background: "#fff", padding: 16, borderRadius: 10, width: "min(92vw, 420px)" }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ marginTop: 0 }}>Görsel Yükle</h3>
                <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
                    <input
                        type="file" accept="image/*" onChange={onFile}
                    />
                    <input
                        placeholder="Açıklama (opsiyonel)"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                    />
                    {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose} disabled={submitting}>Vazgeç</button>
                        <button type="submit" disabled={submitting || !file}>
                            {submitting ? "Yükleniyor…" : "Yükle"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
