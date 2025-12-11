import json
from typing import Any, Dict, Optional
from openai import AsyncAzureOpenAI  # DİKKAT: Azure client
from core.config import settings

AZURE_API_KEY = settings.AZURE_API_KEY
AZURE_ENDPOINT = settings.AZURE_ENDPOINT
AZURE_DEPLOYMENT = settings.AZURE_DEPLOYMENT

if not AZURE_API_KEY or not AZURE_ENDPOINT or not AZURE_DEPLOYMENT:
    raise RuntimeError("Azure OpenAI yapılandırması eksik!")

# Azure client
client = AsyncAzureOpenAI(
    api_key=AZURE_API_KEY,
    azure_endpoint=AZURE_ENDPOINT,
    api_version="2024-02-15-preview",  # önerilen sürüm
)

async def generate_social_post(
    *,
    topic: str,
    tone: str,
    audience: str,
    want_image: bool,
    max_length: int,
) -> Dict[str, Any]:

    system_prompt = (
        # Burada açıkça JSON istediğimizi İngilizce yazıyoruz
        "You are a JSON API. You MUST respond with a single valid JSON object and nothing else. "
        "Respond strictly in JSON format.\n"
        "Sen Türkçe yazan, sosyal medya içerik stratejisti bir metin yazarı AI'sın. "
        "Twitter / LinkedIn / Instagram tarzı gönderiler yazıyorsun. "
        "Görevin, verilen konuya uygun, değer katan, sade ve anlaşılır sosyal medya gönderileri üretmek."
    )

    user_prompt = f"""
KONU: {topic}
TON: {tone}
HEDEF KİTLE: {audience}
MAKSİMUM KARAKTER: {max_length}

AMAÇ:
- İçerik üreticilerine ve sosyal medya kullanıcılarına değer kat.
- Bilgi ver, ufuk aç, pratik bir bakış açısı sun.
- Çok emoji kullanma (maksimum 2-3 tane).
- Hashtag sayısını 3–6 arasında tut (niş ama spam olmayan hashtagler).

LÜTFEN SADECE GEÇERLİ BİR **json** OBJE DÖN. (Başka hiçbir şey yazma.)

ÖRNEK JSON ŞEMASI:

{{
  "content": "Gönderi metni (tek bir sosyal medya postu).",
  "hashtags": ["hashtag1", "hashtag2", "..."],
  "image_prompt": null
}}

AÇIKLAMALAR:
- "content": Türkçe gönderi metni. Tek bir sosyal medya postu olsun.
- "hashtags": 3 ile 6 arası hashtag string'i içeren bir dizi.
- "image_prompt": 
    - Eğer kullanıcı 'want_image' = false ise null.
    - Eğer true ise, stable diffusion / dall-e tarzı bir görsel üretici için net bir İngilizce prompt yaz
      (örn: "A minimalist flat illustration of ...").
"""

    user_prompt += f"\n\nKULLANICI_GÖRSEL_ISTIYOR_MU: {str(want_image).lower()}\n"

    response = await client.chat.completions.create(
        model=AZURE_DEPLOYMENT,
        temperature=0.7,
        response_format={"type": "json_object"},  # JSON mode
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    raw = response.choices[0].message.content
    print("MODEL RAW:", raw)  # ilk seferlerde log'a bakmak için

    data = json.loads(raw)

    return {
        "content": data.get("content", ""),
        "hashtags": data.get("hashtags", []),
        "image_prompt": data.get("image_prompt"),
        "usage": response.usage.model_dump() if response.usage else {},
        "model": AZURE_DEPLOYMENT,
    }

async def rewrite_text(
    *,
    text: str,
    mode: str = "grammar",  # "grammar" | "improve" | "shorten" | "expand"
    target_tone: Optional[str] = None,
    max_length: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Verilen metni, belirtilen moda göre yeniden yazar.
    JSON olarak:
      { "rewritten_text": "..." }
    döndürür.
    """

    # Mode'a göre kısa açıklama
    mode_desc = {
        "grammar": (
            "Sadece gramer ve imla hatalarını düzelt. Anlamı değiştirme, "
            "cümle yapısını mümkün olduğunca koru."
        ),
        "improve": (
            "Metni daha akıcı, anlaşılır ve profesyonel hale getir. "
            "Fazla süslü bir dil kullanma, sade ve net ol."
        ),
        "shorten": (
            "Metni kısalt. Ana mesajı koru ama gereksiz tekrar ve detayları çıkar. "
            "Tweet / kısa sosyal medya postu gibi düşün."
        ),
        "expand": (
            "Metni biraz daha detaylandır. Örnek veya kısa açıklamalar ekleyebilirsin, "
            "ama ana mesajdan sapma."
        ),
    }.get(mode, "Metni iyileştir.")

    # Ton bilgisi
    tone_desc = target_tone or "samimi ve profesyonel"

    # JSON mode için system + user mesajlarını net tanımlayalım
    system_prompt = (
        "You are a JSON API. You MUST respond with a single valid JSON object and nothing else. "
        "Respond strictly in JSON format.\n"
        "Sen Türkçe yazan, sosyal medya ve blog metinleri konusunda uzman bir yazım asistanısın. "
        "Görevin, kullanıcı metnini istenen moda göre yeniden yazmak."
    )

    user_prompt = f"""
ORİJİNAL METİN:
\"\"\"{text}\"\"\"

MOD:
{mode}

MOD AÇIKLAMASI:
{mode_desc}

TON:
{tone_desc}

MAKSİMUM UZUNLUK:
{max_length or 'Belirtilmemiş; gerekirse mantıklı şekilde kısalt'}

LÜTFEN SADECE GEÇERLİ BİR **json** OBJE DÖN.
BAŞKA HİÇBİR AÇIKLAMA YAZMA.

JSON ŞEMASI:

{{
  "rewritten_text": "Yeniden yazılmış Türkçe metin."
}}

AÇIKLAMALAR:
- "rewritten_text": Kullanıcı metninin yeniden yazılmış hali.
- Metin Türkçe olsun.
- Emoji kullanacaksan çok abartma (maksimum 2-3).
"""

    response = await client.chat.completions.create(
        model=AZURE_DEPLOYMENT,
        temperature=0.3,  # rewrite için biraz daha düşük tutulabilir
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    raw = response.choices[0].message.content
    print("REWRITE RAW:", raw)  # debug için

    data = json.loads(raw)

    return {
        "rewritten_text": data.get("rewritten_text", "").strip(),
        "usage": response.usage.model_dump() if response.usage else {},
        "model": AZURE_DEPLOYMENT,
        "mode": mode,
    }
