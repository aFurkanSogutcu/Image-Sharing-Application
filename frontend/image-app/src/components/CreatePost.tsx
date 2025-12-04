import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
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

export default function CreatePostPage() {
  const { token } = useAuth();

  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [content, setContent] = useState("");

  const [genLoading, setGenLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleGenerate() {
    setErr(null);
    setOk(null);
    setGenLoading(true);
    try {
      const resp = await apiFetch<{ suggested_content: string }>(
        "/ai/generate-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            tone: tone || null,
            audience: audience || null,
            max_length: 280,
          }),
        },
        token
      );
      setContent(resp.suggested_content);
      setOk("AI bir taslak üretti, istersen düzenleyebilirsin.");
    } catch (e: any) {
      setErr(e?.message || "AI içerik üretirken hata oluştu");
    } finally {
      setGenLoading(false);
    }
  }

  async function handlePublish() {
    setErr(null);
    setOk(null);
    setPostLoading(true);
    try {
      await apiFetch(
        "/posts/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            source: "ai_assist",
            generated_from_prompt: topic,
            model_name: "gpt-4o-mini",
          }),
        },
        token
      );
      setOk("Gönderin paylaşıldı.");
      setContent("");
      // istersen topic/tone vs. de sıfırlayabilirsin
    } catch (e: any) {
      setErr(e?.message || "Gönderi paylaşılırken hata oluştu");
    } finally {
      setPostLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              Yeni Gönderi (AI destekli)
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}
            {ok && <Alert severity="success">{ok}</Alert>}

            {/* AI brief alanları */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                AI için kısa bir açıklama ver:
              </Typography>
              <TextField
                label="Konu / Brief"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                fullWidth
              />
              <TextField
                label="Ton (ör. profesyonel, mizahi...)"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                fullWidth
              />
              <TextField
                label="Hedef kitle (opsiyonel)"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                fullWidth
              />

              <Button
                onClick={handleGenerate}
                variant="outlined"
                disabled={genLoading || !topic.trim()}
                endIcon={genLoading ? <CircularProgress size={18} /> : undefined}
              >
                {genLoading ? "AI yazıyor..." : "AI ile taslak üret"}
              </Button>
            </Stack>

            {/* Asıl post içeriği */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Gönderi içeriği
              </Typography>
              <TextField
                multiline
                minRows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="İstersen kendi yazını gir, istersen AI'nin ürettiğini düzenle..."
              />

              <Button
                onClick={handlePublish}
                variant="contained"
                disabled={postLoading || !content.trim()}
                endIcon={postLoading ? <CircularProgress size={18} /> : undefined}
              >
                {postLoading ? "Paylaşılıyor..." : "Paylaş"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
