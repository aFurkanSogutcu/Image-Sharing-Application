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
} | null;

function extractHashtags(text: string): string[] {
  const re = /#([0-9A-Za-z_ğüşöçıİĞÜŞÖÇ]+)/g;
  const found = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const tag = m[1].toLowerCase();
    if (tag) found.add(tag);
  }
  return Array.from(found);
}

function toHashtagField(tags: string[]): string {
  return tags.map((t) => `#${t.replace(/^#/, "")}`).join(" ");
}

export default function CreatePostPage() {
  const { token } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const prefill = (loc.state as LocationState) || null;

  const [images, setImages] = useState<File[]>([]);
  const [content, setContent] = useState("");

  const [loadingPost, setLoadingPost] = useState(false);
  const [loadingRewrite, setLoadingRewrite] = useState(false);
  const [error, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (prefill?.content) setContent(prefill.content);
  }, [prefill]);

  async function handlePublish() {
    setErr(null);
    setOk(null);
    setLoadingPost(true);

    try {
      const fd = new FormData();
      fd.append("content", content);

      // ✅ Metinden hashtag çıkar
      const tags = extractHashtags(content);
      if (tags.length > 0) {
        fd.append("hashtags", toHashtagField(tags));
      }

      fd.append("source", prefill?.content ? "ai_assist" : "user");

      if (prefill?.content) fd.append("generated_from_prompt", "ai_wizard");
      if (prefill?.content) fd.append("model_name", "dummy-model");

      images.slice(0, 4).forEach((img) => fd.append("images", img));

      await apiFetch("/posts/", { method: "POST", body: fd }, token);

      setOk("Gönderin paylaşıldı.");
      setContent("");
      setImages([]);
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
          body: JSON.stringify({ text: content, mode: "grammar" }),
        },
        token
      );

      // (İstersen burada da yeni text üzerinden hashtag’ler otomatik taşınmış olur;
      // zaten publish aşamasında tekrar parse ediyorsun.)
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
              helperText="Hashtag eklemek için metnin içine #ai #startup gibi yazabilirsin."
              multiline
              minRows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {/* Hashtag alanı kaldırıldı */}

            <Stack direction="row" spacing={1} alignItems="center">
              <Button variant="outlined" component="label">
                Görsel seç (max 4)
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setImages(files.slice(0, 4));
                  }}
                />
              </Button>

              {images.length > 0 && (
                <Button variant="text" color="error" onClick={() => setImages([])}>
                  Temizle
                </Button>
              )}
            </Stack>

            {images.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Seçilen: {images.map((f) => f.name).join(", ")}
              </Typography>
            )}

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

              <Button variant="text" onClick={() => nav("/ai/create")}>
                AI ile üret (gelişmiş)
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
