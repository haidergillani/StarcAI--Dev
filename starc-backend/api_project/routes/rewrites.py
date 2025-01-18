from fastapi import APIRouter, Depends, HTTPException
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session
from api_project.models import Document, TextChunks, Suggestion, FinalScore
from api_project.database import get_db
from api_project.schemas import TextChunkUpdate, TextChunkResponse, SuggestionCreate, SuggestionResponse
from api_project.schemas import ChatRequest, ChatMessage, ChatResponse, RewriteRequest # Import the Pydantic models
from typing import List
from api_project.processing import generate_sentence_suggestions, chat_bot, rewrite_text_with_prompt, get_scoresSA # Import the functions

rewrite_router = APIRouter()

@rewrite_router.get('/{document_id}/suggestions', response_model=List[SuggestionResponse])
def get_suggestions(document_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=document_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    suggestions = db.query(Suggestion).filter_by(document_id=document_id).all()
    return suggestions

@rewrite_router.put('/{document_id}/suggestions/{suggestion_id}', response_model=dict)
def apply_suggestion(document_id: int, suggestion_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    suggestion = db.query(Suggestion).filter_by(id=suggestion_id, document_id=document_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    text_chunk = db.query(TextChunks).filter_by(document_id=document_id).first()
    if not text_chunk:
        raise HTTPException(status_code=404, detail="Text chunk not found for the given document")

    # Replace only the specific part of the text chunk
    text_chunk.input_text_chunk = text_chunk.input_text_chunk.replace(suggestion.input_text_chunk, suggestion.rewritten_text)
    db.commit()

    # Update the rewritten_text field to reflect the applied suggestion
    text_chunk.rewritten_text = text_chunk.input_text_chunk
    db.commit()

    # Delete the applied suggestion
    db.delete(suggestion)
    db.commit()

    return {"message": "Suggestion applied and deleted successfully", "updated_text": text_chunk.input_text_chunk}

@rewrite_router.delete('/{document_id}/suggestions/{suggestion_id}', response_model=dict)
def delete_suggestion(document_id: int, suggestion_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    suggestion = db.query(Suggestion).filter_by(id=suggestion_id, document_id=document_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    db.delete(suggestion)
    db.commit()

    return {"message": "Suggestion deleted successfully"}

@rewrite_router.post('/{document_id}/rewrite', response_model=dict)
async def rewrite_text(document_id: int, rewrite_request: RewriteRequest, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=document_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    text_chunk = db.query(TextChunks).filter_by(document_id=document_id).first()
    if not text_chunk:
        raise HTTPException(status_code=404, detail="Text chunk not found for the given document")

    # Get the rewritten text using the prompt - no await since it's synchronous
    rewritten_text = rewrite_text_with_prompt(text_chunk.input_text_chunk, rewrite_request.prompt)

    # Calculate scores for the rewritten text
    scores = await get_scoresSA(rewritten_text)

    # Update the text chunk with the rewritten text
    text_chunk.rewritten_text = rewritten_text
    db.commit()

    return {
        "message": "Text rewritten successfully",
        "rewritten_text": rewritten_text,
        "scores": scores
    }

@rewrite_router.post('/chat', response_model=ChatResponse)
def chat_with_bot(chat_request: ChatRequest, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()
    
    print("Received chat request:", chat_request)

    # Convert ChatMessage objects to dictionaries
    chat_log = [msg.dict() for msg in chat_request.chat_log]

    try:
        response, updated_chat_log = chat_bot(chat_request.prompt, chat_log)
        # Convert updated chat log back to list of ChatMessage objects
        updated_chat_log = [ChatMessage(**msg) for msg in updated_chat_log]
        return ChatResponse(response=response, chat_log=updated_chat_log)
    except Exception as e:
        print("Error occurred in chat_with_bot endpoint:", str(e))
        raise HTTPException(status_code=500, detail=str(e))