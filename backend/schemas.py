from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class QuestionBase(BaseModel):
    content: str
    display_name: str = "Anonymous"

class QuestionCreate(QuestionBase):
    pass

class QuestionStatusUpdate(BaseModel):
    status: str

class AnswerBase(BaseModel):
    content: str
    display_name: str = "Anonymous"

class AnswerCreate(AnswerBase):
    question_id: int

class QuestionSummary(QuestionBase):
    id: int
    created_at: datetime
    status: str

    class Config:
        from_attributes = True

class Answer(AnswerBase):
    id: int
    created_at: datetime
    question_id: int
    user_id: Optional[int] = None
    question: Optional[QuestionSummary] = None

    class Config:
        from_attributes = True

class Question(QuestionBase):
    id: int
    created_at: datetime
    status: str
    answers: List[Answer] = []
    display_name: Optional[str] = "Anonymous"
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_admin: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
