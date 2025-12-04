# routers/posts.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import Posts, Users
from .auth import get_current_user
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter(
    prefix="/posts",
    tags=["posts"]
)

db_dep = Annotated[Session, Depends(get_db)]
user_dep = Annotated[dict, Depends(get_current_user)]


class PostCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)
    source: str = "user"  # "user" | "ai_assist"
    generated_from_prompt: str | None = None
    model_name: str | None = None


class PostOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    username: str

    class Config:
        orm_mode = True

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_post(
    body: PostCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user is None:
        raise HTTPException(status_code=401, detail="Auth required")

    post = Posts(
        user_id=user["id"],
        content=body.content,
        source=body.source,
        generated_from_prompt=body.generated_from_prompt,
        model_name=body.model_name,
        status="published",         # moderasyonu sonra entegre edeceğiz
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

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_post(
    req: PostCreate,
    user: user_dep,
    db: db_dep,
):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication failed")

    if len(req.content.strip()) < 3:
        raise HTTPException(status_code=400, detail="İçerik çok kısa")

    post = Posts(
        user_id=user["id"],
        content=req.content,
        status="published",
        source=req.source,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"id": post.id}

@router.get("/feed")
def public_feed(
    db: db_dep,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    q = (
        db.query(Posts, Users.username)
          .join(Users, Users.id == Posts.user_id)
          .filter(Posts.status == "published")
          .order_by(Posts.created_at.desc(), Posts.id.desc())
          .limit(limit)
          .offset(offset)
          .all()
    )

    items = [{
        "id": p.id,
        "content": p.content,
        "created_at": p.created_at.isoformat(),
        "owner": {
            "id": p.user_id,
            "username": username
        }
    } for (p, username) in q]

    # pagination’ı istersen ekle, şimdilik basit de bırakabilirsin
    return {"items": items}
