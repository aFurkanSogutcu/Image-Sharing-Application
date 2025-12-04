# from datetime import datetime
# from uuid import uuid4
# from fastapi import Query
# from pydantic import BaseModel, Field
# from sqlalchemy import func
# from .auth import get_current_user
# from core.database import get_db
# from core.config import settings
# from typing import Annotated
# from sqlalchemy.orm import Session
# from models.models import Users
# from fastapi import APIRouter, Depends, File, Form, HTTPException, Path, Request, UploadFile, status
# from pathlib import Path as PPath

# router = APIRouter(
#     #prefix='/images',
#     tags=['images']
# )

# db_dependency = Annotated[Session, Depends(get_db)]
# user_dependency = Annotated[dict, Depends(get_current_user)]

# # class ImageRequest(BaseModel):
# #     description: str = Field(min_length=3, max_length=100)

# def _build_storage_path(original_filename: str) -> tuple[str, PPath]:
#     """
#     Relatif yol + tam dosya yolu üretir.
#     Örn: uploads/2025/09/uuid.webp  ve  /data/uploads/2025/09/uuid.webp
#     """
#     ext = PPath(original_filename or "").suffix or ".bin"
#     now = datetime.now()
#     rel = PPath("uploads") / f"{now:%Y}" / f"{now:%m}" / f"{uuid4().hex}{ext}"
#     full = PPath(settings.MEDIA_ROOT) / rel
#     full.parent.mkdir(parents=True, exist_ok=True)
#     PPath(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
#     return (str(rel).replace("\\", "/"), full)


# @router.get("/", status_code=status.HTTP_200_OK)
# async def read_all(user: user_dependency, db: db_dependency):
#     if user is None:
#         raise HTTPException(status_code=401,
#                             detail='Authentication Failed')
#     return db.query(Images).filter(Images.owner_id == user.get('id')).all()


# @router.get("/me", status_code=status.HTTP_200_OK)
# def my_profile(
#     user: user_dependency,
#     db: db_dependency,
#     limit: int = Query(20, ge=1, le=100),
#     offset: int = Query(0, ge=0),
# ):
#     if user is None:
#         raise HTTPException(status_code=401, detail="Authentication Failed")

#     # Kullanıcı bilgisi
#     me = db.query(Users).filter(Users.id == user.get("id")).first()
#     if not me:
#         raise HTTPException(status_code=404, detail="User not found")

#     # Toplam resim sayısı
#     total = (
#         db.query(func.count(Images.id))
#           .filter(Images.owner_id == me.id)
#           .scalar()
#     )

#     # Benim resimlerim (sayfalı)
#     rows = (
#         db.query(Images)
#           .filter(Images.owner_id == me.id)
#           .order_by(Images.created_at.desc(), Images.id.desc())
#           .limit(limit).offset(offset)
#           .all()
#     )

#     items = [{
#         "id": r.id,
#         "url": f"/media/{r.stored_filename}",
#         "description": r.description,
#         "created_at": r.created_at,
#         "content_type": r.content_type,
#         "size_bytes": getattr(r, "size_bytes", None),
#     } for r in rows]

#     returned = len(items)
#     next_offset = offset + returned if (offset + returned) < total else None

#     return {
#         "owner": {
#             "id": me.id,
#             "username": me.username,
#             "first_name": me.first_name,
#             "last_name": me.last_name,
#             "email": me.email,
#         },
#         "items": items,
#         "page": {
#             "limit": limit,
#             "offset": offset,
#             "returned": returned,
#             "total": total,
#             "has_more": next_offset is not None,
#             "next_offset": next_offset,
#         },
#     }




# @router.get("/{image_id}", status_code=status.HTTP_200_OK)
# async def read_image(user: user_dependency, db: db_dependency, image_id: int = Path(gt=0)):
#     if user is None:
#         raise HTTPException(status_code=401,
#                             detail='Authentication Failed')
#     image_model = db.query(Images).filter(Images.id == image_id).filter(Images.owner_id == user.get('id')).first()
#     if image_model is not None:
#         return image_model
#     raise HTTPException(status_code=404, detail='Image not found')

# @router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_image(
#     user: user_dependency,
#     db: db_dependency,
#     image_id: int = Path(gt=0),
# ):
#     if user is None:
#         raise HTTPException(status_code=401, detail="Authentication Failed")

#     img = (
#         db.query(Images)
#           .filter(Images.id == image_id)
#           .first()
#     )
#     if not img:
#         raise HTTPException(status_code=404, detail="Image not found")

