from core.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB

class Users(Base):
    __tablename__ = 'users'

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(200), unique=True, index=True)
    username        = Column(String(45), unique=True, index=True)
    first_name      = Column(String(45))
    last_name       = Column(String(45))
    hashed_password = Column(String(200))
    is_active       = Column(Boolean, default=True)
    role            = Column(String(45))
    bio             = Column(String(300))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


class Posts(Base):
    __tablename__ = "posts"

    id                    = Column(Integer, primary_key=True, index=True)
    user_id               = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content               = Column(String(1000), nullable=False)
    created_at            = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    status                = Column(String(20), nullable=False, default="published")  # published | blocked | review
    source                = Column(String(20), nullable=False, default="user")       # user | ai
    safety_label          = Column(String(50))
    safety_scores         = Column(JSONB)

    generated_from_prompt = Column(String(500))
    model_name            = Column(String(100))


class PostImages(Base):
    __tablename__ = "post_images"

    id              = Column(Integer, primary_key=True, index=True)
    post_id         = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    stored_filename = Column(String(255), unique=True, nullable=False)
    content_type    = Column(String(100), nullable=False)
    size_bytes      = Column(Integer, nullable=False)
    description     = Column(String(200))
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AIRequests(Base):
    __tablename__ = "ai_requests"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    type        = Column(String(50), nullable=False)
    input_text  = Column(String)
    output_text = Column(String)
    model_name  = Column(String(100))
    meta        = Column(JSONB)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status      = Column(String(20), default="success")


class Likes(Base):
    __tablename__ = "likes"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id     = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_user_post_like"),
    )


class Comments(Base):
    __tablename__ = "comments"

    id            = Column(Integer, primary_key=True, index=True)
    post_id       = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content       = Column(String(500), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # ✅ yeni
    status        = Column(String(20), nullable=False, default="published")  # published | blocked | review

    safety_label  = Column(String(50))
    safety_scores = Column(JSONB)

# models/models.py (senin dosyana ek)

class Hashtags(Base):
    __tablename__ = "hashtags"

    id         = Column(Integer, primary_key=True, index=True)
    tag        = Column(String(80), unique=True, nullable=False, index=True)  


class PostHashtags(Base):
    __tablename__ = "post_hashtags"

    id         = Column(Integer, primary_key=True, index=True)
    post_id    = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    hashtag_id = Column(Integer, ForeignKey("hashtags.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("post_id", "hashtag_id", name="uq_post_hashtag"),
    )
