// frontend/src/pages/MyProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import type { PostItem } from "../types/post";
import { PostCard } from "../components/PostCard";

type MeInfo = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

type PostsResp = { items?: PostItem[] };

export default function MyProfile() {
  const { token, user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [info, setInfo] = useState<MeInfo | null>(null);

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore] = useState(false); // şimdilik pagination yoksa dursun
  const [error, setErr] = useState<string | null>(null);

  const [confirmPostId, setConfirmPostId] = useState<number | null>(null);

  const initials = useMemo(() => {
    const fn = info?.first_name?.trim() || "";
    const ln = info?.last_name?.trim() || "";
    const un = info?.username?.trim() || user?.username || "";
    const take = (s: string) => (s ? s[0] : "");
    const res = (take(fn) + take(ln)) || take(un);
    return (res || "?").toUpperCase();
  }, [info, user]);

  async function loadAll() {
    if (!token) return;
    setLoading(true);
    setErr(null);

    try {
      // 1) user info
      const me = await apiFetch<MeInfo>("/users/me", undefined, token);
      setInfo(me);

      // 2) my posts
      const resp = await apiFetch<PostsResp>("/users/me/posts?limit=30&offset=0", undefined, token);
      setPosts(Array.isArray(resp.items) ? resp.items : []);
    } catch (e: any) {
      setErr(e?.message || "Profil alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function deletePost(postId: number) {
    if (!token) return;
    try {
      await apiFetch<void>(`/posts/${postId}`, { method: "DELETE" }, token);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e: any) {
      setErr(e?.message || "Silme başarısız");
    } finally {
      setConfirmPostId(null);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100dvh - 64px)",
        py: { xs: 2, md: 3 },
        px: 2,
        background:
          "radial-gradient(1200px 650px at 20% 10%, rgba(99,102,241,.20), transparent 60%)," +
          "radial-gradient(900px 520px at 80% 20%, rgba(34,197,94,.14), transparent 55%)," +
          "linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)",
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ maxWidth: 860, mx: "auto" }}>
          {/* Header row */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 950, color: "rgba(255,255,255,.92)" }}>
              Profilim
            </Typography>

            <Chip
              label={`${posts.length} paylaşım`}
              size="small"
              sx={{
                color: "rgba(255,255,255,.85)",
                backgroundColor: "rgba(99,102,241,.14)",
                border: "1px solid rgba(99,102,241,.25)",
                fontWeight: 900,
              }}
            />
          </Stack>

          {/* User card */}
          <Card
            elevation={0}
            sx={{
              mb: 2,
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,.10)",
              backgroundColor: "rgba(255,255,255,.06)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 20px 70px rgba(0,0,0,.35)",
              color: "rgba(255,255,255,.92)",
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    fontWeight: 900,
                    bgcolor: "rgba(99,102,241,.35)",
                    color: "rgba(255,255,255,.92)",
                  }}
                >
                  {initials}
                </Avatar>

                <Stack spacing={0.35}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonOutlineIcon fontSize="small" sx={{ color: "rgba(255,255,255,.70)" }} />
                    <Typography sx={{ fontWeight: 900, color: "rgba(255,255,255,.92)" }}>
                      @{info?.username || user?.username}
                    </Typography>
                  </Stack>

                  {(info?.first_name || info?.last_name) && (
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)" }}>
                      {(info?.first_name || "").trim()} {(info?.last_name || "").trim()}
                    </Typography>
                  )}

                  {info?.email && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EmailOutlinedIcon fontSize="small" sx={{ color: "rgba(255,255,255,.70)" }} />
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)" }}>
                        {info.email}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </CardContent>

            <Divider sx={{ borderColor: "rgba(255,255,255,.10)" }} />

            <CardContent sx={{ pt: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)" }}>
                  Paylaşımlarını buradan yönetebilirsin (silme dahil).
                </Typography>

                <Button
                  variant="outlined"
                  onClick={() => nav("/create")}
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
                  Yeni post
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 3,
                backgroundColor: "rgba(239,68,68,.12)",
                color: "rgba(255,255,255,.92)",
                border: "1px solid rgba(239,68,68,.35)",
                "& .MuiAlert-icon": { color: "rgba(239,68,68,.95)" },
              }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={loadAll}
                  sx={{ textTransform: "none", fontWeight: 900 }}
                >
                  Tekrar dene
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {loading && (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ py: 5 }}>
              <CircularProgress size={20} />
              <Typography sx={{ color: "rgba(255,255,255,.70)" }}>Yükleniyor…</Typography>
            </Stack>
          )}

          {!loading && posts.length === 0 && !error && (
            <Typography sx={{ py: 6, textAlign: "center", color: "rgba(255,255,255,.65)" }}>
              Henüz paylaşımın yok. İlk postunu oluşturmak için “Yeni post”a tıkla.
            </Typography>
          )}

          {/* Posts list */}
          {!loading && posts.length > 0 && (
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,.10)",
                backgroundColor: "rgba(255,255,255,.06)",
                backdropFilter: "blur(10px)",
                overflow: "hidden",
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {posts.map((p) => (
                  <Box key={p.id} sx={{ position: "relative" }}>
                    {/* delete button overlay */}
                    <Box sx={{ position: "absolute", top: 10, right: 10, zIndex: 5 }}>
                      <Tooltip title="Postu sil" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setConfirmPostId(p.id);
                          }}
                          sx={{
                            color: "rgba(255,255,255,.92)",
                            bgcolor: "rgba(0,0,0,.38)",
                            border: "1px solid rgba(255,255,255,.12)",
                            "&:hover": { bgcolor: "rgba(0,0,0,.60)" },
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <PostCard
                      post={p}
                      onOpen={() =>
                        nav(`/post/${p.id}`, {
                          state: { backgroundLocation: location },
                        })
                      }
                      onOwnerClick={() => nav("/profile")}
                      onHashtagClick={(tag) => nav(`/tag/${encodeURIComponent(tag.replace("#", ""))}`)}
                      onComment={() =>
                        nav(`/post/${p.id}`, {
                          state: { backgroundLocation: location },
                        })
                      }
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {loadingMore && (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
              <CircularProgress size={18} />
              <Typography sx={{ color: "rgba(255,255,255,.65)" }}>Yükleniyor…</Typography>
            </Stack>
          )}

          {/* Confirm delete dialog */}
          <Dialog
            open={confirmPostId !== null}
            onClose={() => setConfirmPostId(null)}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,.10)",
                backgroundColor: "rgba(2,6,23,.85)",
                backdropFilter: "blur(12px)",
                color: "rgba(255,255,255,.92)",
              },
            }}
          >
            <DialogTitle sx={{ fontWeight: 950 }}>Postu sil</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,.70)" }}>
                Bu postu silmek istediğine emin misin? Bu işlem geri alınamaz.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => setConfirmPostId(null)}
                variant="text"
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  color: "rgba(255,255,255,.75)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,.06)" },
                }}
              >
                Vazgeç
              </Button>

              <Button
                onClick={() => deletePost(confirmPostId!)}
                variant="contained"
                startIcon={<DeleteOutlineIcon />}
                sx={{
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 900,
                  background: "linear-gradient(135deg, rgba(239,68,68,1), rgba(244,63,94,.9))",
                }}
              >
                Sil
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </Box>
  );
}
