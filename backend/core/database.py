from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession 
# bunu araştır ve sonraki projelerde kullan

# SQLALCHEMY_DATABASE_URL = 'mysql+pymysql://:1234@localhost/ImageAppDatabase'
# postgresql için 'postgresql://postgres:1234@localhost/TodoApplicationDatabase'
# mysql için 'mysql+pymysql://:1234@localhost/TodoApplicationDatabase'
# sqlite için sqlite:///./todosapp.db yazılır.
# todosapp.db silinebilir sqlite3 kullanmayacaksan

# engine = create_engine(SQLALCHEMY_DATABASE_URL) 
# , connect_args={'check_same_thread': False} parametresi sadece sqlite için kullanılır

# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# FastAPI için dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()