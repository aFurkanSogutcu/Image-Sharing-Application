import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type ImageItem = {
    id: number;
    url: string;
    description: string;
    created_at: string;
    content_type?: string;
    size_bytes?: number | null;
};

type UserImagesResponse = {
    owner: { id: number; username: string };
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

export default function UserProfile() {
    const params = useParams();
    const userId = Number(params.id);
    const [owner, setOwner] = useState<UserImagesResponse["owner"] | null>(null);
    const [items, setItems] = useState<ImageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setErr] = useState<string | null>(null);
    const [nextOffset, setNextOffset] = useState<number | null>(0);

    async function load(initial = false) {
        if (loading || nextOffset === null || !userId) return;
        setLoading(true);
        setErr(null);
        try {
            const resp = await apiFetch<UserImagesResponse>(
                `/images/${userId}?limit=20&offset=${initial ? 0 : nextOffset}`
            );
            if (initial) setItems(resp.items);
            else setItems(prev => [...prev, ...resp.items]);
            setOwner(resp.owner);
            setNextOffset(resp.page.next_offset ?? null);
        } catch (e: any) {
            setErr(e?.message || "Profil yüklenemedi");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { setNextOffset(0); load(true); /* eslint-disable-next-line */ }, [userId]);

    return (
        <div style={{ padding: 16 }}>
            <h2 style={{ marginBottom: 8 }}>Kullanıcı: @{owner?.username || userId}</h2>

            {error && (
                <div style={{ color: "crimson", marginBottom: 12 }}>
                    {error} <button onClick={() => load(true)}>Tekrar dene</button>
                </div>
            )}

            {items.length === 0 && !loading && !error && (
                <div style={{ opacity: 0.7 }}>Bu kullanıcının henüz resmi yok.</div>
            )}

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                {items.map(img => (
                    <div key={img.id} style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                        <div style={{ position: "relative", aspectRatio: "4/3", background: "#f4f4f4" }}>
                            <img src={img.url} alt={img.description} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                        </div>
                        <div style={{ padding: 10, fontSize: 14 }}>{img.description || <span style={{ opacity: 0.6 }}>Açıklama yok</span>}</div>
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
