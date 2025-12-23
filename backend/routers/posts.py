# routers/posts.py
from typing import Annotated, List
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter, Depends, HTTPException, status,
    Query, Path as FPath, UploadFile, File, Form
)
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.database import get_db
from core.config import settings
from models.models import (
    Posts, Users, Likes, Comments, PostImages,
    Hashtags, PostHashtags
)
from .auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/posts", tags=["posts"])

db_dep = Annotated[Session, Depends(get_db)]
user_dep = Annotated[dict, Depends(get_current_user)]

MEDIA_DIR = Path(settings.MEDIA_ROOT)
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB
MAX_IMAGES_PER_POST = 4
MAX_HASHTAGS_PER_POST = 8


# ---------- yardımcılar ----------
def _build_storage_path_from_content_type(content_type: str) -> tuple[str, Path]:
    """
    Relatif yol + tam dosya yolu üretir.
    Örn: uploads/2025/12/uuid.jpg  ve  <MEDIA_ROOT>/uploads/2025/12/uuid.jpg
    """
    now = datetime.now()

    ext_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    ext = ext_map.get(content_type, ".bin")

    rel = Path("uploads") / f"{now:%Y}" / f"{now:%m}" / f"{uuid4().hex}{ext}"
    full = Path(settings.MEDIA_ROOT) / rel
    full.parent.mkdir(parents=True, exist_ok=True)

    # Rel path'ı URL-friendly yap
    rel_str = str(rel).replace("\\", "/")
    return rel_str, full

def _parse_hashtags(raw: str | None) -> list[str]:
    """
    Kabul edilen giriş örnekleri:
      "#ai, #fastapi #react"
      "ai fastapi react"
      "#AI\n#FastAPI"
    Çıktı: ["ai", "fastapi", "react"] (lowercase, uniq, max 8)
    """
    if not raw:
        return []

    parts = raw.replace("\n", " ").replace(",", " ").split()
    cleaned: list[str] = []

    for p in parts:
        t = p.strip()
        if not t:
            continue
        t = t.lstrip("#").lower()

        # basic validasyon
        if len(t) < 2 or len(t) > 50:
            continue
        if not all(ch.isalnum() or ch == "_" for ch in t):
            continue

        cleaned.append(t)

    # unique + limit
    uniq: list[str] = []
    seen = set()
    for t in cleaned:
        if t not in seen:
            seen.add(t)
            uniq.append(t)

    return uniq[:MAX_HASHTAGS_PER_POST]


# ---------- Pydantic Response şemalar ----------
class PostOwner(BaseModel):
    id: int
    username: str

class PostOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    owner: PostOwner
    like_count: int
    liked_by_me: bool
    comment_count: int
    image_urls: list[str] = []
    hashtags: list[str] = []   # ✅ yeni

    class Config:
        orm_mode = True

class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    owner: PostOwner

    class Config:
        orm_mode = True


