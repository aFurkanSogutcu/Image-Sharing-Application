from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from core.database import get_db
from routers.auth import get_current_user
from models.models import AIRequests
from core.ai_client import generate_social_post, rewrite_text

router = APIRouter(prefix="/ai", tags=["ai"])

class GeneratePostRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=200)
    tone: str | None = Field(default=None, description="profesyonel, samimi, mizahi vb.")
    audience: str | None = Field(default=None, description="girişimciler, developerlar, içerik üreticileri vb.")
    want_image: bool = False
    max_length: int = Field(default=280, ge=50, le=1000)

class GeneratePostResponse(BaseModel):
    content: str
    suggested_hashtags: list[str] | None = None
    image_prompt: str | None = None

class RewritePostRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    mode: str = Field(
        default="grammar",
        description="grammar | improve | shorten | expand"
    )
    target_tone: str | None = Field(
        default=None,
        description="İstenirse hedef ton: samimi, resmi, mizahi vb."
    )
    max_length: int | None = Field(
        default=None,
        description="İstersen maksimum uzunluk (karakter). Özellikle 'shorten' için."
    )

class RewritePostResponse(BaseModel):
    rewritten_text: str
    # İleride istersen burada safety_label vs. de ekleyebilirsin.

@router.post("/generate-post", response_model=GeneratePostResponse)
async def generate_post(
    body: GeneratePostRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user is None:
        raise HTTPException(status_code=401, detail="Auth required")

    tone = body.tone or "profesyonel ve samimi"
    audience = body.audience or "genel sosyal medya kullanıcıları"

    stored_prompt = (
        f"Konu: {body.topic}\n"
        f"Ton: {tone}\n"
        f"Hedef kitle: {audience}\n"
        f"Maksimum karakter: {body.max_length}\n"
        f"Want image: {body.want_image}"
    )

    # --- DEBUG MODU: try/except'i kaldır / çok hafif bırak ---
    ai_result = await generate_social_post(
        topic=body.topic,
        tone=tone,
        audience=audience,
        want_image=body.want_image,
        max_length=body.max_length,
    )

    ai_text = ai_result["content"]
    suggested_hashtags = ai_result.get("hashtags", [])
    image_prompt = ai_result.get("image_prompt")
    model_name = ai_result.get("model", "openai-unknown")
    meta = ai_result.get("usage", {})

    req = AIRequests(
        user_id=user["id"],
        type="generate_post",
        input_text=stored_prompt,
        output_text=ai_text,
        model_name=model_name,
        meta=meta,
        status="success",
    )
    db.add(req)
    db.commit()

    return GeneratePostResponse(
        content=ai_text,
        suggested_hashtags=suggested_hashtags,
        image_prompt=image_prompt,
    )


@router.post("/rewrite-post", response_model=RewritePostResponse)
async def rewrite_post(
    body: RewritePostRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user is None:
        raise HTTPException(status_code=401, detail="Auth required")

    original_text = body.text

    status_str = "success"
    rewritten = original_text
    model_name = "azure-openai"
    meta: dict = {"mode": body.mode}

    try:
        ai_result = await rewrite_text(
            text=original_text,
            mode=body.mode,
            target_tone=body.target_tone,
            max_length=body.max_length,
        )
        rewritten = ai_result["rewritten_text"]
        model_name = ai_result.get("model", "azure-openai")
        meta.update(ai_result.get("usage", {}))
    except Exception as e:
        # rewrite çökse bile API'yi patlatmayalım, orijinali döneriz
        status_str = "error"
        rewritten = original_text
        meta["error"] = str(e)

    # Log'la
    req = AIRequests(
        user_id=user["id"],
        type="rewrite",
        input_text=original_text,
        output_text=rewritten,
        model_name=model_name,
        meta=meta,
        status=status_str,
    )
    db.add(req)
    db.commit()

    return RewritePostResponse(rewritten_text=rewritten)
