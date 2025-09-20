import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useNavigate } from "react-router-dom";

import Grid from "@mui/material/Grid";
import {
    Container, Typography, Card, CardActionArea, CardContent,
    Box, Stack, Button, Alert, CircularProgress, Skeleton
} from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

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

    // Upload sonrası feed’i sıfırla
    useEffect(() => {
        function onUploaded() { setNextOffset(0); load(true); }
        window.addEventListener("image:uploaded", onUploaded as EventListener);
        return () => window.removeEventListener("image:uploaded", onUploaded as EventListener);
    }, []);

    // Silme olayı
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

    const isInitialLoading = loading && items.length === 0;

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                Anasayfa
            </Typography>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    action={
                        <Button color="inherit" size="small" onClick={() => load(true)}>
                            Tekrar dene
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {!isInitialLoading && items.length === 0 && !error && (
                <Stack
                    alignItems="center"
                    spacing={1.5}
                    sx={{ color: "text.secondary", py: 6 }}
                >
                    <ImageOutlinedIcon />
                    <Typography>Henüz resim yok.</Typography>
                </Stack>
            )}

            {/* Grid */}
            <Grid container spacing={2}>
                {isInitialLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Card>
                                <Skeleton variant="rectangular" sx={{ aspectRatio: "4 / 3" }} />
                                <CardContent>
                                    <Skeleton width="80%" />
                                    <Skeleton width="40%" />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                    : items.map((it) => (
                        <Grid key={it.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Card sx={{ height: "100%" }}>
                                <CardActionArea onClick={() => nav(`/images/${it.id}`)}>
                                    <Box
                                        component="img"
                                        src={it.url}
                                        alt={it.description || "image"}
                                        loading="lazy"
                                        sx={{
                                            width: "100%",
                                            aspectRatio: "4 / 3",
                                            objectFit: "cover",
                                            display: "block",
                                            bgcolor: "action.hover",
                                        }}
                                    />
                                    <CardContent>
                                        <Stack spacing={0.5}>
                                            <Typography
                                                variant="subtitle1"
                                                noWrap
                                                color={it.description ? "text.primary" : "text.secondary"}
                                            >
                                                {it.description || "Açıklama yok"}
                                            </Typography>

                                            {it.owner && (
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Yükleyen:
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        sx={{ p: 0, minWidth: 0, fontSize: 12 }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation(); // Kartın tıklamasını tetiklemesin
                                                            nav(`/user/${it.owner!.id}`);
                                                        }}
                                                    >
                                                        @{it.owner.username}
                                                    </Button>
                                                </Stack>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
            </Grid>

            {/* Daha Fazla / Yükleniyor */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                {nextOffset !== null && !loading && items.length > 0 && (
                    <Button onClick={() => load(false)} variant="outlined">
                        Daha Fazla
                    </Button>
                )}
                {loading && items.length > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={18} />
                        <Typography variant="body2" color="text.secondary">Yükleniyor…</Typography>
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}