# ---------- CREATE POST (multipart) ----------
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_post(
    db: db_dep,
    user: user_dep,
    hashtags: str | None = Form(None),
    content: str = Form(..., min_length=1, max_length=1000),
    source: str = Form("user"),
    generated_from_prompt: str | None = Form(None),
    model_name: str | None = Form(None),
    images: List[UploadFile] = File(default=[]),   # 0..N
):
    if user is None:
        raise HTTPException(status_code=401, detail="Auth required")

    content_str = content.strip()
    if len(content_str) < 3:
        raise HTTPException(status_code=400, detail="İçerik çok kısa")

    if len(images) > MAX_IMAGES_PER_POST:
        raise HTTPException(status_code=400, detail=f"En fazla {MAX_IMAGES_PER_POST} resim ekleyebilirsin")

    tags = _parse_hashtags(hashtags)  # ["ai", "fastapi"]...

    saved_files: list[Path] = []  # hata olursa silmek için

    try:
        # ✅ tek transaction mantığı: önce post'u ekle (commit yok), id için flush
        post = Posts(
            user_id=user["id"],
            content=content_str,
            source=source,
            generated_from_prompt=generated_from_prompt,
            model_name=model_name,
            status="published",
            safety_label=None,
            safety_scores=None,
        )
        db.add(post)
        db.flush()  # post.id oluşur

        # ---- hashtags: tek seferde var olanları çek, eksikleri oluştur ----
        if tags:
            existing_rows = (
                db.query(Hashtags)
                .filter(Hashtags.tag.in_(tags))
                .all()
            )
            existing_map = {h.tag: h for h in existing_rows}

            hashtag_ids: list[int] = []
            for t in tags:
                h = existing_map.get(t)
                if not h:
                    h = Hashtags(tag=t)
                    db.add(h)
                    db.flush()  # h.id
                hashtag_ids.append(h.id)

            # linkle
            for hid in hashtag_ids:
                db.add(PostHashtags(post_id=post.id, hashtag_id=hid))

        # ---- images: dosyaya yaz + PostImages kaydı ----
        image_urls: list[str] = []
        for file in images:
            if file is None:
                continue

            if file.content_type not in ALLOWED_CONTENT_TYPES:
                raise HTTPException(status_code=400, detail="Sadece jpg/png/webp kabul edilir")

            data = await file.read()
            size = len(data)

            if size == 0:
                raise HTTPException(status_code=400, detail="Boş dosya yüklenemez")
            if size > MAX_IMAGE_BYTES:
                raise HTTPException(status_code=413, detail="Resim çok büyük (max 5MB)")

            ext = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/webp": ".webp",
            }[file.content_type]

            rel_path, full_path = _build_storage_path_from_content_type(file.content_type)

            full_path.write_bytes(data)
            saved_files.append(full_path)

            img = PostImages(
                post_id=post.id,
                stored_filename=rel_path,          # ✅ artık uploads/2025/12/...
                content_type=file.content_type,
                size_bytes=size,
                description=None,
            )
            db.add(img)

            image_urls.append(f"/media/{rel_path}")

        # ✅ her şey OK => tek commit
        db.commit()
        db.refresh(post)
        # print("MEDIA_ROOT =", settings.MEDIA_ROOT)
        # print("Saving to  =", str(full_path))
        return {
            "id": post.id,
            "content": post.content,
            "created_at": post.created_at,
            "source": post.source,
            "image_urls": image_urls,
            "hashtags": [f"#{t}" for t in tags],
        }

    except HTTPException:
        db.rollback()
        # Kaydedilen dosyaları sil
        for p in saved_files:
            try:
                p.unlink(missing_ok=True)
            except Exception:
                pass
        raise

    except Exception as e:
        db.rollback()
        for p in saved_files:
            try:
                p.unlink(missing_ok=True)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Post oluşturulamadı: {str(e)}")


