import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useNavigate } from "react-router-dom";

import Grid from "@mui/material/Grid";
import {
    Container, Typography, Card, CardActionArea, CardContent,
    Box, Stack, Button, Alert, CircularProgress, Skeleton
} from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

type PostOwner = {
    id: number;
    username: string;
};

type PostItem = {
    id: number;
    content: string;
    created_at: string;
    owner: PostOwner;
};

type PostsFeedResponse = {
    items?: PostItem[];
};

export default function Home() {
    const nav = useNavigate();

    const [posts, setPosts] = useState<PostItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setErr] = useState<string | null>(null);

    async function load(initial = false) {
        if (loading) return;

        setLoading(true);
        setErr(null);

        try {
            const resp = await apiFetch<PostsFeedResponse>(
                `/posts/feed?limit=20&offset=0`
            );
            const newItems: PostItem[] = Array.isArray(resp.items) ? resp.items : [];
            setPosts(newItems);
        } catch (e: any) {
            setErr(e?.message || "Liste alınamadı");
        } finally {
            setLoading(false);
        }
    }

    // İlk yük
    useEffect(() => {
        load(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const safeItems: PostItem[] = Array.isArray(posts) ? posts : [];
    const isInitialLoading = loading && safeItems.length === 0;

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

            {!isInitialLoading && safeItems.length === 0 && !error && (
                <Stack
                    alignItems="center"
                    spacing={1.5}
                    sx={{ color: "text.secondary", py: 6 }}
                >
                    <ImageOutlinedIcon />
                    <Typography>Henüz gönderi yok.</Typography>
                </Stack>
            )}

            {isInitialLoading && (
                <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{ py: 4 }}
                >
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                    Yükleniyor…
                </Typography>
                </Stack>
            )}

                  {/* Post listesi */}
            <Stack spacing={2}>
                {safeItems.map((it) => (
                <Card
                    key={it.id}
                    sx={{ cursor: "pointer" }}
                    onClick={() => nav(`/post/${it.id}`)} // ileride detay sayfası yaparsan çalışır
                >
                    <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Button
                        size="small"
                        variant="text"
                        sx={{ p: 0, minWidth: 0, fontSize: 13, textTransform: "none" }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            nav(`/user/${it.owner.id}`);
                        }}
                        >
                        @{it.owner.username}
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                        {new Date(it.created_at).toLocaleString()}
                        </Typography>
                    </Stack>

                    <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                        {it.content}
                    </Typography>
                    </CardContent>
                </Card>
                ))}
            </Stack>
        </Container>
  );
}