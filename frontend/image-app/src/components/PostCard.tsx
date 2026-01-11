// src/components/PostCard.tsx
import { MouseEvent, useState } from "react";
import { Box, Stack, Typography, IconButton, Avatar } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import type { PostItem } from "../types/post";
import { MEDIA_BASE } from "../lib/api";

type PostCardProps = {
  post: PostItem;
  onOpen?: () => void;
  onOwnerClick?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onHashtagClick?: (tag: string) => void;
};

function renderContentWithHashtags(
  text: string,
  onHashtagClick?: (tag: string) => void,
  stop?: (e: any) => void
) {
  const re = /#([0-9A-Za-z_ğüşöçıİĞÜŞÖÇ]+)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const tagRaw = match[0];
    const tagValue = match[1];

    if (start > lastIndex) {
      nodes.push(<span key={`t-${key++}`}>{text.slice(lastIndex, start)}</span>);
    }

    nodes.push(
      <Typography
        key={`h-${key++}`}
        component="span"
        sx={{
          color: "rgba(99,102,241,.95)", // primary-like
          cursor: "pointer",
          fontWeight: 700,
        }}
        onClick={(e) => {
          stop?.(e);
          onHashtagClick?.(tagValue);
        }}
      >
        {tagRaw}
      </Typography>
    );

    lastIndex = end;
  }

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
  const likeCount = post.like_count ?? 0;
  const commentCount = post.comment_count ?? 0;

  const stop = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleRootClick = () => onOpen?.();

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

  return (
    <Box
      onClick={handleRootClick}
      sx={{
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,.10)",
        backgroundColor: "rgba(255,255,255,.04)",
        backdropFilter: "blur(8px)",
        px: 2,
        py: 1.6,
        cursor: onOpen ? "pointer" : "default",
        transition: "transform .12s ease, background-color .12s ease, border-color .12s ease",
        "&:hover": {
          backgroundColor: "rgba(255,255,255,.06)",
          borderColor: "rgba(255,255,255,.14)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          sx={{
            width: 40,
            height: 40,
            cursor: "pointer",
            bgcolor: "rgba(99,102,241,.35)",
            color: "rgba(255,255,255,.92)",
            fontWeight: 900,
          }}
          onClick={handleOwnerClick}
        >
          {avatarLetter}
        </Avatar>

        <Stack spacing={0.7} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                cursor: "pointer",
                color: "rgba(255,255,255,.92)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              onClick={handleOwnerClick}
            >
              @{post.owner.username}
            </Typography>

            <Typography variant="caption" sx={{ color: "rgba(255,255,255,.55)" }}>
              • {createdLabel}
            </Typography>
          </Stack>

          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "rgba(255,255,255,.88)",
              lineHeight: 1.45,
            }}
          >
            {renderContentWithHashtags(post.content || "", onHashtagClick, stop)}
          </Typography>

          {/* Image */}
          {hasImage && (
            <Box
              sx={{
                mt: 1.2,
                borderRadius: 2.5,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,.10)",
                width: "100%",
                aspectRatio: "16 / 9",
                maxHeight: 340,
                backgroundColor: "rgba(255,255,255,.03)",
              }}
            >
              <Box
                component="img"
                src={
                  images[0].startsWith("http")
                    ? images[0]
                    : `${MEDIA_BASE}${images[0]}`
                }
                alt="Post image"
                loading="lazy"
                onLoad={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  const w = img.naturalWidth || 1;
                  const h = img.naturalHeight || 1;
                  const r = w / h;
                  setFit(r < 0.8 || r > 1.9 ? "contain" : "cover");
                }}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: fit,
                  display: "block",
                }}
              />
            </Box>
          )}

          {!hasImage && (
            <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 0.5 }}>
              <ImageOutlinedIcon fontSize="small" sx={{ opacity: 0.55, color: "rgba(255,255,255,.70)" }} />
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,.55)" }}>
                Görselsiz gönderi
              </Typography>
            </Stack>
          )}

          {/* Actions */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.6}>
              <IconButton
                size="small"
                onClick={handleLikeClick}
                sx={{
                  p: 0.7,
                  color: "rgba(255,255,255,.80)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,.08)" },
                }}
              >
                {post.liked_by_me ? (
                  <FavoriteIcon fontSize="small" sx={{ color: "rgba(239,68,68,.95)" }} />
                ) : (
                  <FavoriteBorderIcon fontSize="small" />
                )}
              </IconButton>

              {likeCount > 0 && (
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,.60)" }}>
                  {likeCount}
                </Typography>
              )}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.6}>
              <IconButton
                size="small"
                onClick={handleCommentClick}
                sx={{
                  p: 0.7,
                  color: "rgba(255,255,255,.80)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,.08)" },
                }}
              >
                <ChatBubbleOutlineIcon fontSize="small" />
              </IconButton>

              {commentCount > 0 && (
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,.60)" }}>
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
