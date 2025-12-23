// frontend/src/pages/AiCreatePost.tsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";

export default function AiCreatePostPage() {
  const { token } = useAuth();
  const nav = useNavigate();

  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [wantImage, setWantImage] = useState(false);

  const [resultContent, setResultContent] = useState("");
  const [resultHashtags, setResultHashtags] = useState<string[]>([]);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  async function handleGenerate() {
    setErr(null);
    setLoading(true);
    try {
      const resp = await apiFetch<{
        content: string;
        suggested_hashtags?: string[];
        image_prompt?: string | null;
      }>(
        "/ai/generate-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            tone: tone || null,
            audience: audience || null,
            want_image: wantImage,
            max_length: 280,
          }),
        },
        token
      );

      setResultContent(resp.content);
      setResultHashtags(resp.suggested_hashtags || []);
      setImagePrompt(resp.image_prompt || null);
    } catch (e: any) {
      setErr(e?.message || "AI taslak üretirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  function appendHashtagsToContent(content: string, tags: string[]): string {
  if (!tags?.length) return content;

  const normalized = tags
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);

  if (!normalized.length) return content;

  const hashtagLine = normalized.map((t) => `#${t}`).join(" ");

  // Zaten metinde varsa ekleme (basit kontrol)
  const existing = new Set(
    (content.match(/#([0-9A-Za-z_ğüşöçıİĞÜŞÖÇ]+)/g) || []).map((x) => x.toLowerCase())
  );
  const toAdd = normalized
    .map((t) => `#${t}`.toLowerCase())
    .filter((h) => !existing.has(h));

  if (!toAdd.length) return content;

  return `${content.trim()}\n\n${toAdd.join(" ")}`.trim();
}

  function sendToComposer() {
    const composed = appendHashtagsToContent(resultContent, resultHashtags);

    nav("/create", {
      state: {
        content: composed,
      },
    });
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              AI ile Post Üret (Gelişmiş)
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Konu / Brief"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              fullWidth
            />

            <TextField
              label="Ton (profesyonel, samimi, mizahi...)"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              fullWidth
            />

            <TextField
              label="Hedef kitle (örn. içerik üreticileri, girişimciler...)"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              fullWidth
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={wantImage}
                  onChange={(e) => setWantImage(e.target.checked)}
                />
              }
              label="Bu gönderi için görsel de planlıyorum"
            />

            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={!topic.trim() || loading}
              endIcon={loading ? <CircularProgress size={18} /> : undefined}
            >
              {loading ? "AI yazıyor…" : "Taslak üret"}
            </Button>

            {resultContent && (
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Üretilen taslak:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {resultContent}
                </Typography>

                {resultHashtags.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Önerilen hashtag'ler:{" "}
                    {resultHashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
                  </Typography>
                )}

                {imagePrompt && (
                  <Typography variant="body2" color="text.secondary">
                    Görsel fikri (ileride image AI için kullanılabilir): {imagePrompt}
                  </Typography>
                )}

                <Button
                  variant="outlined"
                  onClick={sendToComposer}
                >
                  Bu taslağı post ekranına gönder
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
