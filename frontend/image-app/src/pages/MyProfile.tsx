import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

import Grid from "@mui/material/Grid"; // MUI v7: Grid v2 (item yok, size kullan)
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
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

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

    // silme onayı
    const [confirmId, setConfirmId] = useState<number | null>(null);
    const openConfirm = (id: number) => setConfirmId(id);
    const closeConfirm = () => setConfirmId(null);

    const initials = useMemo(() => {
        const fn = info?.first_name?.trim() || "";
        const ln = info?.last_name?.trim() || "";
        const un = info?.username?.trim() || user?.username || "";
        const take = (s: string) => (s ? s[0] : "");
        const res = (take(fn) + take(ln)) || take(un);
        return res.toUpperCase();
    }, [info, user]);

    async function load(initial = false) {
        if (!token || loading || nextOffset === null) return;
        setLoading(true);
        setErr(null);
        try {
            const resp = await apiFetch<MeResponse>(
                `/users/me?limit=20&offset=${initial ? 0 : nextOffset}`,
                {},
                token
            );
            if (initial) setItems(resp.items);
            else setItems((prev) => [...prev, ...resp.items]);
            setInfo(resp.owner);
            setNextOffset(resp.page.next_offset ?? null);
        } catch (e: any) {
            setErr(e?.message || "Profil alınamadı");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function onDelete(id: number) {
        if (!token) return;
        try {
            await apiFetch<void>(`/images/${id}`, { method: "DELETE" }, token);
            setItems((prev) => prev.filter((x) => x.id !== id));
            window.dispatchEvent(new CustomEvent("image:deleted", { detail: { id } }));
        } catch (e: any) {
            alert(e?.message || "Silme başarısız");
        } finally {
            closeConfirm();
        }
    }

    const isInitialLoading = loading && items.length === 0;

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
                Profilim
            </Typography>

            {/* Kullanıcı kartı */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                        <Avatar sx={{ width: 56, height: 56, fontWeight: 700 }}>{initials}</Avatar>
                        <Stack spacing={0.2}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <PersonOutlineIcon fontSize="small" />
                                <Typography variant="subtitle1" fontWeight={700}>
                                    @{info?.username || user?.username}
                                </Typography>
                            </Stack>
                            {info?.email && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <EmailOutlinedIcon fontSize="small" />
                                    <Typography variant="body2" color="text.secondary">
                                        {info.email}
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>
                    </Stack>
                </CardContent>
                <Divider />
                <CardContent sx={{ pt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Toplam görsel: <b>{items.length}</b>
                    </Typography>
                </CardContent>
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
                    Henüz yüklediğin bir resim yok.
                </Typography>
            )}

            {/* Görseller */}
            <Grid container spacing={2}>
                {isInitialLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Card>
                                <Skeleton variant="rectangular" sx={{ aspectRatio: "4 / 3" }} />
                                <CardContent>
                                    <Skeleton width="70%" />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                    : items.map((img) => (
                        <Grid key={img.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Card sx={{ position: "relative", overflow: "hidden" }}>
                                {/* Sil butonu (overlay) */}
                                <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
                                    <Tooltip title="Sil" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openConfirm(img.id);
                                            }}
                                            sx={{
                                                bgcolor: "background.paper",
                                                border: 1,
                                                borderColor: "divider",
                                                "&:hover": { bgcolor: "background.default" },
                                            }}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                <CardActionArea disableRipple>
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

            {/* Silme onay diyaloğu */}
            <Dialog open={confirmId !== null} onClose={closeConfirm} maxWidth="xs" fullWidth>
                <DialogTitle>Görseli sil</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Bu görseli silmek istediğine emin misin? Bu işlem geri alınamaz.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeConfirm} variant="text">
                        Vazgeç
                    </Button>
                    <Button
                        onClick={() => onDelete(confirmId!)}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                    >
                        Sil
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
