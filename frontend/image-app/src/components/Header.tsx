import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMemo, useState } from "react";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  Box,
  CircularProgress,
  Container,
  IconButton,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LogoutIcon from "@mui/icons-material/Logout";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const isLogin = location.pathname === "/login";
  const isRegister = location.pathname === "/register";
  const isAuthPage = useMemo(() => isLogin || isRegister, [isLogin, isRegister]);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        borderBottom: "1px solid",
        borderColor: "rgba(255,255,255,.08)",
        background:
          "linear-gradient(180deg, rgba(2,6,23,.85) 0%, rgba(2,6,23,.65) 60%, rgba(2,6,23,0) 100%)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 0, sm: 0 }, minHeight: 64, gap: 1 }}>
          {/* Brand */}
          <Stack
            direction="row"
            spacing={1.1}
            alignItems="center"
            component={RouterLink}
            to="/"
            sx={{ textDecoration: "none" }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2.2,
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,.9))",
                color: "white",
                fontWeight: 900,
                boxShadow: "0 10px 24px rgba(99,102,241,.25)",
                userSelect: "none",
              }}
            >
              AI
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "rgba(255,255,255,.92)",
                  lineHeight: 1.05,
                }}
              >
                AISocial
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,.55)", lineHeight: 1 }}>
                Safe content sharing
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          {loading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,.65)" }}>
                Yükleniyor…
              </Typography>
            </Stack>
          ) : user ? (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Upload -> /create */}
              <Button
                onClick={() => nav("/create")}
                startIcon={<CloudUploadIcon />}
                variant="contained"
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 800,
                  px: 2,
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,.9))",
                  boxShadow: "0 14px 30px rgba(99,102,241,.20)",
                  "&:hover": { boxShadow: "0 18px 38px rgba(99,102,241,.25)" },
                }}
              >
                Yükle
              </Button>

              {/* Single entry: Avatar -> menu */}
              <Tooltip title={`@${user.username}`}>
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    ml: 0.5,
                    border: "1px solid rgba(255,255,255,.12)",
                    backgroundColor: "rgba(255,255,255,.04)",
                    "&:hover": { backgroundColor: "rgba(255,255,255,.08)" },
                  }}
                >
                  <Avatar sx={{ width: 28, height: 28 }}>
                    {user.username?.[0]?.toUpperCase() ?? "U"}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,.10)",
                    backgroundColor: "rgba(2,6,23,.92)",
                    backdropFilter: "blur(10px)",
                    color: "rgba(255,255,255,.92)",
                    minWidth: 210,
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    nav("/profile");
                  }}
                >
                  Profil
                </MenuItem>

                <Divider sx={{ borderColor: "rgba(255,255,255,.10)" }} />

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    logout();
                    nav("/login");
                  }}
                >
                  <LogoutIcon fontSize="small" style={{ marginRight: 10 }} />
                  Çıkış
                </MenuItem>
              </Menu>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                component={RouterLink}
                to="/login"
                variant={isAuthPage && isLogin ? "contained" : "outlined"}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 900,
                  px: 2,
                  color: "rgba(255,255,255,.90)",
                  borderColor: "rgba(255,255,255,.18)",
                  backgroundColor: isLogin ? "rgba(99,102,241,.95)" : "rgba(255,255,255,.04)",
                  "&:hover": {
                    backgroundColor: isLogin ? "rgba(99,102,241,1)" : "rgba(255,255,255,.08)",
                    borderColor: "rgba(255,255,255,.26)",
                  },
                }}
              >
                Giriş
              </Button>

              <Button
                component={RouterLink}
                to="/register"
                variant={isAuthPage && isRegister ? "contained" : "outlined"}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 900,
                  px: 2,
                  color: "rgba(255,255,255,.90)",
                  borderColor: "rgba(255,255,255,.18)",
                  backgroundColor: isRegister ? "rgba(34,197,94,.90)" : "rgba(255,255,255,.04)",
                  "&:hover": {
                    backgroundColor: isRegister ? "rgba(34,197,94,1)" : "rgba(255,255,255,.08)",
                    borderColor: "rgba(255,255,255,.26)",
                  },
                }}
              >
                Kayıt
              </Button>
            </Stack>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
