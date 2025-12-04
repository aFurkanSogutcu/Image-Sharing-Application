import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import UploadModal from "./UploadModal";

import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Stack,
    Box,
    CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";

export default function Header() {
    const { user, loading, logout } = useAuth();
    const nav = useNavigate();
    const [open, setOpen] = useState(false);

    return (
        <>
            <AppBar
                position="sticky"
                color="default"
                elevation={0}
                sx={{ borderBottom: 1, borderColor: "divider" }}
            >
                <Toolbar sx={{ gap: 1 }}>
                    {/* Logo / Brand */}
                    <Typography
                        variant="h6"
                        component={RouterLink}
                        to="/"
                        sx={{
                            fontWeight: 800,
                            textDecoration: "none",
                            color: "text.primary",
                        }}
                    >
                        AISocial
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Right side */}
                    {loading ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <CircularProgress size={18} />
                            <Typography variant="caption" color="text.secondary">
                                Yükleniyor…
                            </Typography>
                        </Stack>
                    ) : user ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                                onClick={() => nav("/create")}
                                startIcon={<CloudUploadIcon />}
                                variant="contained"
                            >
                                Yükle
                            </Button>
                            <Button
                                component={RouterLink}
                                to="/profile"
                                startIcon={<AccountCircleIcon />}
                                variant="text"
                            >
                                @{user.username}
                            </Button>
                            <Button
                                onClick={() => {
                                    logout();
                                    nav("/login");
                                }}
                                variant="outlined"
                                startIcon={<LogoutIcon />}
                            >
                                Çıkış
                            </Button>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={1}>
                            <Button component={RouterLink} to="/login" variant="contained">
                                Giriş
                            </Button>
                            <Button component={RouterLink} to="/register" variant="outlined">
                                Kayıt
                            </Button>
                        </Stack>
                    )}
                </Toolbar>
            </AppBar>

            {/* Upload modal (mevcut bileşenin değişmeden kullanımı) */}
            <UploadModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
