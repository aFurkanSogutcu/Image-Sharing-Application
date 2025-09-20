import { useState, useMemo } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Stack,
    Alert,
    LinearProgress,
    Typography,
    Box,
} from "@mui/material";

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function UploadModal({ open, onClose }: Props) {
    const { token } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [desc, setDesc] = useState("");
    const [submitting, setSub] = useState(false);
    const [error, setErr] = useState<string | null>(null);

    const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

    function onFile(e: ChangeEvent<HTMLInputElement>) {
        setErr(null);
        const f = e.target.files?.[0] || null;
        setFile(f);
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        if (!token) { setErr("Giriş yapmalısın."); return; }
        if (!file) { setErr("Bir görsel seç."); return; }
        if (!file.type.startsWith("image/")) { setErr("Sadece görsel yükleyebilirsin."); return; }
        if (file.size > 20 * 1024 * 1024) { setErr("Dosya 20MB sınırını aşıyor."); return; }

        setSub(true);
        try {
            const form = new FormData();
            form.append("description", desc);
            form.append("file", file);
            await apiFetch<void>("/image", { method: "POST", body: form }, token);
            window.dispatchEvent(new CustomEvent("image:uploaded"));
            onClose();
            setFile(null);
            setDesc("");
        } catch (e: any) {
            setErr(e?.message || "Yükleme başarısız");
        } finally {
            setSub(false);
        }
    }

    return (
        <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
            <form onSubmit={onSubmit}>
                <DialogTitle>Görsel Yükle</DialogTitle>

                {submitting && <LinearProgress />}

                <DialogContent>
                    <Stack spacing={2}>
                        <Button component="label" variant="outlined">
                            {file ? "Başka dosya seç" : "Dosya seç"}
                            <input type="file" accept="image/*" hidden onChange={onFile} />
                        </Button>

                        {file && (
                            <Box sx={{ display: "grid", justifyItems: "center", gap: 1 }}>
                                <Box
                                    component="img"
                                    src={previewUrl}
                                    alt="preview"
                                    sx={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </Typography>
                            </Box>
                        )}

                        <TextField
                            label="Açıklama (opsiyonel)"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            multiline
                            minRows={2}
                        />

                        {error && <Alert severity="error">{error}</Alert>}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} disabled={submitting} variant="text">
                        Vazgeç
                    </Button>
                    <Button type="submit" disabled={submitting || !file} variant="contained">
                        {submitting ? "Yükleniyor…" : "Yükle"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
