from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List

from azure.core.credentials import AzureKeyCredential
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import AnalyzeTextOptions, AnalyzeImageOptions, ImageData
from core.config import settings


@dataclass
class ModerationDecision:
    decision: str   # published | review | blocked
    label: str
    scores: Dict[str, Any]


class AzureContentSafetyService:
    def __init__(self):
        endpoint = settings.CONTENT_SAFETY_ENDPOINT
        key = settings.CONTENT_SAFETY_KEY
        if not endpoint or not key:
            raise RuntimeError("CONTENT_SAFETY_ENDPOINT / CONTENT_SAFETY_KEY missing")

        self.client = ContentSafetyClient(endpoint, AzureKeyCredential(key))

        self.text_block = int(settings.CONTENT_SAFETY_TEXT_BLOCK_SEVERITY)
        self.text_review = int(settings.CONTENT_SAFETY_TEXT_REVIEW_SEVERITY)
        self.img_block = int(settings.CONTENT_SAFETY_IMAGE_BLOCK_SEVERITY)
        self.img_review = int(settings.CONTENT_SAFETY_IMAGE_REVIEW_SEVERITY)

    def analyze_text(self, text: str) -> Dict[str, Any]:
        if not (text or "").strip():
            return {"max_severity": 0, "categories": {}}

        resp = self.client.analyze_text(AnalyzeTextOptions(text=text))
        # categories: Hate, SelfHarm, Sexual, Violence (severity)
        cats = {r.category: int(r.severity) for r in (resp.categories_analysis or [])}
        max_sev = max(cats.values(), default=0)
        return {"max_severity": max_sev, "categories": cats}

    def analyze_images(self, images_bytes: List[bytes]) -> Dict[str, Any]:
        if not images_bytes:
            return {"max_severity": 0, "per_image": []}

        per = []
        max_sev = 0

        for idx, b in enumerate(images_bytes):
            resp = self.client.analyze_image(
                AnalyzeImageOptions(image=ImageData(content=b))
            )
            cats = {r.category: int(r.severity) for r in (resp.categories_analysis or [])}
            sev = max(cats.values(), default=0)
            per.append({"idx": idx, "max_severity": sev, "categories": cats})
            if sev > max_sev:
                max_sev = sev

        return {"max_severity": max_sev, "per_image": per}

    def decide(self, text_result: Dict[str, Any], image_result: Dict[str, Any]) -> ModerationDecision:
        t = int(text_result.get("max_severity", 0))
        i = int(image_result.get("max_severity", 0))
        worst = max(t, i)

        if t >= self.text_block or i >= self.img_block:
            return ModerationDecision("blocked", "unsafe_content", {"text": text_result, "image": image_result})

        if t >= self.text_review or i >= self.img_review:
            return ModerationDecision("review", "needs_review", {"text": text_result, "image": image_result})

        return ModerationDecision("published", "safe", {"text": text_result, "image": image_result})

    def moderate(self, *, text: str, images_bytes: List[bytes]) -> ModerationDecision:
        tr = self.analyze_text(text)
        ir = self.analyze_images(images_bytes)
        return self.decide(tr, ir)


content_safety = AzureContentSafetyService()
    