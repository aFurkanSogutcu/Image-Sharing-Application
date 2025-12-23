from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.database import get_db
from models.models import Posts, Users, PostHashtags, Hashtags, Likes, Comments, PostImages
from routers.auth import get_current_user

router = APIRouter(prefix="/hashtags", tags=["hashtags"])
db_dep = Annotated[Session, Depends(get_db)]
user_dep = Annotated[dict, Depends(get_current_user)]


@router.get("/trending")
def trending(
    db: db_dep,
    limit: int = Query(10, ge=1, le=50),
):
    rows = (
        db.query(Hashtags.tag, func.count(PostHashtags.post_id).label("cnt"))
        .join(PostHashtags, PostHashtags.hashtag_id == Hashtags.id)
        .group_by(Hashtags.tag)
        .order_by(func.count(PostHashtags.post_id).desc(), Hashtags.tag.asc())
        .limit(limit)
        .all()
    )
    return {"items": [{"tag": tag, "count": int(cnt)} for tag, cnt in rows]}


@router.get("/{tag}/posts")
def posts_by_hashtag(
    tag: str,
    db: db_dep,
    user: user_dep,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    tag_clean = tag.strip()
    if tag_clean.startswith("#"):
        tag_clean = tag_clean[1:]

    rows = (
        db.query(Posts, Users.username)
        .join(Users, Users.id == Posts.user_id)
        .join(PostHashtags, PostHashtags.post_id == Posts.id)
        .join(Hashtags, Hashtags.id == PostHashtags.hashtag_id)
        .filter(
            Posts.status == "published",
            Hashtags.tag == tag_clean,
        )
        .order_by(Posts.created_at.desc(), Posts.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    post_ids = [p.id for (p, _u) in rows]
    if not post_ids:
        return {"items": []}

    like_counts_raw = (
        db.query(Likes.post_id, func.count(Likes.id))
        .filter(Likes.post_id.in_(post_ids))
        .group_by(Likes.post_id)
        .all()
    )
    like_counts = {pid: int(cnt) for pid, cnt in like_counts_raw}

    comment_counts_raw = (
        db.query(Comments.post_id, func.count(Comments.id))
        .filter(Comments.post_id.in_(post_ids), Comments.status == "published")
        .group_by(Comments.post_id)
        .all()
    )
    comment_counts = {pid: int(cnt) for pid, cnt in comment_counts_raw}

    liked_post_ids_raw = (
        db.query(Likes.post_id)
        .filter(Likes.post_id.in_(post_ids), Likes.user_id == user["id"])
        .all()
    )
    liked_post_ids = {r[0] for r in liked_post_ids_raw}

    images_raw = (
        db.query(PostImages.post_id, PostImages.stored_filename)
        .filter(PostImages.post_id.in_(post_ids))
        .order_by(PostImages.created_at.asc(), PostImages.id.asc())
        .all()
    )
    images_map: dict[int, list[str]] = {}
    for pid, fname in images_raw:
        images_map.setdefault(pid, []).append(f"/media/{fname}")

    tags_raw = (
        db.query(PostHashtags.post_id, Hashtags.tag)
        .join(Hashtags, Hashtags.id == PostHashtags.hashtag_id)
        .filter(PostHashtags.post_id.in_(post_ids))
        .all()
    )
    tags_map: dict[int, list[str]] = {}
    for pid, t in tags_raw:
        tags_map.setdefault(pid, []).append(f"#{t}")

    items = []
    for p, username in rows:
        pid = p.id
        items.append({
            "id": pid,
            "content": p.content,
            "created_at": p.created_at,
            "owner": {"id": p.user_id, "username": username},
            "like_count": like_counts.get(pid, 0),
            "liked_by_me": pid in liked_post_ids,
            "comment_count": comment_counts.get(pid, 0),
            "image_urls": images_map.get(pid, []),
            "hashtags": tags_map.get(pid, []),
        })

    return {"items": items}
