from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime

from core.database import get_db
from routers.auth import get_current_user
from models.models import AIRequests
# from your_ai_client import generate_text  # kendi OpenAI/Azure wrapper'ın gibi düşün

router = APIRouter(prefix="/ai", tags=["ai"])

class GeneratePostRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=200)
    tone: str | None = Field(default=None, description="örn: profesyonel, samimi, mizahi")
    audience: str | None = Field(default=None, description="örn: B2B SaaS, girişimciler, developerlar")
    max_length: int = Field(default=280, ge=50, le=1000)

class GeneratePostResponse(BaseModel):
    suggested_content: str

@router.post("/generate-post", response_model=GeneratePostResponse)
async def generate_post(
    body: GeneratePostRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user is None:
        raise HTTPException(status_code=401, detail="Auth required")

    prompt = f"""
Konu: {body.topic}
Ton: {body.tone or "profesyonel ve samimi"}
Hedef kitle: {body.audience or "LinkedIn / Twitter'da içerik tüketen profesyoneller"}

Bu konu için sosyal medya gönderisi üret.
- Maksimum {body.max_length} karakter civarında olsun.
- Türkçe yaz.
- Gereksiz emoji veya aşırı süslü dil kullanma.
- İçerik üreticileri için değer katıcı bir mini içgörü / ipucu içersin.
"""

    # Burada hayali bir AI client kullanıyorum, sen kendi OpenAI/Azure çağrını koyacaksın:
    # ai_text = await generate_text(prompt)
    ai_text = "Buraya senin OpenAI/Azure çağrından dönen metin gelecek."

    # AIRequests log kaydı
    req = AIRequests(
        user_id=user["id"],
        type="generate_post",
        input_text=prompt,
        output_text=ai_text,
        model_name="gpt-4o-mini",        # gerçek model adını koy
        meta={"temperature": 0.7},
        status="success",
    )
    db.add(req)
    db.commit()

    return GeneratePostResponse(suggested_content=ai_text)
