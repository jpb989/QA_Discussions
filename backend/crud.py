from sqlalchemy.orm import Session
import models
import schemas
import auth

def get_user(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    fake_hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        username=user.username,
        full_name=user.full_name, 
        password_hash=fake_hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

from sqlalchemy import case

def get_questions(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.Question)
    if status and status != "All":
        query = query.filter(models.Question.status == status)
    
    query = query.order_by(
        case(
            (models.Question.status == "Escalated", 1),
            else_=2
        ),
        models.Question.created_at.desc()
    )
    return query.offset(skip).limit(limit).all()

def create_question(db: Session, question: schemas.QuestionCreate, user_id: int = None):
    db_question = models.Question(content=question.content, display_name=question.display_name, user_id=user_id)
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def update_question_status(db: Session, question_id: int, status: str):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if db_question:
        db_question.status = status
        db.commit()
        db.refresh(db_question)
    return db_question


def get_question(db: Session, question_id: int):
    return db.query(models.Question).filter(models.Question.id == question_id).first()

def create_answer(db: Session, answer: schemas.AnswerCreate, user_id: int = None):
    db_answer = models.Answer(**answer.model_dump(), user_id=user_id)
    db.add(db_answer)
    
    # Auto-escalate question status
    db_question = db.query(models.Question).filter(models.Question.id == answer.question_id).first()
    if db_question and db_question.status == "Pending":
       db_question.status = "Escalated"
       db.add(db_question)

    db.commit()
    db.refresh(db_answer)
    return db_answer

def get_question_answers(db: Session, question_id: int):
    return db.query(models.Answer).filter(models.Answer.question_id == question_id).all()

def get_user_questions(db: Session, user_id: int):
    return db.query(models.Question).filter(models.Question.user_id == user_id).order_by(models.Question.created_at.desc()).all()

def get_user_answers(db: Session, user_id: int):
    return db.query(models.Answer).filter(models.Answer.user_id == user_id).order_by(models.Answer.created_at.desc()).all()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def make_user_admin(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.is_admin = True
        db.commit()
        db.refresh(user)
    return user

def revoke_user_admin(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.is_admin = False
        db.commit()
        db.refresh(user)
    return user

def delete_question(db: Session, question_id: int):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if question:
        db.delete(question)
        db.commit()
    return question

def delete_answer(db: Session, answer_id: int):
    answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
    if answer:
        db.delete(answer)
        db.commit()
    return answer
