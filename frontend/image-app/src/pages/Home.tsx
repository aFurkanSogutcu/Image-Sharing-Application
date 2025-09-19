import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useNavigate } from "react-router-dom";

type FeedItem = {
    id: number;
    url: string;               // "/media/..."
    description: string;
    created_at: string;
    content_type?: string;
    size_bytes?: number | null;
    owner?: { id: number; username: string } | null;
};

type FeedResponse = {
    items: FeedItem[];
    page: {
        limit: number;
        offset: number;
        returned: number;
        total: number;
        has_more: boolean;
        next_offset: number | null;
    };
};

export default function Home() {
    const nav = useNavigate();
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setErr] = useState<string | null>(null);
    const [nextOffset, setNextOffset] = useState<number | null>(0);

    async function load(initial = false) {
        if (loading || nextOffset === null) return;
        setLoading(true);
        setErr(null);
        try {
            const resp = await apiFetch<FeedResponse>(`/images/feed?limit=20&offset=${initial ? 0 : nextOffset}`);
            if (initial) {
                setItems(resp.items);
            } else {
                setItems(prev => [...prev, ...resp.items]);
            }
            setNextOffset(resp.page.next_offset ?? null);
        } catch (e: any) {
            setErr(e?.message || "Liste alınamadı");
        } finally {
            setLoading(false);
        }
    }

    // İlk yük
    useEffect(() => { load(true); /* eslint-disable-next-line */ }, []);

    // Upload sonrası feed’i sıfırdan tazele
    useEffect(() => {
        function onUploaded() { setNextOffset(0); load(true); }
        window.addEventListener("image:uploaded", onUploaded as EventListener);
        return () => window.removeEventListener("image:uploaded", onUploaded as EventListener);
        // eslint-disable-next-line
    }, []);

    // silme
    useEffect(() => {
        function onDeleted(e: Event) {
            const ce = e as CustomEvent<{ id: number }>;
            const id = ce.detail?.id;
            if (typeof id === "number") {
                setItems(prev => prev.filter(it => it.id !== id));
            }
        }
        window.addEventListener("image:deleted", onDeleted as EventListener);
        return () => window.removeEventListener("image:deleted", onDeleted as EventListener);
    }, []);

    return (
        <div style={{ padding: 16 }}>
            <h2 style={{ marginBottom: 12 }}>Anasayfa</h2>

            {error && (
                <div style={{ color: "crimson", marginBottom: 12 }}>
                    {error} <button onClick={() => load(true)}>Tekrar dene</button>
                </div>
            )}

            {items.length === 0 && !loading && !error && (
                <div style={{ opacity: 0.7 }}>Henüz resim yok.</div>
            )}

            <div
                style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                }}
            >
                {items.map((it) => (
                    <div key={it.id}
                        style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                        <div style={{ position: "relative", aspectRatio: "4/3", background: "#f4f4f4" }}
                            onClick={() => nav(`/images/${it.id}`)}>
                            <img
                                src={it.url}
                                alt={it.description}
                                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                                loading="lazy"
                            />
                        </div>
                        <div style={{ padding: 10, display: "grid", gap: 6 }}>
                            <div style={{ fontSize: 14 }}>{it.description || <span style={{ opacity: 0.6 }}>Açıklama yok</span>}</div>
                            {it.owner && (
                                <div style={{ fontSize: 13, opacity: 0.8 }}>
                                    <span>Yükleyen: </span>
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); nav(`/user/${it.owner!.id}`); }}
                                        style={{ textDecoration: "none" }}
                                    >
                                        @{it.owner.username}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 16 }}>
                {nextOffset !== null && !loading && (
                    <button onClick={() => load(false)} style={{ padding: "8px 12px" }}>Daha Fazla</button>
                )}
                {loading && <span style={{ marginLeft: 8, opacity: 0.7 }}>Yükleniyor…</span>}
            </div>
        </div>
    );
}
