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

  // ✅ scroll anchors
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  // ✅ image lightbox
  const [imgOpen, setImgOpen] = useState(false);

  const close = () => nav(-1);

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
      setErr(e?.message || "Post yüklenemedi");
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

      // ✅ yeni yorum eklenince en alta kaydır
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

  return (
    <>
      <Dialog
        open
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") close();
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography fontWeight={700}>Gönderi</Typography>
          <IconButton onClick={close} size="small" aria-label="Kapat">
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
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {/* ✅ Scrollable content area */}
        {!loading && post && (
          <Box sx={{ maxHeight: "70vh", overflowY: "auto", px: 2, py: 2 }}>
            {/* Post üst alan */}
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Avatar sx={{ width: 44, height: 44 }}>
                {post.owner.username?.[0]?.toUpperCase() ?? "?"}
              </Avatar>

              <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight={700}>@{post.owner.username}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    • {new Date(post.created_at).toLocaleString()}
                  </Typography>
                </Stack>

                <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {post.content}
                </Typography>

                {/* ✅ Görsel (tıklanınca büyüt) */}
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
                      borderRadius: 2,
                      overflow: "hidden",
                      border: 1,
                      borderColor: "divider",
                      width: "100%",
                      aspectRatio: "16 / 9",
                      maxHeight: 360,
                      backgroundColor: "action.hover",
                      cursor: "zoom-in",
                      position: "relative",
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

                    {/* küçük zoom hint */}
                    <Box
                      className="zoomHint"
                      sx={{
                        position: "absolute",
                        right: 8,
                        bottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.5,
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

                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {post.like_count} beğeni • {comments.length} yorum
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Yorum yazma */}
            <Stack spacing={1}>
              <Typography fontWeight={700}>Yorum yaz</Typography>

              <TextField
                multiline
                minRows={2}
                placeholder="Bir yorum yaz..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                fullWidth
              />

              <Stack direction="row" justifyContent="flex-end">
                <Button variant="contained" onClick={sendComment} disabled={!text.trim() || sending}>
                  {sending ? "Gönderiliyor..." : "Gönder"}
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* ✅ Yorumlar */}
            <div ref={listTopRef} />
            <Stack spacing={1.5}>
              {comments.map((c) => (
                <Stack key={c.id} direction="row" spacing={1.25} alignItems="flex-start">
                  <Avatar sx={{ width: 34, height: 34 }}>
                    {c.owner.username?.[0]?.toUpperCase() ?? "?"}
                  </Avatar>
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" fontWeight={700}>
                        @{c.owner.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(c.created_at).toLocaleString()}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                      {c.content}
                    </Typography>
                  </Stack>
                </Stack>
              ))}

              {comments.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Henüz yorum yok.
                </Typography>
              )}

              <div ref={listEndRef} />
            </Stack>
          </Box>
        )}

        {/* ✅ Bottom bar: Yorumlara git / Üste git */}
        {post && (
          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              zIndex: 10,
              bgcolor: "background.paper",
              borderTop: 1,
              borderColor: "divider",
              px: 2,
              py: 1,
              display: "flex",
              gap: 1,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {comments.length} yorum
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Üste git
              </Button>

              <Button
                size="small"
                variant="contained"
                onClick={() =>
                  listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
                }
              >
                Yorumlara git
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* ✅ Image Lightbox (tam ekran) */}
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
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 20,
          }}
        >
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
              onClick={(e) => e.stopPropagation()} // resme tıklayınca kapanmasın
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
