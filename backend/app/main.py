# app/main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text                    # <-- EKLE
from core.database import get_db           # yolun sende farklıysa ona göre bırak

app = FastAPI()

@app.get("/ping-db")
def ping_db(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))  # <-- text(...) kullan
        _ = result.scalar()                    # 1 dönerse bağlantı tamam
        return {"status": "ok", "message": "DB bağlantısı başarılı!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
