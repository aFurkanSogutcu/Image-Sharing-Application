from core.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean, func
from sqlalchemy.dialects.postgresql import JSONB

class Users(Base):
    __tablename__ = 'users'

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(200), unique=True)       
    username        = Column(String(45), unique=True)     
    first_name      = Column(String(45))               
    last_name       = Column(String(45)) 
    hashed_password = Column(String(200))          
    is_active       = Column(Boolean, default=True)
    role            = Column(String(45)) 
    phone_number    = Column(String(20)) 
    bio         = Column(String(300))         # kısa açıklama
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
class Posts(Base):
    __tablename__ = "posts"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    content     = Column(String(1000), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Yayın durumu:
    status      = Column(String(20), nullable=False, default="published")
    # 'published' | 'blocked' | 'review'

    # Post AI'den mi geldi?
    source      = Column(String(20), nullable=False, default="user")
    # 'user' | 'ai_assist'

    # Moderasyon sonuçları:
    safety_label    = Column(String(50))    # 'safe', 'hate', 'violence', ...
    safety_scores   = Column(JSONB)         # {"hate": 0.02, "self_harm": 0.0, ...}

    # AI üretimi ile ilgili meta:
    generated_from_prompt = Column(String(500))   # AI generate ekranında girdiğin açıklama
    model_name            = Column(String(100))   # 'gpt-4o-mini', 'azure-gpt-4.1' vs

class PostImages(Base):
    __tablename__ = "post_images"

    id              = Column(Integer, primary_key=True, index=True)
    post_id         = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

    stored_filename = Column(String(255), unique=True, nullable=False)
    content_type    = Column(String(100), nullable=False)
    size_bytes      = Column(Integer, nullable=False)
    description     = Column(String(200))

    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AIRequests(Base):
    __tablename__ = "ai_requests"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    type        = Column(String(50), nullable=False)
    # 'generate_post', 'moderation', 'rewrite', 'hashtag_suggest' vs.

    input_text  = Column(String)        # modele gönderdiğin text / prompt
    output_text = Column(String)        # modelin cevabı (istersen truncate edebilirsin)

    model_name  = Column(String(100))   # 'gpt-4o-mini', '...'
    meta        = Column(JSONB)         # { "temperature": 0.7, "latency_ms": 350, "tokens": 123 }

    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status      = Column(String(20), default="success")  # 'success' | 'error'

class Likes(Base):
    __tablename__ = "likes"

    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    post_id    = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Comments(Base):
    __tablename__ = "comments"

    id         = Column(Integer, primary_key=True, index=True)
    post_id    = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content    = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    safety_label  = Column(String(50))
    safety_scores = Column(JSONB)
