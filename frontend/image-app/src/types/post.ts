export type PostOwner = {
  id: number;
  username: string;
  avatar_url?: string | null;
};

export type PostItem = {
  id: number;
  content: string;
  created_at: string;
  owner: PostOwner;

  // İleride backend'den gelir:
  image_url?: string | null;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
};
