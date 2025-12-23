import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Container, Typography, Stack, CircularProgress, Alert } from "@mui/material";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { PostItem } from "../types/post";
import { PostCard } from "../components/PostCard";

export default function HashtagPage() {
  const { tag } = useParams();
  const nav = useNavigate();
  const location = useLocation(); // ✅ eklendi
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

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        #{tag}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {loading && (
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ py: 3 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Yükleniyor…</Typography>
        </Stack>
      )}

      <Stack spacing={0}>
        {items.map((it) => (
          <PostCard
            key={it.id}
            post={it}
            onOpen={() =>
              nav(`/post/${it.id}`, {
                state: { backgroundLocation: location }, // ✅ modal için kritik
              })
            }
            onOwnerClick={() => nav(`/user/${it.owner.id}`)}
            onHashtagClick={(t) => nav(`/tag/${encodeURIComponent(t.replace("#", ""))}`)}
          />
        ))}
      </Stack>
    </Container>
  );
}
