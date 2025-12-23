# routers/users.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.database import get_db
from routers.auth import get_current_user
from models.models import Users, Posts, Likes, Comments, PostImages, Hashtags, PostHashtags

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(Users).filter(Users.id == current_user["id"]).first()
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }



# ✅ BUNU /{id} tarzı route'lardan ÖNCE yaz
@router.get("/me/posts")
def my_posts(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    # sadece published (review istemiyorsan)
    rows = (
        db.query(Posts, Users.username)
        .join(Users, Users.id == Posts.user_id)
        .filter(Posts.user_id == current_user["id"], Posts.status == "published")
        .order_by(Posts.created_at.desc(), Posts.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    if not rows:
        return {"items": []}

    post_ids = [p.id for (p, _u) in rows]

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
        .filter(Likes.post_id.in_(post_ids), Likes.user_id == current_user["id"])
        .all()
    )
    liked_post_ids = {r[0] for r in liked_post_ids_raw}

    images_raw = (
        db.query(PostImages.post_id, PostImages.stored_filename)
        .filter(PostImages.post_id.in_(post_ids))
        .order_by(PostImages.created_at.asc(), PostImages.id.asc())
        .all()
    )
    images_map = {}
    for pid, fname in images_raw:
        images_map.setdefault(pid, []).append(f"/media/{fname}")

    tag_rows = (
        db.query(PostHashtags.post_id, Hashtags.tag)
        .join(Hashtags, Hashtags.id == PostHashtags.hashtag_id)
        .filter(PostHashtags.post_id.in_(post_ids))
        .all()
    )
    tags_map = {}
    for pid, tag in tag_rows:
        tags_map.setdefault(pid, []).append(f"#{tag}")

    items = []
    for (p, username) in rows:
        pid = p.id
        items.append(
            {
                "id": pid,
                "content": p.content,
                "created_at": p.created_at,
                "owner": {"id": p.user_id, "username": username},
                "like_count": like_counts.get(pid, 0),
                "liked_by_me": (pid in liked_post_ids),
                "comment_count": comment_counts.get(pid, 0),
                "image_urls": images_map.get(pid, []),
                "hashtags": tags_map.get(pid, []),
            }
        )

    return {"items": items}

@router.get("/{id}")
def get_user_by_id(id: int, db: Session = Depends(get_db)):
    u = db.query(Users).filter(Users.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    return {
        "id": u.id,
        "username": u.username,
        "first_name": u.first_name,
        "last_name": u.last_name,
    }

@router.get("/{id}/posts")
def user_posts(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),  # token varsa liked_by_me hesaplarız
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    u = db.query(Users.id).filter(Users.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    rows = (
        db.query(Posts, Users.username)
        .join(Users, Users.id == Posts.user_id)
        .filter(Posts.user_id == id, Posts.status == "published")
        .order_by(Posts.created_at.desc(), Posts.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    if not rows:
        return {"items": []}

    post_ids = [p.id for (p, _un) in rows]

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

    liked_post_ids = set()
    if current_user:
        liked_post_ids_raw = (
            db.query(Likes.post_id)
            .filter(Likes.post_id.in_(post_ids), Likes.user_id == current_user["id"])
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

    tag_rows = (
        db.query(PostHashtags.post_id, Hashtags.tag)
        .join(Hashtags, Hashtags.id == PostHashtags.hashtag_id)
        .filter(PostHashtags.post_id.in_(post_ids))
        .all()
    )
    tags_map: dict[int, list[str]] = {}
    for pid, tag in tag_rows:
        tags_map.setdefault(pid, []).append(f"#{tag}")

    items = []
    for (p, username) in rows:
        pid = p.id
        items.append(
            {
                "id": pid,
                "content": p.content,
                "created_at": p.created_at,
                "owner": {"id": p.user_id, "username": username},
                "like_count": like_counts.get(pid, 0),
                "liked_by_me": (pid in liked_post_ids),
                "comment_count": comment_counts.get(pid, 0),
                "image_urls": images_map.get(pid, []),
                "hashtags": tags_map.get(pid, []),
            }
        )

    return {"items": items}