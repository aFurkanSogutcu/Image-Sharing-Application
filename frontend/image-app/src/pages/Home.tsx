import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useNavigate, useLocation } from "react-router-dom";

import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import { PostCard } from "../components/PostCard";
import type { PostItem } from "../types/post";
import { useAuth } from "../context/AuthContext";

type PostsFeedResponse = {
  items?: PostItem[];
};

export default function Home() {
  const nav = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  async function load(initial = false) {
    if (loading) return;

    setLoading(true);
    setErr(null);

    try {
      const resp = await apiFetch<PostsFeedResponse>(
        `/posts/feed?limit=20&offset=0`,
        undefined,
        token
      );
      const newItems: PostItem[] = Array.isArray(resp.items) ? resp.items : [];
      setPosts(newItems);
    } catch (e: any) {
      setErr(e?.message || "Liste alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeItems: PostItem[] = Array.isArray(posts) ? posts : [];
  const isInitialLoading = loading && safeItems.length === 0;

  async function toggleLike(postId: number) {
    try {
      const resp = await apiFetch<{ post_id: number; liked: boolean; like_count: number }>(
        `/posts/${postId}/like-toggle`,
        { method: "POST" },
        token
      );

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked_by_me: resp.liked, like_count: resp.like_count }
            : p
        )
      );
    } catch (e: any) {
      setErr(e?.message || "Beğeni güncellenemedi");
    }
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100dvh - 64px)",
        py: { xs: 2, md: 3 },
        background:
          "radial-gradient(1200px 650px at 20% 10%, rgba(99,102,241,.20), transparent 60%)," +
          "radial-gradient(900px 520px at 80% 20%, rgba(34,197,94,.14), transparent 55%)," +
          "linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)",
      }}
    >
      <Container maxWidth="lg">
        {/* feed column */}
        <Box
          sx={{
            maxWidth: 720,
            mx: "auto",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,.10)",
            backgroundColor: "rgba(255,255,255,.04)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 16px 55px rgba(0,0,0,.35)",
            overflow: "hidden",
          }}
        >
          

          {/* content */}
          <Box sx={{ p: 2 }}>
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
                  <Button color="inherit" size="small" onClick={() => load(true)}>
                    Tekrar dene
                  </Button>
                }
              >
                {error}
              </Alert>
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
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)" }}>
                  Yükleniyor…
                </Typography>
              </Stack>
            )}

            {!isInitialLoading && safeItems.length === 0 && !error && (
              <Stack alignItems="center" spacing={1.5} sx={{ py: 6, color: "rgba(255,255,255,.65)" }}>
                <ImageOutlinedIcon />
                <Typography>Henüz gönderi yok.</Typography>
              </Stack>
            )}

            {/* Post list */}
            <Stack spacing={1.5}>
              {safeItems.map((it) => (
                <PostCard
                  key={it.id}
                  post={it}
                  onOpen={() =>
                    nav(`/post/${it.id}`, {
                      state: { backgroundLocation: location },
                    })
                  }
                  onOwnerClick={() => nav(`/user/${it.owner.id}`)}
                  onLike={() => toggleLike(it.id)}
                  onHashtagClick={(tag) => nav(`/tag/${encodeURIComponent(tag)}`)}
                  onComment={() =>
                    nav(`/post/${it.id}`, {
                      state: { backgroundLocation: location },
                    })
                  }
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
