from core.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean, func

class Images(Base):
    __tablename__ = 'images'

    id              = Column(Integer, primary_key=True, index=True)
    owner_id        = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # şimdilik opsiyonel

    description     = Column(String(200))
    stored_filename = Column(String(255), unique=True, nullable=False)  # örn: uploads/2025/09/uuid.webp
    content_type    = Column(String(100), nullable=False)
    size_bytes      = Column(Integer, nullable=False)  
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

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