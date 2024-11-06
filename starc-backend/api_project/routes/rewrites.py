from fastapi import APIRouter, Depends, HTTPException
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session
from api_project.models import Document, TextChunks, Suggestion,FinalScore
from api_project.database import get_db
from api_project.schemas import TextChunkUpdate, TextChunkResponse, SuggestionCreate, SuggestionResponse
from api_project.schemas import ChatRequest, ChatMessage,ChatResponse ,RewriteRequest # Import the Pydantic models
from typing import List,Dict
from api_project.processing import generate_sentence_suggestions ,chat_bot ,rewrite_text_with_prompt,get_scoresSA # Import the function to generate suggestions

rewrite_router = APIRouter()

@rewrite_router.get('/{document_id}', response_model=List[TextChunkResponse])
def get_document_text_chunks(document_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=document_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    text_chunks = db.query(TextChunks).filter_by(document_id=document_id).all()
    if not text_chunks:
        raise HTTPException(status_code=404, detail="Text chunks not found for the given document")
    
    return text_chunks

@rewrite_router.put('/{document_id}', response_model=dict)
def update_text_chunk(document_id: int, text_chunk_update: TextChunkUpdate, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=document_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    text_chunks = db.query(TextChunks).filter_by(document_id=document_id).all()
    if not text_chunks:
        raise HTTPException(status_code=404, detail="Text chunks not found for the given document")

    for text_chunk in text_chunks:
        text_chunk.rewritten_text = text_chunk_update.updated_text_chunk
        db.commit()

    document.word_count = len(text_chunk_update.updated_text_chunk.split())
    db.commit()

    # Generate and save suggestions
    suggestions = generate_sentence_suggestions(text_chunk_update.updated_text_chunk)
    for suggestion in suggestions:
        new_suggestion = Suggestion(
            document_id=document_id,
            input_text_chunk=text_chunk_update.updated_text_chunk,
            rewritten_text=suggestion['suggested']  # Access the 'suggested' value correctly
        )
        db.add(new_suggestion)
    db.commit()

    return {"message": "Text chunk updated successfully"}

@rewrite_router.put('/{document_id}/reset', response_model=dict)
def reset_text_chunk_to_original(document_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=document_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    text_chunk = db.query(TextChunks).filter_by(document_id=document_id).first()
    if not text_chunk:
        raise HTTPException(status_code=404, detail="Text chunk not found for the given document")

    text_chunk.rewritten_text = text_chunk.original_text_chunk
    db.commit()

    return {"message": "Text chunk reset to original text successfully"}

@rewrite_router.post('/{document_id}/suggestions', response_model=List[SuggestionResponse])
def generate_and_save_suggestions(document_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=document_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    text_chunks = db.query(TextChunks).filter_by(document_id=document_id).all()
    if not text_chunks:
        raise HTTPException(status_code=404, detail="Text chunks not found for the given document")
    
    # Delete existing suggestions for the document
    db.query(Suggestion).filter_by(document_id=document_id).delete()
    db.commit()

    # Concatenate all text chunks to form the complete document text
    complete_text = " ".join([chunk.input_text_chunk for chunk in text_chunks])
    print(complete_text)

    suggestions = generate_sentence_suggestions(complete_text)
    
    print(suggestions)
    suggestion_objects = []
    for suggestion in suggestions:
        new_suggestion = Suggestion(
            document_id=document_id,
            input_text_chunk=suggestion['original'],
            rewritten_text=suggestion['suggested']  # Access the 'suggested' value correctly
        )
        db.add(new_suggestion)
        suggestion_objects.append(new_suggestion)
    db.commit()

    return suggestion_objects

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

@rewrite_router.get('/{document_id}/suggestions/apply_all', response_model=dict)
def apply_all_suggestions(document_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    suggestions = db.query(Suggestion).filter_by(document_id=document_id).all()
    if not suggestions:
        raise HTTPException(status_code=404, detail="No suggestions found for the given document")

    text_chunks = db.query(TextChunks).filter_by(document_id=document_id).all()
    if not text_chunks:
        raise HTTPException(status_code=404, detail="Text chunks not found for the given document")

    updated_text = ""
    for suggestion in suggestions:
        for text_chunk in text_chunks:
            if suggestion.input_text_chunk in text_chunk.input_text_chunk:
                text_chunk.input_text_chunk = text_chunk.input_text_chunk.replace(suggestion.input_text_chunk, suggestion.rewritten_text)
                updated_text = text_chunk.input_text_chunk
                db.commit()

    # Update the rewritten_text field to reflect the applied suggestions
    for text_chunk in text_chunks:
        text_chunk.rewritten_text = text_chunk.input_text_chunk
        db.commit()

    # Delete all applied suggestions
    db.query(Suggestion).filter_by(document_id=document_id).delete()
    db.commit()

    return {"message": "All suggestions applied and deleted successfully", "updated_text": updated_text}

@rewrite_router.get('/{document_id}/suggestions/delete_all', response_model=dict)
def delete_all_suggestions(document_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    suggestions = db.query(Suggestion).filter_by(document_id=document_id).all()
    if not suggestions:
        raise HTTPException(status_code=404, detail="No suggestions found for the given document")

    db.query(Suggestion).filter_by(document_id=document_id).delete()
    db.commit()

    return {"message": "All suggestions deleted successfully"}

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
    
@rewrite_router.post('/{document_id}/rewrite', response_model=dict)
def rewrite_text(document_id: int, rewrite_request: RewriteRequest, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=document_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    text_chunk = db.query(TextChunks).filter_by(document_id=document_id).first()
    if not text_chunk:
        raise HTTPException(status_code=404, detail="Text chunk not found for the given document")
    
    print("Received rewrite request:", rewrite_request.prompt)
    print("Text chunk to rewrite:", text_chunk.input_text_chunk)

    rewritten_text = rewrite_text_with_prompt(text_chunk.input_text_chunk, rewrite_request.prompt)
    text_chunk.rewritten_text = rewritten_text
    db.commit()

    # Recalculate and store the scores
    rewritten_scores_data = get_scoresSA(rewritten_text)
    print(rewritten_scores_data)
    final_score = db.query(FinalScore).filter_by(text_chunk_id=text_chunk.id).first()
    if final_score:
        final_score.score = rewritten_scores_data[0]
        final_score.optimism = rewritten_scores_data[1]
        final_score.forecast = rewritten_scores_data[2]
        final_score.confidence = rewritten_scores_data[3]
        db.commit()

    return {"message": "Text rewritten successfully", "rewritten_text": rewritten_text, "scores": rewritten_scores_data}