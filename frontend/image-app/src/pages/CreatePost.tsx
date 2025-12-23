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
  Box,
  Chip,
  Divider,
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

  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const resp = await apiFetch<any>("/posts/", { method: "POST", body: fd }, token);

      if (resp?.status === "review") setOk("Gönderin incelemeye alındı.");
      else setOk("Gönderin paylaşıldı.");

      setContent("");
      setImages([]);
    } catch (e: any) {
      setErr(e.message);
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
              <Typography
                variant="h5"
                sx={{ fontWeight: 900, color: "rgba(255,255,255,.92)" }}
              >
                Yeni Gönderi
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)" }}>
                Metnin içine <b>#ai</b> <b>#startup</b> gibi hashtag’ler yazabilirsin.
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
            {ok && (
              <Alert
                severity="success"
                sx={{
                  borderRadius: 3,
                  backgroundColor: "rgba(34,197,94,.12)",
                  color: "rgba(255,255,255,.92)",
                  border: "1px solid rgba(34,197,94,.35)",
                  "& .MuiAlert-icon": { color: "rgba(34,197,94,.95)" },
                }}
              >
                {ok}
              </Alert>
            )}

            <TextField
              label="Gönderi içeriği"
              helperText="Hashtag eklemek için metnin içine #ai #startup gibi yazabilirsin."
              multiline
              minRows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              sx={{
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,.70)" },
                "& .MuiFormHelperText-root": { color: "rgba(255,255,255,.50)" },
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

            <Divider sx={{ borderColor: "rgba(255,255,255,.10)" }} />

            {/* File picker */}
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  component="label"
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 900,
                    color: "rgba(255,255,255,.86)",
                    borderColor: "rgba(255,255,255,.18)",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,.28)",
                      backgroundColor: "rgba(255,255,255,.06)",
                    },
                  }}
                >
                  Görsel seç (max 4)
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).slice(0, 4);

                      // eski preview url'lerini temizle
                      previews.forEach((p) => URL.revokeObjectURL(p.url));

                      setImages(files);
                      setPreviews(files.map((f) => ({ file: f, url: URL.createObjectURL(f) })));

                      // aynı dosyayı tekrar seçebilmek için
                      e.currentTarget.value = "";
                    }}
                  />
                </Button>

                {images.length > 0 && (
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => {
                      previews.forEach((p) => URL.revokeObjectURL(p.url));
                      setPreviews([]);
                      setImages([]);
                    }}
                    sx={{ textTransform: "none", fontWeight: 900 }}
                  >
                    Temizle
                  </Button>
                )}
              </Stack>

              {images.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {images.map((f) => (
                    <Chip
                      key={f.name}
                      label={f.name}
                      size="small"
                      sx={{
                        color: "rgba(255,255,255,.85)",
                        backgroundColor: "rgba(255,255,255,.06)",
                        border: "1px solid rgba(255,255,255,.10)",
                      }}
                    />
                    
                  ))}
                  {previews.length > 0 && (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      {previews.map((p) => (
                        <Box
                          key={p.url}
                          sx={{
                            position: "relative",
                            borderRadius: 2.5,
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,.10)",
                            backgroundColor: "rgba(255,255,255,.03)",
                            aspectRatio: "1 / 1",
                          }}
                        >
                          <Box
                            component="img"
                            src={p.url}
                            alt={p.file.name}
                            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />

                          <Button
                            size="small"
                            onClick={() => {
                              // remove one
                              URL.revokeObjectURL(p.url);
                              const nextPrev = previews.filter((x) => x.url !== p.url);
                              const nextFiles = images.filter((x) => x.name !== p.file.name);

                              setPreviews(nextPrev);
                              setImages(nextFiles);
                            }}
                            sx={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              minWidth: 0,
                              px: 1,
                              py: 0.2,
                              borderRadius: 999,
                              textTransform: "none",
                              fontWeight: 900,
                              color: "white",
                              backgroundColor: "rgba(0,0,0,.45)",
                              "&:hover": { backgroundColor: "rgba(0,0,0,.60)" },
                            }}
                          >
                            ×
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}

                </Stack>
              )}
            </Stack>

            <Divider sx={{ borderColor: "rgba(255,255,255,.10)" }} />

            {/* Actions */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                onClick={handlePublish}
                disabled={!content.trim() || loadingPost}
                endIcon={loadingPost ? <CircularProgress size={18} /> : undefined}
                sx={{
                  flex: 1,
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
                {loadingPost ? "Paylaşılıyor…" : "Paylaş"}
              </Button>

              <Button
                variant="outlined"
                onClick={handleRewrite}
                disabled={!content.trim() || loadingRewrite}
                endIcon={loadingRewrite ? <CircularProgress size={18} /> : undefined}
                sx={{
                  flex: 1,
                  borderRadius: 3,
                  py: 1.15,
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
                AI ile düzenle
              </Button>

              <Button
                variant="text"
                onClick={() => nav("/ai/create")}
                sx={{
                  flex: 1,
                  borderRadius: 3,
                  py: 1.15,
                  fontWeight: 900,
                  textTransform: "none",
                  color: "rgba(255,255,255,.75)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,.06)" },
                }}
              >
                AI ile üret
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  </Box>
);

}