# ---------- FEED ----------
@router.get("/feed")
def public_feed(
    db: db_dep,
    user: user_dep,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    rows = (
        db.query(Posts, Users.username)
        .join(Users, Users.id == Posts.user_id)
        .filter(Posts.status == "published")
        .order_by(Posts.created_at.desc(), Posts.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    if not rows:
        return {"items": []}

    post_ids = [p.id for (p, _username) in rows]

    like_counts_raw = (
        db.query(Likes.post_id, func.count(Likes.id))
        .filter(Likes.post_id.in_(post_ids))
        .group_by(Likes.post_id)
        .all()
    )
    like_counts = {post_id: int(cnt) for post_id, cnt in like_counts_raw}

    comment_counts_raw = (
        db.query(Comments.post_id, func.count(Comments.id))
        .filter(
            Comments.post_id.in_(post_ids),
            Comments.status == "published",
        )
        .group_by(Comments.post_id)
        .all()
    )
    comment_counts = {post_id: int(cnt) for post_id, cnt in comment_counts_raw}

    liked_post_ids_raw = (
        db.query(Likes.post_id)
        .filter(Likes.post_id.in_(post_ids), Likes.user_id == user["id"])
        .all()
    )
    liked_post_ids = {row[0] for row in liked_post_ids_raw}

    # ✅ resimleri tek seferde çek
    images_raw = (
        db.query(PostImages.post_id, PostImages.stored_filename)
        .filter(PostImages.post_id.in_(post_ids))
        .order_by(PostImages.created_at.asc(), PostImages.id.asc())
        .all()
    )
    images_map: dict[int, list[str]] = {}
    for pid, fname in images_raw:
        images_map.setdefault(pid, []).append(f"/media/{fname}")

    # ✅ hashtagleri tek seferde çek
    tag_rows = (
        db.query(PostHashtags.post_id, Hashtags.tag)
        .join(Hashtags, Hashtags.id == PostHashtags.hashtag_id)
        .filter(PostHashtags.post_id.in_(post_ids))
        .all()
    )
    tags_map: dict[int, list[str]] = {}
    for pid, tag in tag_rows:
        tags_map.setdefault(pid, []).append(f"#{tag}")

    items: list[PostOut] = []
    for (p, username) in rows:
        pid = p.id
        items.append(
            PostOut(
                id=pid,
                content=p.content,
                created_at=p.created_at,
                owner=PostOwner(id=p.user_id, username=username),
                like_count=int(like_counts.get(pid, 0)),
                liked_by_me=(pid in liked_post_ids),
                comment_count=int(comment_counts.get(pid, 0)),
                image_urls=images_map.get(pid, []),
                hashtags=tags_map.get(pid, []),
            )
        )

    return {"items": items}


# ---------- LIKE TOGGLE ----------
@router.post("/{post_id}/like-toggle")
def toggle_like(
    user: user_dep,
    db: db_dep,
    post_id: int = FPath(..., ge=1),
):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    post = db.query(Posts).filter(Posts.id == post_id, Posts.status == "published").first()
    if not post:
        raise HTTPException(status_code=404, detail="Post bulunamadı")

    like = db.query(Likes).filter(Likes.user_id == user["id"], Likes.post_id == post_id).first()

    if like:
        db.delete(like)
        db.commit()
        liked = False
    else:
        db.add(Likes(user_id=user["id"], post_id=post_id))
        db.commit()
        liked = True

    like_count = db.query(func.count(Likes.id)).filter(Likes.post_id == post_id).scalar() or 0
    return {"post_id": post_id, "liked": liked, "like_count": int(like_count)}


# ---------- POST DETAIL ----------
@router.get("/{post_id}")
def get_post_detail(
    db: db_dep,
    user: user_dep,
    post_id: int = FPath(..., ge=1),
):
    row = (
        db.query(Posts, Users.username)
        .join(Users, Users.id == Posts.user_id)
        .filter(Posts.id == post_id, Posts.status == "published")
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Post bulunamadı")

    post, username = row

    like_count = db.query(func.count(Likes.id)).filter(Likes.post_id == post_id).scalar() or 0
    comment_count = (
        db.query(func.count(Comments.id))
        .filter(Comments.post_id == post_id, Comments.status == "published")
        .scalar()
        or 0
    )

    liked = (
        db.query(Likes.id)
        .filter(Likes.post_id == post_id, Likes.user_id == user["id"])
        .first()
        is not None
    )

    imgs = (
        db.query(PostImages.stored_filename)
        .filter(PostImages.post_id == post_id)
        .order_by(PostImages.created_at.asc(), PostImages.id.asc())
        .all()
    )
    image_urls = [f"/media/{row[0]}" for row in imgs]

    tag_rows = (
        db.query(Hashtags.tag)
        .join(PostHashtags, PostHashtags.hashtag_id == Hashtags.id)
        .filter(PostHashtags.post_id == post_id)
        .all()
    )
    hashtags = [f"#{r[0]}" for r in tag_rows]

    return PostOut(
        id=post.id,
        content=post.content,
        created_at=post.created_at,
        owner=PostOwner(id=post.user_id, username=username),
        like_count=int(like_count),
        liked_by_me=liked,
        comment_count=int(comment_count),
        image_urls=image_urls,
        hashtags=hashtags,
    )


# ---------- COMMENTS ----------
@router.post("/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    body: CommentCreate,
    user: user_dep,
    db: db_dep,
):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    post_exists = db.query(Posts.id).filter(Posts.id == post_id, Posts.status == "published").first()
    if not post_exists:
        raise HTTPException(status_code=404, detail="Post bulunamadı")

    text = (body.content or "").strip()
    if len(text) < 3:
        raise HTTPException(status_code=400, detail="Yorum çok kısa")

    comment = Comments(
        post_id=post_id,
        user_id=user["id"],
        content=text,
        status="published",
        safety_label=None,
        safety_scores=None,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    owner_username = db.query(Users.username).filter(Users.id == user["id"]).scalar() or "unknown"

    return CommentOut(
        id=comment.id,
        content=comment.content,
        created_at=comment.created_at,
        owner=PostOwner(id=user["id"], username=owner_username),
    )


@router.get("/{post_id}/comments", response_model=List[CommentOut])
def list_comments(
    post_id: int,
    db: db_dep,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    post_exists = db.query(Posts.id).filter(Posts.id == post_id, Posts.status == "published").first()
    if not post_exists:
        raise HTTPException(status_code=404, detail="Post bulunamadı")

    rows = (
        db.query(Comments, Users.username)
        .join(Users, Users.id == Comments.user_id)
        .filter(
            Comments.post_id == post_id,
            Comments.status == "published",
        )
        .order_by(Comments.created_at.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    return [
        CommentOut(
            id=c.id,
            content=c.content,
            created_at=c.created_at,
            owner=PostOwner(id=c.user_id, username=username),
        )
        for c, username in rows
    ]
