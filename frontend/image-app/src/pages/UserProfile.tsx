import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { PostItem } from "../types/post";
import { PostCard } from "../components/PostCard";

import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type UserInfo = { id: number; username: string; first_name?: string; last_name?: string };

export default function UserProfile() {
  const { id } = useParams();
  const userId = useMemo(() => Number(id), [id]);

  const nav = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  const [owner, setOwner] = useState<UserInfo | null>(null);
  const [items, setItems] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  async function load() {
    if (!userId || loading) return;

    setLoading(true);
    setErr(null);

    try {
      // 1) user info (username almak için)
      const u = await apiFetch<UserInfo>(`/users/${userId}`, undefined, token);
      setOwner(u);

      // 2) posts
      const resp = await apiFetch<{ items: PostItem[] }>(`/users/${userId}/posts?limit=30&offset=0`, undefined, token);
      setItems(Array.isArray(resp.items) ? resp.items : []);
    } catch (e: any) {
      setErr(e?.message || "Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setOwner(null);
    setItems([]);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  const initials = (owner?.username?.[0] || "?").toUpperCase();

  return (
    <Box
      sx={{
        minHeight: "calc(100dvh - 64px)",
        py: { xs: 2, md: 3 },
        px: 2,
        background:
          "radial-gradient(1200px 650px at 20% 10%, rgba(99,102,241,.20), transparent 60%)," +
          "radial-gradient(900px 520px at 80% 20%, rgba(34,197,94,.14), transparent 55%)," +
          "linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)",
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ maxWidth: 760, mx: "auto" }}>
          {/* header */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <IconButton
              onClick={() => nav(-1)}
              sx={{
                color: "rgba(255,255,255,.85)",
                bgcolor: "rgba(255,255,255,.06)",
                "&:hover": { bgcolor: "rgba(255,255,255,.10)" },
              }}
              aria-label="Geri"
            >
              <ArrowBackIcon />
            </IconButton>

            <Typography variant="h5" sx={{ fontWeight: 950, color: "rgba(255,255,255,.92)" }}>
              Profil
            </Typography>
          </Stack>

          {/* user mini card */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,.10)",
              backgroundColor: "rgba(255,255,255,.06)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 20px 70px rgba(0,0,0,.35)",
            }}
          >
            <Avatar
              sx={{
                width: 54,
                height: 54,
                fontWeight: 900,
                bgcolor: "rgba(99,102,241,.35)",
                color: "rgba(255,255,255,.92)",
              }}
            >
              {initials}
            </Avatar>

            <Stack spacing={0.2}>
              <Typography sx={{ fontWeight: 950, color: "rgba(255,255,255,.92)" }}>
                @{owner?.username || "kullanıcı"}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)" }}>
                Paylaşımlar: <b style={{ color: "rgba(255,255,255,.92)" }}>{items.length}</b>
              </Typography>
            </Stack>
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 3,
                backgroundColor: "rgba(239,68,68,.12)",
                color: "rgba(255,255,255,.92)",
                border: "1px solid rgba(239,68,68,.35)",
                "& .MuiAlert-icon": { color: "rgba(239,68,68,.95)" },
              }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={load}
                  sx={{ textTransform: "none", fontWeight: 900 }}
                >
                  Tekrar dene
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {loading && (
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ py: 3 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,.70)" }}>
                Yükleniyor…
              </Typography>
            </Stack>
          )}

          {!loading && !error && items.length === 0 && (
            <Typography sx={{ py: 6, textAlign: "center", color: "rgba(255,255,255,.65)" }}>
              Bu kullanıcının henüz paylaşımı yok.
            </Typography>
          )}

          {/* posts */}
          <Stack spacing={0} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,.10)" }}>
            {items.map((it) => (
              <PostCard
                key={it.id}
                post={it}
                onOpen={() => nav(`/post/${it.id}`, { state: { backgroundLocation: location } })}
                onOwnerClick={() => nav(`/user/${it.owner.id}`)}
                onHashtagClick={(t) => nav(`/tag/${encodeURIComponent(t.replace("#", ""))}`)}
              />
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
