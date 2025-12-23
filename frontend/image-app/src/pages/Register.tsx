import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Link as RouterLink, useNavigate } from "react-router-dom";

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
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [submitting, setSub] = useState(false);
  const [error, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setSub(true);
    try {
      await register(form);
      setOk("Hesap oluşturuldu, şimdi giriş yapabilirsiniz.");
      setTimeout(() => nav("/login"), 800);
    } catch (err: any) {
      setErr(err?.message || "Kayıt başarısız");
    } finally {
      setSub(false);
    }
  }

  const fieldSx = {
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
  } as const;

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
            "radial-gradient(520px 340px at 50% 35%, black 30%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="sm" sx={{ position: "relative" }}>
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
                        "linear-gradient(135deg, rgba(34,197,94,.9), rgba(99,102,241,.85))",
                      boxShadow: "0 10px 25px rgba(34,197,94,.18)",
                      color: "white",
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      userSelect: "none",
                    }}
                  >
                    +
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 900,
                        color: "rgba(255,255,255,.92)",
                        lineHeight: 1.1,
                      }}
                    >
                      Kayıt Ol
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,.70)" }}>
                      Birkaç bilgi ile hemen başlayalım.
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

              <Box component="form" onSubmit={onSubmit} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label="Kullanıcı adı"
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
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
                    sx={fieldSx}
                  />

                  <TextField
                    label="E-posta"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                    autoComplete="email"
                    inputMode="email"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <AlternateEmailIcon />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={fieldSx}
                  />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Ad"
                      value={form.first_name}
                      onChange={(e) => set("first_name", e.target.value)}
                      required
                      autoComplete="given-name"
                      sx={{ flex: 1, ...fieldSx }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeOutlinedIcon />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      label="Soyad"
                      value={form.last_name}
                      onChange={(e) => set("last_name", e.target.value)}
                      required
                      autoComplete="family-name"
                      sx={{ flex: 1, ...fieldSx }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeOutlinedIcon />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Stack>

                  <TextField
                    label="Şifre"
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    required
                    autoComplete="new-password"
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
                    sx={fieldSx}
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
                        "linear-gradient(135deg, rgba(34,197,94,.95), rgba(99,102,241,.9))",
                      boxShadow: "0 14px 30px rgba(34,197,94,.18)",
                      "&:hover": { boxShadow: "0 18px 40px rgba(34,197,94,.24)" },
                    }}
                  >
                    {submitting ? "Gönderiliyor…" : "Kayıt Ol"}
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,.10)" }} />

              <Typography
                variant="body2"
                sx={{ textAlign: "center", color: "rgba(255,255,255,.70)" }}
              >
                Zaten hesabın var mı?{" "}
                <MuiLink
                  component={RouterLink}
                  to="/login"
                  underline="hover"
                  sx={{ color: "rgba(255,255,255,.92)", fontWeight: 800 }}
                >
                  Giriş yap
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
          Bulut Moderasyon • Güvenli Paylaşım
        </Typography>
      </Container>
    </Box>
  );
}
