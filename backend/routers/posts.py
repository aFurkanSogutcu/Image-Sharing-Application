# routers/posts.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from models.models import Posts, Users, Likes, Comments
from .auth import get_current_user
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter(
    prefix="/posts",
    tags=["posts"]
)

db_dep = Annotated[Session, Depends(get_db)]
user_dep = Annotated[dict, Depends(get_current_user)]

# ---------- Pydantic şemalar ----------
class PostCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)
    hashtags: list[str] | None = None   # ileride hashtag tablosu için
    source: str = "user"                # "user" | "ai_assist"
    generated_from_prompt: str | None = None
    model_name: str | None = None

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

    class Config:
        orm_mode = True

class CommentCreate(BaseModel):
    content: str = Field(min_length=3, max_length=500)

class CommentOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    owner: PostOwner

    class Config:
        orm_mode = True

# ---------- Endpointler ----------
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_post(
    body: PostCreate,
    db: db_dep,
    user: user_dep,
):
    if user is None:
        raise HTTPException(status_code=401, detail="Auth required")

    if len(body.content.strip()) < 3:
        raise HTTPException(status_code=400, detail="İçerik çok kısa")

    post = Posts(
        user_id=user["id"],
        content=body.content,
        source=body.source,
        generated_from_prompt=body.generated_from_prompt,
        model_name=body.model_name,
        status="published",   # moderasyonu sonra ekleyeceğiz
        safety_label=None,
        safety_scores=None,
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    return {
        "id": post.id,
        "content": post.content,
        "created_at": post.created_at,
        "source": post.source,
    }

@router.post("/{post_id}/like-toggle")
def toggle_like(
    user: user_dep,
    db: db_dep,
    post_id: int = Path(..., ge=1),
):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    post = db.query(Posts).filter(
        Posts.id == post_id,
        Posts.status == "published"
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post bulunamadı")

    like = db.query(Likes).filter(
        Likes.user_id == user["id"],
        Likes.post_id == post_id
    ).first()

    if like:
        # beğeni vardı -> kaldır
        db.delete(like)
        db.commit()
        liked = False
    else:
        # beğeni yoktu -> ekle
        new_like = Likes(user_id=user["id"], post_id=post_id)
        db.add(new_like)
        db.commit()
        liked = True

    like_count = db.query(func.count(Likes.id)).filter(
        Likes.post_id == post_id
    ).scalar() or 0

    return {
        "post_id": post_id,
        "liked": liked,
        "like_count": like_count,
    }

@router.get("/{post_id}")
def get_post_detail(
    db: db_dep,
    user: user_dep,
    post_id: int = Path(..., ge=1),
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

    like_count = db.query(func.count(Likes.id)).filter(
        Likes.post_id == post_id
    ).scalar() or 0

    comment_count = db.query(func.count(Comments.id)).filter(
        Comments.post_id == post_id
    ).scalar() or 0

    liked = (
        db.query(Likes.id)
        .filter(Likes.post_id == post_id, Likes.user_id == user["id"])
        .first()
        is not None
    )

    return PostOut(
        id=post.id,
        content=post.content,
        created_at=post.created_at,
        owner=PostOwner(id=post.user_id, username=username),
        like_count=like_count,
        liked_by_me=liked,
        comment_count=comment_count,
    )


# --- Yorum oluşturma ---

@router.post("/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    body: CommentCreate,
    user: user_dep,
    db: db_dep,
):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    post_exists = db.query(Posts.id).filter(
        Posts.id == post_id,
        Posts.status == "published",
    ).first()

    if not post_exists:
        raise HTTPException(status_code=404, detail="Post bulunamadı")

    comment = Comments(
        post_id=post_id,
        user_id=user["id"],
        content=body.content.strip(),
        status=None,   # istersen ileride moderation için status ekleyebilirsin
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    owner_username = (
        db.query(Users.username)
        .filter(Users.id == user["id"])
        .scalar()
    )

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
    rows = (
        db.query(Comments, Users.username)
        .join(Users, Users.id == Comments.user_id)
        .filter(Comments.post_id == post_id)
        .order_by(Comments.created_at.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    result: list[CommentOut] = []
    for c, username in rows:
        result.append(
            CommentOut(
                id=c.id,
                content=c.content,
                created_at=c.created_at,
                owner=PostOwner(id=c.user_id, username=username),
            )
        )

    return result

@router.get("/feed")
def public_feed(
    db: db_dep,
    user: user_dep,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    # 1) Post + owner
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

    # 2) Like sayıları
    like_counts_raw = (
        db.query(Likes.post_id, func.count(Likes.id))
        .filter(Likes.post_id.in_(post_ids))
        .group_by(Likes.post_id)
        .all()
    )
    like_counts = {post_id: cnt for post_id, cnt in like_counts_raw}

    # 3) Comment sayıları
    comment_counts_raw = (
        db.query(Comments.post_id, func.count(Comments.id))
        .filter(Comments.post_id.in_(post_ids))
        .group_by(Comments.post_id)
        .all()
    )
    comment_counts = {post_id: cnt for post_id, cnt in comment_counts_raw}

    # 4) Bu kullanıcının beğendiği postlar
    liked_post_ids_raw = (
        db.query(Likes.post_id)
        .filter(
            Likes.post_id.in_(post_ids),
            Likes.user_id == user["id"],
        )
        .all()
    )
    liked_post_ids = {row[0] for row in liked_post_ids_raw}

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
            )
        )

    return {"items": items}