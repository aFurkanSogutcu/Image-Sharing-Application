// src/components/PostCard.tsx
import { MouseEvent } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Avatar,
  useTheme,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import type { PostItem } from "../types/post";

type PostCardProps = {
  post: PostItem;
  onOpen?: () => void;
  onOwnerClick?: () => void;
  onLike?: () => void;
  onComment?: () => void;
};

export function PostCard({
  post,
  onOpen,
  onOwnerClick,
  onLike,
  onComment,
}: PostCardProps) {
  const theme = useTheme();

  const likeCount = post.like_count ?? 0;
  const commentCount = post.comment_count ?? 0;

  const handleRootClick = () => {
    onOpen?.();
  };

  const stop = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleOwnerClick = (e: MouseEvent) => {
    stop(e);
    onOwnerClick?.();
  };

  const handleLikeClick = (e: MouseEvent) => {
    stop(e);
    onLike?.();
  };

  const handleCommentClick = (e: MouseEvent) => {
    stop(e);
    onComment?.();
  };

  const createdLabel = new Date(post.created_at).toLocaleString();

  // Basit avatar: username'in ilk harfi
  const avatarLetter = post.owner.username?.[0]?.toUpperCase() ?? "?";

  const hasImage = Boolean(post.image_url);

  return (
    <Box
      onClick={handleRootClick}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        px: 2,
        py: 1.5,
        cursor: onOpen ? "pointer" : "default",
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        {/* Avatar + sol kolon */}
        <Avatar
          sx={{ width: 40, height: 40, cursor: "pointer" }}
          onClick={handleOwnerClick}
        >
          {avatarLetter}
        </Avatar>

        {/* Sağ taraf (içerik) */}
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          {/* Üst satır: kullanıcı adı + tarih */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, cursor: "pointer" }}
              onClick={handleOwnerClick}
            >
              @{post.owner.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • {createdLabel}
            </Typography>
          </Stack>

          {/* İçerik */}
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {post.content}
          </Typography>

          {/* Opsiyonel resim */}
          {hasImage && (
            <Box
              sx={{
                mt: 1.5,
                borderRadius: 2,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
                maxHeight: 400, // Twitter'daki gibi belli bir yükseklikle sınırlı
              }}
            >
              <Box
                component="img"
                src={post.image_url!}
                alt="Post image"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </Box>
          )}

          {/* Resimsiz gönderi için küçük görsel ipucu (isteğe bağlı) */}
          {!hasImage && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
              <ImageOutlinedIcon fontSize="small" sx={{ opacity: 0.4 }} />
              <Typography variant="caption" color="text.secondary">
                Görselsiz gönderi
              </Typography>
            </Stack>
          )}

          {/* Alt aksiyon satırı: Like, Comment */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton
                size="small"
                onClick={handleLikeClick}
                sx={{ p: 0.5 }}
              >
                {post.liked_by_me ? (
                  <FavoriteIcon fontSize="small" color="error" />
                ) : (
                  <FavoriteBorderIcon fontSize="small" />
                )}
              </IconButton>
              {likeCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {likeCount}
                </Typography>
              )}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton
                size="small"
                onClick={handleCommentClick}
                sx={{ p: 0.5 }}
              >
                <ChatBubbleOutlineIcon fontSize="small" />
              </IconButton>
              {commentCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {commentCount}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
