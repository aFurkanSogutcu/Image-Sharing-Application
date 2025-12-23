export type PostOwner = {
  id: number;
  username: string;
};

export type PostItem = {
  id: number;
  content: string;
  created_at: string; // ISO
  owner: PostOwner;

  like_count: number;
  liked_by_me: boolean;
  comment_count: number;

  image_urls?: string[];   // ✅
  hashtags?: string[];     // ✅ "#ai" formatında
};
