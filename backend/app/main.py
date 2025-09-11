from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text    
from core.database import get_db, engine, Base
from routers import users, auth
import models.users

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/ping-db")
def ping_db(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))  # <-- text(...) kullan
        _ = result.scalar()                    # 1 dönerse bağlantı tamam
        return {"status": "ok", "message": "DB bağlantısı başarılı!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

app.include_router(auth.router)
app.include_router(users.router)