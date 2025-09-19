import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

type ImageItem = {
    id: number;
    url: string;
    description: string;
    created_at: string;
    content_type?: string;
    size_bytes?: number | null;
};

type MeResponse = {
    owner: {
        id: number;
        username: string;
        first_name?: string;
        last_name?: string;
        email?: string;
    };
    items: ImageItem[];
    page: {
        limit: number;
        offset: number;
        returned: number;
        total: number;
        has_more: boolean;
        next_offset: number | null;
    };
};

export default function MyProfile() {
    const { token, user } = useAuth();
    const [info, setInfo] = useState<MeResponse["owner"] | null>(null);
    const [items, setItems] = useState<ImageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setErr] = useState<string | null>(null);
    const [nextOffset, setNextOffset] = useState<number | null>(0);

    async function load(initial = false) {
        if (!token || loading || nextOffset === null) return;
        setLoading(true);
        setErr(null);
        try {
            const resp = await apiFetch<MeResponse>(
                `/me?limit=20&offset=${initial ? 0 : nextOffset}`,
                {},
                token
            );
            if (initial) setItems(resp.items);
            else setItems(prev => [...prev, ...resp.items]);
            setInfo(resp.owner);
            setNextOffset(resp.page.next_offset ?? null);
        } catch (e: any) {
            setErr(e?.message || "Profil alınamadı");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(true); /* eslint-disable-next-line */ }, [token]);

    async function onDelete(id: number) {
        if (!token) return;
        const ok = window.confirm("Bu resmi silmek istediğine emin misin?");
        if (!ok) return;
        try {
            // Backend şu an DELETE /api/{image_id}
            await apiFetch<void>(`/${id}`, { method: "DELETE" }, token);
            // Optimistic remove
            setItems(prev => prev.filter(x => x.id !== id));
            // Feed tarafına haber ver (varsa listeden de düşsün)
            window.dispatchEvent(new CustomEvent("image:deleted", { detail: { id } }));
        } catch (e: any) {
            alert(e?.message || "Silme başarısız");
        }
    }

    return (
        <div style={{ padding: 16 }}>
            <h2 style={{ marginBottom: 8 }}>Profilim</h2>
            <div style={{ marginBottom: 12, opacity: 0.9 }}>
                <div><b>Kullanıcı:</b> @{info?.username || user?.username}</div>
                {info?.email && <div><b>E-posta:</b> {info.email}</div>}
            </div>

            {error && (
                <div style={{ color: "crimson", marginBottom: 12 }}>
                    {error} <button onClick={() => load(true)}>Tekrar dene</button>
                </div>
            )}

            {items.length === 0 && !loading && !error && (
                <div style={{ opacity: 0.7 }}>Henüz yüklediğin bir resim yok.</div>
            )}

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                {items.map(img => (
                    <div key={img.id} style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden", background: "#fff", position: "relative" }}>
                        {/* Sil butonu */}
                        <button
                            onClick={() => onDelete(img.id)}
                            title="Sil"
                            style={{
                                position: "absolute", top: 8, right: 8, zIndex: 2,
                                border: "1px solid #ddd", background: "#fff", borderRadius: 8, padding: "4px 8px", cursor: "pointer"
                            }}
                        >
                            Sil
                        </button>

                        <div style={{ position: "relative", aspectRatio: "4/3", background: "#f4f4f4" }}>
                            <img src={img.url} alt={img.description} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                        </div>
                        <div style={{ padding: 10, fontSize: 14 }}>
                            {img.description || <span style={{ opacity: 0.6 }}>Açıklama yok</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 16 }}>
                {nextOffset !== null && !loading && <button onClick={() => load(false)}>Daha Fazla</button>}
                {loading && <span style={{ marginLeft: 8, opacity: 0.7 }}>Yükleniyor…</span>}
            </div>
        </div>
    );
}
