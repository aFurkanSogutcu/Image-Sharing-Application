// src/pages/PostModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Divider,
  Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type PostDetail = {
  id: number;
  content: string;
  created_at: string;
  owner: { id: number; username: string };
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
  image_urls: string[];
  hashtags: string[];
};

type CommentOut = {
  id: number;
  content: string;
  created_at: string;
  owner: { id: number; username: string };
};

export default function PostModal() {
  const nav = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();

  const postId = useMemo(() => Number(id), [id]);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const listTopRef = useRef<HTMLDivElement | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const [imgOpen, setImgOpen] = useState(false);

  const close = () => nav(-1);
  
  const goOwner = () => {
    if (!post) return;
    close(); // modalı kapatıp arkadaki sayfaya dön
    nav(`/user/${post.owner.id}`);
  };

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const p = await apiFetch<PostDetail>(`/posts/${postId}`, undefined, token);
      const c = await apiFetch<CommentOut[]>(
        `/posts/${postId}/comments?limit=50&offset=0`,
        undefined,
        token
      );
      setPost(p);
      setComments(Array.isArray(c) ? c : []);
    } catch (e: any) {
      setErr(e?.message || "Gönderi yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!postId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function sendComment() {
    if (!text.trim()) return;
    setSending(true);
    setErr(null);
    try {
      const newC = await apiFetch<CommentOut>(
        `/posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text.trim() }),
        },
        token
      );

      setComments((prev) => [...prev, newC]);
      setText("");

      setTimeout(() => {
        listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 0);
    } catch (e: any) {
      setErr(e?.message || "Yorum gönderilemedi");
    } finally {
      setSending(false);
    }
  }

  const imgSrc = post?.image_urls?.[0];

  const paperSx = {
    borderRadius: 4,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.10)",
    backgroundColor: "rgba(2,6,23,.78)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 20px 70px rgba(0,0,0,.55)",
    color: "rgba(255,255,255,.92)",
  } as const;

  const fieldSx = {
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,.70)" },
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,.04)",
      color: "rgba(255,255,255,.92)",
      "& fieldset": { borderColor: "rgba(255,255,255,.12)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,.22)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(99,102,241,.75)" },
    },
    "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,.45)", opacity: 1 },
  } as const;

  return (
    <>
      <Dialog
        open
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") close();
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: paperSx }}
      >
        {/* Header */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,.10)",
            backgroundColor: "rgba(2,6,23,.88)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography sx={{ fontWeight: 900, color: "rgba(255,255,255,.92)" }}>
            Gönderi
          </Typography>
          <IconButton
            onClick={close}
            size="small"
            aria-label="Kapat"
            sx={{
              color: "rgba(255,255,255,.85)",
              bgcolor: "rgba(255,255,255,.06)",
              "&:hover": { bgcolor: "rgba(255,255,255,.10)" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {loading && (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={22} />
          </Box>
        )}

        {!loading && error && (
          <Box sx={{ p: 2 }}>
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
          </Box>
        )}

        {/* Scrollable content */}
        {!loading && post && (
            <Box
                sx={{
                maxHeight: "70vh",
                overflowY: "auto",
                px: 2,
                py: 2,

                /* ✅ dark scrollbar (Chromium) */
                "&::-webkit-scrollbar": { width: 10 },
                "&::-webkit-scrollbar-track": { background: "rgba(255,255,255,.04)" },
                "&::-webkit-scrollbar-thumb": {
                    background: "rgba(255,255,255,.18)",
                    borderRadius: 999,
                    border: "2px solid rgba(2,6,23,.55)",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                    background: "rgba(255,255,255,.26)",
                },

                /* ✅ Firefox */
                scrollbarColor: "rgba(255,255,255,.22) rgba(255,255,255,.05)",
                scrollbarWidth: "thin",
                }}
            >

            {/* Post üst alan */}
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: "rgba(99,102,241,.35)",
                  color: "rgba(255,255,255,.92)",
                  fontWeight: 900,
                }}
              >
                {post.owner.username?.[0]?.toUpperCase() ?? "?"}
              </Avatar>

              <Stack spacing={0.8} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                        sx={{
                        fontWeight: 900,
                        color: "rgba(255,255,255,.92)",
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                        }}
                        onClick={goOwner}
                    >
                        @{post.owner.username}
                    </Typography>

                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,.55)" }}>
                        • {new Date(post.created_at).toLocaleString()}
                    </Typography>
                </Stack>

                <Typography
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "rgba(255,255,255,.88)",
                    lineHeight: 1.5,
                  }}
                >
                  {post.content}
                </Typography>

                {/* Image */}
                {imgSrc && (
                  <Box
                    onClick={() => setImgOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setImgOpen(true);
                    }}
                    sx={{
                      mt: 1.25,
                      borderRadius: 2.5,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,.10)",
                      width: "100%",
                      aspectRatio: "16 / 9",
                      maxHeight: 380,
                      backgroundColor: "rgba(255,255,255,.03)",
                      cursor: "zoom-in",
                      position: "relative",
                      transition: "transform .12s ease, border-color .12s ease",
                      "&:hover": { transform: "translateY(-1px)", borderColor: "rgba(255,255,255,.16)" },
                      "&:hover .zoomHint": { opacity: 1 },
                    }}
                  >
                    <Box
                      component="img"
                      src={imgSrc}
                      alt="Post image"
                      loading="lazy"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    <Box
                      className="zoomHint"
                      sx={{
                        position: "absolute",
                        right: 10,
                        bottom: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.6,
                        px: 1.1,
                        py: 0.55,
                        borderRadius: 999,
                        bgcolor: "rgba(0,0,0,0.55)",
                        color: "white",
                        opacity: 0.85,
                        transition: "opacity 120ms ease",
                        pointerEvents: "none",
                      }}
                    >
                      <ZoomInIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: "inherit" }}>
                        Büyüt
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Typography variant="caption" sx={{ mt: 0.6, color: "rgba(255,255,255,.55)" }}>
                  {post.like_count} beğeni • {comments.length} yorum
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,.10)" }} />

            {/* Comment composer */}
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 900, color: "rgba(255,255,255,.92)" }}>
                Yorum yaz
              </Typography>

              <TextField
                multiline
                minRows={2}
                placeholder="Bir yorum yaz..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                fullWidth
                sx={fieldSx}
              />

              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={sendComment}
                  disabled={!text.trim() || sending}
                  sx={{
                    borderRadius: 3,
                    textTransform: "none",
                    fontWeight: 900,
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,.9))",
                    boxShadow: "0 14px 30px rgba(99,102,241,.20)",
                    "&:hover": { boxShadow: "0 18px 40px rgba(99,102,241,.26)" },
                  }}
                >
                  {sending ? "Gönderiliyor..." : "Gönder"}
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,.10)" }} />

            {/* Comments */}
            <div ref={listTopRef} />
            <Stack spacing={1.5}>
              {comments.map((c) => (
                <Stack key={c.id} direction="row" spacing={1.25} alignItems="flex-start">
                  <Avatar
                    onClick={goOwner}
                    sx={{
                        width: 44,
                        height: 44,
                        cursor: "pointer",
                        bgcolor: "rgba(99,102,241,.35)",
                        color: "rgba(255,255,255,.92)",
                        fontWeight: 900,
                        "&:hover": { filter: "brightness(1.05)" },
                    }}
                  >
                    {c.owner.username?.[0]?.toUpperCase() ?? "?"}
                  </Avatar>

                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "rgba(255,255,255,.92)" }}>
                        @{c.owner.username}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,.55)" }}>
                        {new Date(c.created_at).toLocaleString()}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        color: "rgba(255,255,255,.82)",
                        lineHeight: 1.45,
                      }}
                    >
                      {c.content}
                    </Typography>
                  </Stack>
                </Stack>
              ))}

              {comments.length === 0 && (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,.60)" }}>
                  Henüz yorum yok.
                </Typography>
              )}

              <div ref={listEndRef} />
            </Stack>
          </Box>
        )}
      </Dialog>

      {/* Image Lightbox */}
      <Dialog
        open={imgOpen}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") setImgOpen(false);
        }}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.92)",
          },
        }}
      >
        <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 20 }}>
          <IconButton
            onClick={() => setImgOpen(false)}
            sx={{
              color: "white",
              bgcolor: "rgba(255,255,255,0.12)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
            }}
            aria-label="Kapat"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          onClick={() => setImgOpen(false)}
          sx={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
          }}
        >
          {imgSrc && (
            <Box
              component="img"
              src={imgSrc}
              alt="Full image"
              onClick={(e) => e.stopPropagation()}
              sx={{
                maxWidth: "95vw",
                maxHeight: "92vh",
                objectFit: "contain",
                borderRadius: 2,
                display: "block",
              }}
            />
          )}
        </Box>
      </Dialog>
    </>
  );
}
