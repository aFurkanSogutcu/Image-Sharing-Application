from core.database import Base
from sqlalchemy import Column, Integer, String, Boolean

class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True)       
    username = Column(String(45), unique=True)     
    first_name = Column(String(45))               
    last_name = Column(String(45))                 
    hashed_password = Column(String(200))          
    is_active = Column(Boolean, default=True)
    role = Column(String(45)) 