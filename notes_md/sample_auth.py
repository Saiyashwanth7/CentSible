from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from pydantic import BaseModel, EmailStr, Field
from typing import Annotated, Optional
from database import sessionLocal, engine
from sqlalchemy.orm import session
from models import User
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import timedelta, datetime, timezone
from jose import jwt, JWTError

# Pydantic models


class UserRequest(BaseModel):
    email: EmailStr
    username: Annotated[str, Field(min_length=3)]
    first_name: Annotated[Optional[str], Field(min_length=1)]
    last_name: Annotated[Optional[str], Field(min_length=1)]
    password: Annotated[str, Field(min_length=8)]
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str


# router initialization

router = APIRouter(prefix="/auth", tags=["auth"])

# Hashing secret key and algorithm
SECRET_KEY = "d5bbc198a5de8cb2e71245d6ee97a9d993f199689a5c0922a1803170274f5be0"
ALGORITHM = "HS256"


def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()


# Dependency Injections:

# This below dependency injection is used for initializing the cryptocontext for hashing
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# This below dependency injection is used for initializing the Database by using get_db function
db_dependency = Annotated[session, Depends(get_db)]


"""This below dependency injection would help in sending the "Form data" 
from OAuth2PasswordRequestForm to required enpoint"""
oauth_bearer = OAuth2PasswordBearer(
    tokenUrl="auth/token"
)  # here auth/token is the endpoint url of login_for_access_token function


def authenticate_user(username: str, password: str, db):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not bcrypt_context.verify(password, user.hashed_password):
        return False
    return user


def create_token(username: str, user_id: int, role: str, expires_delta: timedelta):
    encode = {"sub": username, "id": user_id, "role": role}
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({"exp": expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


async def decode_token(token: Annotated[str, Depends(oauth_bearer)]):
    try:
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM]
        )  # here algorithms must be in list unlike the encoding token part
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        user_role: str = payload.get("role")
        if not username or not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

        return {"sub": username, "id": user_id, "role": user_role}

    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


# Endpoint for User Creation
@router.post("/", response_model=UserRequest, status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency, userrequest: UserRequest):
    new_user = User(
        email=userrequest.email,
        username=userrequest.username,
        first_name=userrequest.first_name,
        last_name=userrequest.last_name,
        hashed_password=bcrypt_context.hash(userrequest.password),
        role=userrequest.role,
        is_active=True,
    )
    db.add(new_user)
    db.commit()

    return UserRequest(
        email=new_user.email,
        username=new_user.username,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        password=userrequest.password,
        role=new_user.role,
    )


# Token creation based on credential
@router.post("/token", response_model=Token, status_code=status.HTTP_200_OK)
async def login_for_access_token(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency
):
    user = authenticate_user(form.username, form.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Failed Authentication"
        )
    token = create_token(user.username, user.id, timedelta(minutes=30))
    return Token(access_token=token, token_type="bearer")
