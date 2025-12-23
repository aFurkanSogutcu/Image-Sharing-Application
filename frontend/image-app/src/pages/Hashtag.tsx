import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { PostItem } from "../types/post";
import { PostCard } from "../components/PostCard";

export default function HashtagPage() {
  const { tag } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  const [items, setItems] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!tag) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp = await apiFetch<{ items: PostItem[] }>(
          `/hashtags/${encodeURIComponent(tag)}/posts?limit=20&offset=0`,
          undefined,
          token
        );
        setItems(Array.isArray(resp.items) ? resp.items : []);
      } catch (e: any) {
        setErr(e?.message || "Hashtag postları alınamadı");
      } finally {
        setLoading(false);
      }
    })();
  }, [tag, token]);

  const title = `#${tag || ""}`;

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
      <Container maxWidth="lg">
        <Box sx={{ maxWidth: 720, mx: "auto" }}>
          {/* Top bar */}
          <Box
            sx={{
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,.10)",
              backgroundColor: "rgba(255,255,255,.05)",
              backdropFilter: "blur(12px)",
              px: 1.2,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
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

              <Stack spacing={0}>
                <Typography sx={{ fontWeight: 950, color: "rgba(255,255,255,.92)" }}>
                  {title}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,.55)" }}>
                  Bu etikete ait gönderiler
                </Typography>
              </Stack>
            </Stack>

            <Chip
              label={`${items.length} gönderi`}
              size="small"
              sx={{
                color: "rgba(255,255,255,.85)",
                backgroundColor: "rgba(99,102,241,.14)",
                border: "1px solid rgba(99,102,241,.25)",
                fontWeight: 800,
              }}
            />
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,.10)" }} />

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
            <Stack alignItems="center" spacing={1} sx={{ py: 6, color: "rgba(255,255,255,.65)" }}>
              <Typography sx={{ fontWeight: 900 }}>Bu etikette henüz gönderi yok.</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,.55)" }}>
                İlk paylaşımı sen yapabilirsin.
              </Typography>
            </Stack>
          )}

          <Stack spacing={1.5}>
            {items.map((it) => (
              <PostCard
                key={it.id}
                post={it}
                onOpen={() =>
                  nav(`/post/${it.id}`, {
                    state: { backgroundLocation: location },
                  })
                }
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
