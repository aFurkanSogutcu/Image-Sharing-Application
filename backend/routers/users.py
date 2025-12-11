from fastapi import APIRouter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from routers.auth import get_current_user
from models.models import Users

router = APIRouter(
    prefix='/users',
    tags=['users']
)

@router.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(Users).filter(Users.id == current_user["id"]).first()

    return {
        "id": user.id,  
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }
