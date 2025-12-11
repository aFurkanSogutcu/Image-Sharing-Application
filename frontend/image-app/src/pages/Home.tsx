// src/pages/Home.tsx

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useNavigate } from "react-router-dom";

import {
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

  // Basit local like toggle (backend bağlayana kadar)
  function toggleLikeLocally(postId: number) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              like_count: (p.like_count ?? 0) + (p.liked_by_me ? -1 : 1),
            }
          : p
      )
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 2, borderLeft: 1, borderRight: 1, borderColor: "divider", minHeight: "100vh" }}>
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ mb: 1.5, px: 2, pt: 1, pb: 1, position: "sticky", top: 0, bgcolor: "background.default", zIndex: 10 }}
      >
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

      {/* Post listesi */}
      <Stack spacing={0}>
        {safeItems.map((it) => (
          <PostCard
            key={it.id}
            post={it}
            onOpen={() => nav(`/post/${it.id}`)}
            onOwnerClick={() => nav(`/user/${it.owner.id}`)}
            onLike={() => toggleLikeLocally(it.id)}
            onComment={() => nav(`/post/${it.id}#comments`)}
          />
        ))}
      </Stack>
    </Container>
  );
}
