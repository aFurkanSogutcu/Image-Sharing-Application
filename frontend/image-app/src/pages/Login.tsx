import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";

import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
  IconButton,
  Alert,
  Box,
  CircularProgress,
  Link as MuiLink,
  Divider,
} from "@mui/material";

import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSub] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  const nav = useNavigate();
  const loc = useLocation();
  const next = new URLSearchParams(loc.search).get("next") || "/";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSub(true);
    try {
      await login(username.trim(), password);
      nav(next);
    } catch (err: any) {
      setErr(err?.message || "Giriş başarısız");
    } finally {
      setSub(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100dvh - 64px)",
        display: "grid",
        placeItems: "center",
        py: { xs: 3, md: 6 },
        px: 2,
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(99,102,241,.25), transparent 60%)," +
          "radial-gradient(900px 500px at 80% 20%, rgba(34,197,94,.18), transparent 55%)," +
          "linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)",
      }}
    >
      {/* subtle pattern */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.18,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(500px 300px at 50% 40%, black 30%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="xs" sx={{ position: "relative" }}>
        <Card
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,.10)",
            backgroundColor: "rgba(255,255,255,.06)",
            backdropFilter: "blur(12px)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.06) inset",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
            <Stack spacing={2.5}>
              {/* Brand / Title */}
              <Stack spacing={1}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 3,
                      display: "grid",
                      placeItems: "center",
                      background:
                        "linear-gradient(135deg, rgba(99,102,241,.95), rgba(34,197,94,.75))",
                      boxShadow: "0 10px 25px rgba(99,102,241,.25)",
                      color: "white",
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      userSelect: "none",
                    }}
                  >
                    AI
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 900, color: "rgba(255,255,255,.92)", lineHeight: 1.1 }}
                    >
                      Giriş Yap
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,.70)" }}>
                      Hoş geldin! Devam etmek için hesabına giriş yap.
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

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

              <Box component="form" onSubmit={onSubmit} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label="Kullanıcı adı"
                    placeholder="kullaniciadi"
                    value={username}
                    onChange={(e) => setU(e.target.value)}
                    autoFocus
                    required
                    autoComplete="username"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineIcon />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiInputLabel-root": { color: "rgba(255,255,255,.70)" },
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: "rgba(2,6,23,.35)",
                        color: "rgba(255,255,255,.92)",
                        "& fieldset": { borderColor: "rgba(255,255,255,.14)" },
                        "&:hover fieldset": { borderColor: "rgba(255,255,255,.28)" },
                        "&.Mui-focused fieldset": { borderColor: "rgba(99,102,241,.75)" },
                      },
                      "& .MuiInputAdornment-root, & svg": { color: "rgba(255,255,255,.70)" },
                    }}
                  />

                  <TextField
                    label="Şifre"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setP(e.target.value)}
                    required
                    autoComplete="current-password"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPass ? "Şifreyi gizle" : "Şifreyi göster"}
                              onClick={() => setShowPass((s) => !s)}
                              edge="end"
                            >
                              {showPass ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiInputLabel-root": { color: "rgba(255,255,255,.70)" },
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: "rgba(2,6,23,.35)",
                        color: "rgba(255,255,255,.92)",
                        "& fieldset": { borderColor: "rgba(255,255,255,.14)" },
                        "&:hover fieldset": { borderColor: "rgba(255,255,255,.28)" },
                        "&.Mui-focused fieldset": { borderColor: "rgba(99,102,241,.75)" },
                      },
                      "& .MuiInputAdornment-root, & svg": { color: "rgba(255,255,255,.70)" },
                      "& .MuiIconButton-root": { color: "rgba(255,255,255,.75)" },
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    endIcon={submitting ? <CircularProgress size={18} /> : undefined}
                    sx={{
                      borderRadius: 3,
                      py: 1.2,
                      fontWeight: 800,
                      textTransform: "none",
                      background:
                        "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,.9))",
                      boxShadow: "0 14px 30px rgba(99,102,241,.20)",
                      "&:hover": {
                        boxShadow: "0 18px 40px rgba(99,102,241,.26)",
                      },
                    }}
                  >
                    {submitting ? "Gönderiliyor…" : "Giriş"}
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,.10)" }} />

              <Typography variant="body2" sx={{ textAlign: "center", color: "rgba(255,255,255,.70)" }}>
                Hesabın yok mu?{" "}
                <MuiLink
                  component={RouterLink}
                  to="/register"
                  underline="hover"
                  sx={{ color: "rgba(255,255,255,.92)", fontWeight: 800 }}
                >
                  Kayıt ol
                </MuiLink>
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 2,
            color: "rgba(255,255,255,.45)",
          }}
        >
          İçerik Moderasyonu • Güvenli Paylaşım
        </Typography>
      </Container>
    </Box>
  );
}