#     if img.owner_id != user.get("id"):
#         raise HTTPException(status_code=403, detail="Not allowed")

#     # Dosyayı diskte sil (besteffort)
#     try:
#         full = (PPath(settings.MEDIA_ROOT) / PPath(img.stored_filename)).resolve()
#         if full.is_file():
#             full.unlink(missing_ok=True)
#     except Exception:
#         # dosya yoksa/yetki yoksa projeyi düşürme
#         pass

#     # Kaydı sil
#     db.delete(img)
#     db.commit()
#     # 204 No Content


# @router.post("/image", status_code=status.HTTP_201_CREATED)
# async def add_image(user: user_dependency, 
#                     db: db_dependency, 
#                     # image_request: ImageRequest,
#                     description: str = Form(...),
#                     file: UploadFile = File(...)):
#     if user is None:
#         raise HTTPException(status_code=401,
#                             detail='Authentication Failed')
    
#     rel_path, full_path = _build_storage_path(file.filename or "upload.bin")

#     written = 0
#     try:
#         with open(full_path, "wb") as out:
#             while True:
#                 chunk = await file.read(1024 * 1024)  # 1MB chunk
#                 if not chunk:
#                     break
#                 written += len(chunk)
#                 out.write(chunk)
#     finally:
#         await file.close()

#     rec = Images(
#         owner_id=user.get("id"),
#         description=description,
#         stored_filename=rel_path,
#         content_type=(file.content_type or "application/octet-stream"),
#         size_bytes=written,  # <-- modelde bu alan olmalı
#     )

#     db.add(rec)
#     db.commit()

# @router.get("/images/feed", status_code=status.HTTP_200_OK)
# def public_feed(db: db_dependency, 
#                 limit: int = Query(20, ge=1, le=100),
#                 offset: int = Query(0, ge=0)):
#     total = db.query(func.count(Images.id)).scalar()

#     rows = (
#         db.query(Images, Users.username)
#             .outerjoin(Users, Users.id == Images.owner_id)
#             .order_by(Images.created_at.desc(), Images.id.desc())
#             .limit(limit)
#             .offset(offset)
#             .all()
#     )

#     items = [
#         {
#             "id": img.id,
#             "url": f"/media/{img.stored_filename}",
#             "description": img.description,
#             "created_at": img.created_at,
#             "content_type": img.content_type,
#             "size_bytes": getattr(img, "size_bytes", None),
#             "owner": {"id": img.owner_id, "username": username} if img.owner_id else None,
#         }
#         for (img, username) in rows
#     ]

#     returned = len(items)
#     next_offset = offset + returned if offset + returned < total else None

#     return {
#         "items": items,
#         "page": {
#             "limit": limit,
#             "offset": offset,
#             "returned": returned,
#             "total": total,
#             "has_more": next_offset is not None,
#             "next_offset": next_offset,
#         }
#     }



# # en üstte (gerekliyse) import:
# from models.models import Users
# from sqlalchemy import func
# from fastapi import Query

# @router.get("/images/{user_id}", status_code=status.HTTP_200_OK)
# def images_by_username(
#     user_id: int,
#     db: db_dependency,
#     limit: int = Query(20, ge=1, le=100),
#     offset: int = Query(0, ge=0),
# ):
#     # 1) Kullanıcı var mı?
#     user = db.query(Users).filter(Users.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     # 2) Toplam kaç görseli var?
#     total = (
#         db.query(func.count(Images.id))
#           .filter(Images.owner_id == user.id)
#           .scalar()
#     )

#     # 3) Kullanıcının görselleri (sayfalı)
#     rows = (
#         db.query(Images)
#           .filter(Images.owner_id == user.id)
#           .order_by(Images.created_at.desc(), Images.id.desc())
#           .limit(limit).offset(offset)
#           .all()
#     )

#     items = [{
#         "id": r.id,
#         "url": f"/media/{r.stored_filename}",
#         "description": r.description,
#         "created_at": r.created_at,
#         "content_type": r.content_type,
#         "size_bytes": getattr(r, "size_bytes", None),
#     } for r in rows]

#     returned = len(items)
#     next_offset = offset + returned if (offset + returned) < total else None

#     return {
#         "owner": {"id": user.id, "username": user.username},
#         "items": items,
#         "page": {
#             "limit": limit,
#             "offset": offset,
#             "returned": returned,
#             "total": total,
#             "has_more": next_offset is not None,
#             "next_offset": next_offset,
#         },
#     }