// src/components/PostCard.tsx
import { MouseEvent, useState } from "react";
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
  onHashtagClick?: (tag: string) => void; // ✅
};

function renderContentWithHashtags(
  text: string,
  onHashtagClick?: (tag: string) => void,
  stop?: (e: any) => void
) {
  // #tag yakala (Türkçe karakter destekli)
  const re = /#([0-9A-Za-z_ğüşöçıİĞÜŞÖÇ]+)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const tagRaw = match[0];      // "#ai"
    const tagValue = match[1];    // "ai"

    // match öncesi normal metin
    if (start > lastIndex) {
      nodes.push(<span key={`t-${key++}`}>{text.slice(lastIndex, start)}</span>);
    }

    // hashtag kısmı clickable
    nodes.push(
      <Typography
        key={`h-${key++}`}
        component="span"
        sx={{ color: "primary.main", cursor: "pointer", fontWeight: 600 }}
        onClick={(e) => {
          stop?.(e);
          onHashtagClick?.(tagValue); // "#"siz gönderiyoruz: ai
        }}
      >
        {tagRaw}
      </Typography>
    );

    lastIndex = end;
  }

  // sondaki metin
  if (lastIndex < text.length) {
    nodes.push(<span key={`t-${key++}`}>{text.slice(lastIndex)}</span>);
  }

  return nodes;
}

export function PostCard({
  post,
  onOpen,
  onOwnerClick,
  onLike,
  onComment,
  onHashtagClick,
}: PostCardProps) {
  const theme = useTheme();

  const likeCount = post.like_count ?? 0;
  const commentCount = post.comment_count ?? 0;

  const handleRootClick = () => onOpen?.();

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
  const avatarLetter = post.owner.username?.[0]?.toUpperCase() ?? "?";

  const images = Array.isArray(post.image_urls) ? post.image_urls : [];
  const hasImage = images.length > 0;
  const [fit, setFit] = useState<"cover" | "contain">("cover");

  const tags = Array.isArray(post.hashtags) ? post.hashtags : [];

  return (
    <Box
      onClick={handleRootClick}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        px: 2,
        py: 1.5,
        cursor: onOpen ? "pointer" : "default",
        "&:hover": { backgroundColor: theme.palette.action.hover },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          sx={{ width: 40, height: 40, cursor: "pointer" }}
          onClick={handleOwnerClick}
        >
          {avatarLetter}
        </Avatar>

        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
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

          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {renderContentWithHashtags(post.content || "", onHashtagClick, stop)}
          </Typography>

          {/* ✅ Görsel */}
          {hasImage && (
  <Box
    sx={{
      mt: 1.2,
      borderRadius: 2,
      overflow: "hidden",
      border: `1px solid ${theme.palette.divider}`,
      width: "100%",
      aspectRatio: "16 / 9",
      maxHeight: 320,
      backgroundColor: "action.hover", // contain olduğunda boşluk yumuşak dursun
    }}
  >
    <Box
      component="img"
      src={images[0]}
      alt="Post image"
      loading="lazy"
      onLoad={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        const w = img.naturalWidth || 1;
        const h = img.naturalHeight || 1;
        const r = w / h;

        // Çok dikey ya da çok yatay => contain (daha az kırpma)
        // r < 0.8 => dikey, r > 1.9 => çok yatay
        setFit(r < 0.8 || r > 1.9 ? "contain" : "cover");
      }}
      sx={{
        width: "100%",
        height: "100%",
        objectFit: fit,         // ✅ cover/contain otomatik
        display: "block",
      }}
    />
  </Box>
)}


          {!hasImage && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ mt: 0.5 }}
            >
              <ImageOutlinedIcon fontSize="small" sx={{ opacity: 0.4 }} />
              <Typography variant="caption" color="text.secondary">
                Görselsiz gönderi
              </Typography>
            </Stack>
          )}

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton size="small" onClick={handleLikeClick} sx={{ p: 0.5 }}>
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
