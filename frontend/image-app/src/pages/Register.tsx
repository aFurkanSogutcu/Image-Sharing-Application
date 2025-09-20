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

    return (
        <Container
            maxWidth="sm"
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
                            <Typography variant="h5" fontWeight={800}>
                                Kayıt Ol
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Birkaç bilgi ile hemen başlayalım.
                            </Typography>
                        </Box>

                        {error && <Alert severity="error">{error}</Alert>}
                        {ok && <Alert severity="success">{ok}</Alert>}

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
                                />

                                {/* Ad / Soyad yan yana (küçük ekranda alt alta) */}
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField
                                        label="Ad"
                                        value={form.first_name}
                                        onChange={(e) => set("first_name", e.target.value)}
                                        required
                                        autoComplete="given-name"
                                        sx={{ flex: 1 }}
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
                                        sx={{ flex: 1 }}
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
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={submitting}
                                    endIcon={submitting ? <CircularProgress size={18} /> : undefined}
                                >
                                    {submitting ? "Gönderiliyor…" : "Kayıt Ol"}
                                </Button>
                            </Stack>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                            Zaten hesabın var mı?{" "}
                            <MuiLink component={RouterLink} to="/login" underline="hover">
                                Giriş yap
                            </MuiLink>
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
}
