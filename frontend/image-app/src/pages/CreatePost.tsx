// frontend/src/pages/CreatePost.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Container,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";

type LocationState = {
  content?: string;
  hashtags?: string[];
} | null;

export default function CreatePostPage() {
  const { token } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const prefill = (loc.state as LocationState) || null;

  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [loadingPost, setLoadingPost] = useState(false);
  const [loadingRewrite, setLoadingRewrite] = useState(false);
  const [error, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // AI wizard'dan gelen taslağı doldur
  useEffect(() => {
    if (prefill?.content) setContent(prefill.content);
    if (prefill?.hashtags) setHashtags(prefill.hashtags.join(" "));
  }, [prefill]);

  async function handlePublish() {
    setErr(null);
    setOk(null);
    setLoadingPost(true);
    try {
      const body = {
        content,
        hashtags: hashtags
          .split(" ")
          .map((h) => h.trim())
          .filter(Boolean),
        source: prefill?.content ? "ai_assist" : "user",
        generated_from_prompt: prefill?.content ? "ai_wizard" : null,
        model_name: prefill?.content ? "dummy-model" : null,
      };

      await apiFetch("/posts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }, token);

      setOk("Gönderin paylaşıldı.");
      setContent("");
      setHashtags("");
      // İstersen anasayfaya dön:
      // nav("/");
    } catch (e: any) {
      setErr(e?.message || "Gönderi paylaşılırken hata oluştu");
    } finally {
      setLoadingPost(false);
    }
  }

  async function handleRewrite() {
    if (!content.trim()) return;
    setErr(null);
    setOk(null);
    setLoadingRewrite(true);
    try {
      const resp = await apiFetch<{ rewritten_text: string }>(
        "/ai/rewrite-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: content,
            mode: "grammar",
          }),
        },
        token
      );
      setContent(resp.rewritten_text);
      setOk("Metin yapay zeka ile düzenlendi.");
    } catch (e: any) {
      setErr(e?.message || "Düzenleme sırasında hata oluştu");
    } finally {
      setLoadingRewrite(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              Yeni Gönderi
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}
            {ok && <Alert severity="success">{ok}</Alert>}

            <TextField
              label="Gönderi içeriği"
              multiline
              minRows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <TextField
              label="Hashtag'ler (boşlukla ayır)"
              placeholder="#ai #startup #product"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handlePublish}
                disabled={!content.trim() || loadingPost}
                endIcon={loadingPost ? <CircularProgress size={18} /> : undefined}
              >
                {loadingPost ? "Paylaşılıyor…" : "Paylaş"}
              </Button>

              <Button
                variant="outlined"
                onClick={handleRewrite}
                disabled={!content.trim() || loadingRewrite}
                endIcon={loadingRewrite ? <CircularProgress size={18} /> : undefined}
              >
                AI ile düzenle
              </Button>

              <Button
                variant="text"
                onClick={() => nav("/ai/create")}
              >
                AI ile üret (gelişmiş)
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
