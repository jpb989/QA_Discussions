from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import timedelta
import time

from typing import Optional, List

from database import engine, Base, get_db
import models
import schemas
import crud
import auth
from socket_manager import manager

# Create database tables
time.sleep(5) 
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Error creating tables: {e}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# Auth Routes
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.crud.get_user(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = auth.crud.get_user(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check username uniqueness too
    existing_username = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    return crud.create_user(db=db, user=user)

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/users/", response_model=list[schemas.User])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_users(db, skip=skip, limit=limit)

@app.put("/users/{user_id}/promote", response_model=schemas.User)
def promote_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = crud.make_user_admin(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}/revoke", response_model=schemas.User)
def revoke_user_admin(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own admin status")

    user = crud.revoke_user_admin(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Question Routes
@app.post("/questions/", response_model=schemas.Question)
async def create_question(
    question: schemas.QuestionCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="token", auto_error=False))
):
    user_id = None
    if token:
        try:
             payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
             email: str = payload.get("sub")
             if email:
                 user = auth.crud.get_user(db, email=email)
                 if user:
                     user_id = user.id
        except Exception:
            pass

    db_question = crud.create_question(db=db, question=question, user_id=user_id)
    # Broadcast new question
    await manager.broadcast({
        "type": "new_question",
        "data": {
            "id": db_question.id,
            "content": db_question.content,
            "status": db_question.status,
            "created_at": db_question.created_at.isoformat(),
            "display_name": db_question.display_name,
            "answers": []
        }
    })
    return db_question

@app.get("/users/me/questions", response_model=list[schemas.Question])
def read_my_questions(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.get_user_questions(db, user_id=current_user.id)

@app.get("/users/me/answers", response_model=list[schemas.Answer])
def read_my_answers(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.get_user_answers(db, user_id=current_user.id)

@app.get("/questions/", response_model=list[schemas.Question])
def read_questions(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    questions = crud.get_questions(db, skip=skip, limit=limit, status=status)
    return questions

@app.get("/questions/{question_id}", response_model=schemas.Question)
def read_question(question_id: int, db: Session = Depends(get_db)):
    db_question = crud.get_question(db, question_id=question_id)
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_question

@app.put("/questions/{question_id}/status", response_model=schemas.Question)
async def update_question_status(
    question_id: int, 
    update_data: schemas.QuestionStatusUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    updated_question = crud.update_question_status(db, question_id, update_data.status)
    if not updated_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Broadcast update
    await manager.broadcast({
        "type": "update_question",
        "data": {
            "id": updated_question.id,
            "status": updated_question.status
        }
    })
    return updated_question

# WebSocket
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Answer Routes
@app.post("/answers/", response_model=schemas.Answer)
async def create_answer(
    answer: schemas.AnswerCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="token", auto_error=False)) 
):
    user_id = None
    if token:
        try:
             payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
             email: str = payload.get("sub")
             if email:
                 user = auth.crud.get_user(db, email=email)
                 if user:
                     user_id = user.id
        except Exception:
            pass 
            
    db_answer = crud.create_answer(db=db, answer=answer, user_id=user_id)
    
    # Broadcast new answer
    await manager.broadcast({
        "type": "new_answer",
        "data": {
            "id": db_answer.id,
            "question_id": db_answer.question_id,
            "display_name": db_answer.display_name,
            "content": db_answer.content,
            "created_at": db_answer.created_at.isoformat()
        }
    })
    
    # Also broadcast question update if status changed
    updated_q = crud.get_question(db, answer.question_id)
    if updated_q:
         await manager.broadcast({
            "type": "update_question",
            "data": {
                "id": updated_q.id,
                "status": updated_q.status
            }
        })

    return db_answer

@app.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    question = crud.delete_question(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    await manager.broadcast({
        "type": "delete_question",
        "data": {"id": question_id}
    })
    return None

@app.delete("/answers/{answer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_answer(
    answer_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    answer = crud.delete_answer(db, answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    await manager.broadcast({
        "type": "delete_answer",
        "data": {
            "id": answer_id,
            "question_id": answer.question_id
        }
    })
    return None


