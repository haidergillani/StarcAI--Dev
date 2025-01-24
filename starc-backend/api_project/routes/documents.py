from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session
from api_project.models import Document, TextChunks, InitialScore, FinalScore, DocumentHistory
from api_project.database import get_db
from api_project.processing import get_scoresSA, get_rewrite, chat_bot, ensure_model_warm
from api_project.schemas import DocumentCreate, DocumentResponse, PDFUploadResponse, ChatBotRequest, ChatBotResponse,SaveRewriteRequest, DocumentHistoryCreate, DocumentHistoryResponse
from pypdf import PdfReader
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, Frame
import io
import logging
from typing import List

documents_router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def process_document(user_id: int, title: str, text: str, db: Session):
    # Ensure model is warm before processing
    await ensure_model_warm()
    
    new_document = Document(title=title, user_id=user_id, word_count=len(text.split()))
    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    new_text_chunk = TextChunks(document_id=new_document.id, input_text_chunk=text)
    original_scores_data = await get_scoresSA(text)
    rewritten_text = get_rewrite(text)
    rewritten_scores_data = await get_scoresSA(rewritten_text)

    new_text_chunk.rewritten_text = rewritten_text
    db.add(new_text_chunk)
    db.commit()
    db.refresh(new_text_chunk)

    initial_score = InitialScore(
        text_chunk_id=new_text_chunk.id,
        score=original_scores_data[0],
        optimism=original_scores_data[1],
        forecast=original_scores_data[2],
        confidence=original_scores_data[3],
    )

    final_score = FinalScore(
        text_chunk_id=new_text_chunk.id,
        score=rewritten_scores_data[0],
        optimism=rewritten_scores_data[1],
        forecast=rewritten_scores_data[2],
        confidence=rewritten_scores_data[3],
    )

    db.add(initial_score)
    db.add(final_score)
    db.commit()

    return new_document

