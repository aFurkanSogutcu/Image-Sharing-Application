import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

import Grid from "@mui/material/Grid"; // v7 Grid (v2 API)
import {
    Container,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    Box,
    Stack,
    Button,
    Alert,
    CircularProgress,
    Skeleton,
    Avatar,
    Divider,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

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
                `/users/${userId}/images?limit=20&offset=${initial ? 0 : nextOffset}`
            );
            if (initial) setItems(resp.items);
            else setItems((prev) => [...prev, ...resp.items]);
            setOwner(resp.owner);
            setNextOffset(resp.page.next_offset ?? null);
        } catch (e: any) {
            setErr(e?.message || "Profil yüklenemedi");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setNextOffset(0);
        load(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const isInitialLoading = loading && items.length === 0;
    const initials =
        (owner?.username?.[0] || (userId ? String(userId)[0] : "?")).toUpperCase();

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* Başlık / kullanıcı kartı */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                        <Avatar sx={{ width: 56, height: 56, fontWeight: 700 }}>{initials}</Avatar>
                        <Stack spacing={0.4}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <PersonOutlineIcon fontSize="small" />
                                <Typography variant="h6" fontWeight={800}>
                                    Kullanıcı: @{owner?.username || userId}
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Toplam görsel: <b>{items.length}</b>
                            </Typography>
                        </Stack>
                    </Stack>
                </CardContent>
                <Divider />
            </Card>

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
                <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
                    Bu kullanıcının henüz resmi yok.
                </Typography>
            )}

            {/* Görsel ızgarası */}
            <Grid container spacing={2}>
                {isInitialLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Card>
                                <Skeleton variant="rectangular" sx={{ aspectRatio: "4 / 3" }} />
                                <CardContent>
                                    <Skeleton width="75%" />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                    : items.map((img) => (
                        <Grid key={img.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Card>
                                <CardActionArea>
                                    <Box
                                        component="img"
                                        src={img.url}
                                        alt={img.description}
                                        loading="lazy"
                                        sx={{
                                            width: "100%",
                                            aspectRatio: "4 / 3",
                                            objectFit: "cover",
                                            display: "block",
                                            bgcolor: "action.hover",
                                        }}
                                    />
                                    <CardContent sx={{ py: 1.5 }}>
                                        <Typography
                                            variant="body2"
                                            color={img.description ? "text.primary" : "text.secondary"}
                                            noWrap
                                            title={img.description || "Açıklama yok"}
                                        >
                                            {img.description || "Açıklama yok"}
                                        </Typography>
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
                        <Typography variant="body2" color="text.secondary">
                            Yükleniyor…
                        </Typography>
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}
