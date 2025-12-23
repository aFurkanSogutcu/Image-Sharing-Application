from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from core.database import get_db, engine, Base
from routers import users, auth, posts, ai, hashtags
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from core.config import settings

app = FastAPI()

# media klasörü oluştur + servis et
MEDIA_DIR = Path(settings.MEDIA_ROOT)
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

# tabloları oluştur (dev)
Base.metadata.create_all(bind=engine)

@app.get("/ping-db")
def ping_db(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))
        _ = result.scalar()
        return {"status": "ok", "message": "DB bağlantısı başarılı!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(ai.router)
app.include_router(hashtags.router)