@documents_router.post("", response_model=DocumentResponse)
async def create_document(document: DocumentCreate, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    new_document = await process_document(user_id, document.title, document.text, db)
    return DocumentResponse(
        id=new_document.id,
        title=new_document.title,
        word_count=new_document.word_count
    )

@documents_router.post("/pdf", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...), Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type")

    try:
        pdf_reader = PdfReader(file.file)
        text_content = ""
        for page in pdf_reader.pages:
            text_content += page.extract_text() + "\n"

        new_document = await process_document(user_id, file.filename, text_content, db)
        
        # Retrieve the TextChunks object associated with the new document
        new_text_chunk = db.query(TextChunks).filter_by(document_id=new_document.id).first()

        return {
            "message": "PDF uploaded and document processed",
            "document_id": new_document.id,
            "text_chunk_id": new_text_chunk.id
        }
    except Exception as e:
        logger.error(f"Could not read PDF file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Could not read PDF file: {str(e)}")

@documents_router.post("/refresh", response_model=dict)
def refresh_token(Authorize: AuthJWT = Depends()):
    Authorize.jwt_refresh_token_required()
    current_user = Authorize.get_jwt_subject()
    new_access_token = Authorize.create_access_token(subject=current_user)
    return {"access_token": new_access_token}

@documents_router.delete("/{doc_id}", response_model=dict)
def delete_document(doc_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    db.delete(document)
    db.commit()

    return {"message": "Document and related data deleted successfully"}

@documents_router.put("/{doc_id}", response_model=dict)
async def update_document(doc_id: int, document: DocumentCreate, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    existing_document = db.query(Document).filter_by(id=doc_id, user_id=user_id).first()
    if not existing_document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    if document.text:
        existing_text_chunk = db.query(TextChunks).filter_by(document_id=existing_document.id).first()
        if existing_text_chunk:
            existing_text_chunk.input_text_chunk = document.text
            rewritten_text = get_rewrite(document.text)
            existing_text_chunk.rewritten_text = rewritten_text
            db.commit()
            db.refresh(existing_text_chunk)

            new_text_scores = await get_scoresSA(document.text)

            # Keep initial_score as is - it represents the original text's scores
            initial_score = db.query(InitialScore).filter_by(text_chunk_id=existing_text_chunk.id).first()

            # Update final_score with the new text's scores
            final_score = db.query(FinalScore).filter_by(text_chunk_id=existing_text_chunk.id).first()
            if final_score:
                final_score.score = new_text_scores[0]
                final_score.optimism = new_text_scores[1]
                final_score.forecast = new_text_scores[2]
                final_score.confidence = new_text_scores[3]

            existing_document.word_count = len(document.text.split())
            db.commit()
            db.refresh(initial_score)
            db.refresh(final_score)

            return {
                "message": "Document updated successfully", 
                "document_id": existing_document.id,
                "initial_scores": {
                    "score": initial_score.score,
                    "optimism": initial_score.optimism,
                    "forecast": initial_score.forecast,
                    "confidence": initial_score.confidence
                },
                "final_scores": {
                    "score": final_score.score,
                    "optimism": final_score.optimism,
                    "forecast": final_score.forecast,
                    "confidence": final_score.confidence
                }
            }

    return {"message": "Document updated successfully", "document_id": existing_document.id}

@documents_router.get("/scores/{doc_id}", response_model=list)
def get_final_scores(doc_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    text_chunk = db.query(TextChunks).filter_by(document_id=doc_id).first()
    if not text_chunk:
        raise HTTPException(status_code=404, detail="Text chunk not found for the given document")

    final_scores = db.query(FinalScore).filter_by(text_chunk_id=text_chunk.id).all()
    if not final_scores:
        raise HTTPException(status_code=404, detail="No final scores found for the given document")

    return final_scores

@documents_router.get("/{doc_id}", response_model=dict)
def get_document_details(doc_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    text_chunk = db.query(TextChunks).filter_by(document_id=doc_id).first()
    if not text_chunk:
        raise HTTPException(status_code=404, detail="Text chunk not found for the given document")

    document_details = {
        "id": document.id,
        "title": document.title,
        "word_count": document.word_count,
        "text_chunk": text_chunk.input_text_chunk,
    }

    return document_details
    

@documents_router.get("/pdf/{doc_id}", response_model=dict)
def get_document_as_pdf(doc_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    text_chunk = db.query(TextChunks).filter_by(document_id=doc_id).first()
    if not text_chunk:
        raise HTTPException(status_code=404, detail="Text chunk not found for the given document")

    pdf_buffer = io.BytesIO()
    p = canvas.Canvas(pdf_buffer, pagesize=LETTER)
    width, height = LETTER
    styles = getSampleStyleSheet()
    text = text_chunk.input_text_chunk

    # Create a Frame for the text
    frame = Frame(72, 72, width - 144, height - 144, showBoundary=1)
    story = [Paragraph(text, styles["Normal"])]

    # Add the story to the frame
    frame.addFromList(story, p)

    p.showPage()
    p.save()

    pdf_buffer.seek(0)

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={document.title}.pdf"})

@documents_router.post('/chatbot', response_model=ChatBotResponse)
def chat_with_bot(request: ChatBotRequest, Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()

    try:
        response, log = chat_bot(request.prompt)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)})")
    
    
@documents_router.post("/{doc_id}/save_rewrite", response_model=dict)
def save_rewrite(doc_id: int, request: SaveRewriteRequest, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    text_chunk = db.query(TextChunks).filter_by(document_id=doc_id).first()
    if not text_chunk:
        raise HTTPException(status_code=404, detail="Text chunk not found for the given document")

    text_chunk.input_text_chunk = request.rewritten_text
    db.commit()

    return {"message": "Rewritten text saved successfully"}

@documents_router.post("/{doc_id}/history", response_model=DocumentHistoryResponse)
def save_document_history(doc_id: int, history: DocumentHistoryCreate, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    new_history = DocumentHistory(
        document_id=doc_id,
        content=history.content
    )
    db.add(new_history)
    db.commit()
    db.refresh(new_history)

    return new_history

@documents_router.get("/{doc_id}/history", response_model=List[DocumentHistoryResponse])
def get_document_history(doc_id: int, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    document = db.query(Document).filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    history = db.query(DocumentHistory).filter_by(document_id=doc_id).order_by(DocumentHistory.created_at.desc()).all()
    return history

@documents_router.get("/warmup", response_model=dict)
async def warmup_endpoint(Authorize: AuthJWT = Depends()):
    '''
    Endpoint to warm up the model. This can be called manually if needed.
    '''
    Authorize.jwt_required()
    success = await ensure_model_warm()
    if success:
        return {"status": "success", "message": "Model warmed up successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to warm up model")