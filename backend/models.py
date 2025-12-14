from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    full_name = Column(String(100), nullable=False)
    password_hash = Column(String(255))
    is_admin = Column(Boolean, default=False)
    
    answers = relationship("Answer", back_populates="user")
    questions = relationship("Question", back_populates="user")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Status: Pending, Escalated, Answered
    status = Column(String(20), default="Pending")
    display_name = Column(String(100), default="Anonymous")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")
    user = relationship("User", back_populates="questions")

class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    display_name = Column(String(100), default="Anonymous")
    
    question_id = Column(Integer, ForeignKey("questions.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    question = relationship("Question", back_populates="answers")
    user = relationship("User", back_populates="answers")
