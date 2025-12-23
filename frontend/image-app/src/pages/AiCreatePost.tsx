// frontend/src/pages/AiCreatePost.tsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { useNavigate } from "react-router-dom";

import {
  Box,
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
  Chip,
  Divider,
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
  <Box
    sx={{
      minHeight: "calc(100dvh - 64px)",
      py: { xs: 2, md: 4 },
      px: 2,
      background:
        "radial-gradient(1200px 650px at 20% 10%, rgba(99,102,241,.20), transparent 60%)," +
        "radial-gradient(900px 520px at 80% 20%, rgba(34,197,94,.14), transparent 55%)," +
        "linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)",
    }}
  >
    <Container maxWidth="sm">
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,.10)",
          backgroundColor: "rgba(255,255,255,.06)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 20px 70px rgba(0,0,0,.45)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
          <Stack spacing={2.2}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: "rgba(255,255,255,.92)" }}>
                AI ile Post Üret
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)" }}>
                Kısa bir brief ver, taslağı üretip post ekranına gönderebilirsin.
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
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

            <TextField
              label="Konu / Brief"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              fullWidth
              sx={{
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,.70)" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,.04)",
                  color: "rgba(255,255,255,.92)",
                  "& fieldset": { borderColor: "rgba(255,255,255,.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,.22)" },
                  "&.Mui-focused fieldset": { borderColor: "rgba(99,102,241,.75)" },
                },
              }}
            />

            <TextField
              label="Ton (profesyonel, samimi, mizahi...)"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              fullWidth
              sx={{
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,.70)" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,.04)",
                  color: "rgba(255,255,255,.92)",
                  "& fieldset": { borderColor: "rgba(255,255,255,.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,.22)" },
                  "&.Mui-focused fieldset": { borderColor: "rgba(99,102,241,.75)" },
                },
              }}
            />

            <TextField
              label="Hedef kitle (örn. içerik üreticileri, girişimciler...)"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              fullWidth
              sx={{
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,.70)" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,.04)",
                  color: "rgba(255,255,255,.92)",
                  "& fieldset": { borderColor: "rgba(255,255,255,.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,.22)" },
                  "&.Mui-focused fieldset": { borderColor: "rgba(99,102,241,.75)" },
                },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={wantImage}
                  onChange={(e) => setWantImage(e.target.checked)}
                  sx={{
                    color: "rgba(255,255,255,.55)",
                    "&.Mui-checked": { color: "rgba(34,197,94,.95)" },
                  }}
                />
              }
              label={
                <Typography sx={{ color: "rgba(255,255,255,.75)", fontWeight: 700 }}>
                  Bu gönderi için görsel de planlıyorum
                </Typography>
              }
            />

            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={!topic.trim() || loading}
              endIcon={loading ? <CircularProgress size={18} /> : undefined}
              sx={{
                borderRadius: 3,
                py: 1.15,
                fontWeight: 900,
                textTransform: "none",
                background:
                  "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,.9))",
                boxShadow: "0 14px 30px rgba(99,102,241,.20)",
                "&:hover": { boxShadow: "0 18px 40px rgba(99,102,241,.26)" },
              }}
            >
              {loading ? "AI yazıyor…" : "Taslak üret"}
            </Button>

            {resultContent && (
              <>
                <Divider sx={{ borderColor: "rgba(255,255,255,.10)" }} />

                <Stack spacing={1.2}>
                  <Typography sx={{ fontWeight: 900, color: "rgba(255,255,255,.92)" }}>
                    Üretilen taslak
                  </Typography>

                  <Box
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,.10)",
                      backgroundColor: "rgba(255,255,255,.04)",
                      p: 2,
                      color: "rgba(255,255,255,.86)",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.5,
                    }}
                  >
                    {resultContent}
                  </Box>

                  {resultHashtags.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {resultHashtags.map((h) => {
                        const tag = h.replace(/^#/, "").trim();
                        return (
                          <Chip
                            key={tag}
                            label={`#${tag}`}
                            size="small"
                            sx={{
                              color: "rgba(255,255,255,.85)",
                              backgroundColor: "rgba(99,102,241,.14)",
                              border: "1px solid rgba(99,102,241,.25)",
                              fontWeight: 800,
                            }}
                          />
                        );
                      })}
                    </Stack>
                  )}

                  {imagePrompt && (
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)" }}>
                      Görsel fikri: <b>{imagePrompt}</b>
                    </Typography>
                  )}

                  <Button
                    variant="outlined"
                    onClick={sendToComposer}
                    sx={{
                      borderRadius: 3,
                      py: 1.05,
                      fontWeight: 900,
                      textTransform: "none",
                      color: "rgba(255,255,255,.86)",
                      borderColor: "rgba(255,255,255,.18)",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,.28)",
                        backgroundColor: "rgba(255,255,255,.06)",
                      },
                    }}
                  >
                    Bu taslağı post ekranına gönder
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  </Box>
);

}
