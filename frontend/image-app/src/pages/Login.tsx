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
        <Container
            maxWidth="xs"
            sx={{
                minHeight: "calc(100dvh - 64px)",
                display: "grid",
                placeItems: "center",
                py: 4,
            }}
        >
            <Card sx={{ width: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>Giriş Yap</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Hoş geldin! Devam etmek için hesabına giriş yap.
                            </Typography>
                        </Box>

                        {error && <Alert severity="error">{error}</Alert>}

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
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={submitting}
                                    endIcon={submitting ? <CircularProgress size={18} /> : undefined}
                                >
                                    {submitting ? "Gönderiliyor…" : "Giriş"}
                                </Button>
                            </Stack>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                            Hesabın yok mu?{" "}
                            <MuiLink component={RouterLink} to="/register" underline="hover">
                                Kayıt ol
                            </MuiLink>
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
}
