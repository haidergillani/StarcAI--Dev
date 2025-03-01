from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session
from api_project.models import Document, TextChunks, InitialScore, FinalScore
from api_project.database import get_db
from api_project.processing import get_scoresSA, get_rewrite, chat_bot
from api_project.schemas import DocumentCreate, DocumentResponse, PDFUploadResponse, ChatBotRequest, ChatBotResponse,SaveRewriteRequest
from pypdf import PdfReader
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, Frame
import io
import logging

documents_router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_document(user_id: int, title: str, text: str, db: Session):
    new_document = Document(title=title, user_id=user_id, word_count=len(text.split()))
    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    new_text_chunk = TextChunks(document_id=new_document.id, input_text_chunk=text)
    original_scores_data = get_scoresSA(text)
    rewritten_text = get_rewrite(text)
    rewritten_scores_data = get_scoresSA(rewritten_text)

    new_text_chunk.rewritten_text = rewritten_text
    db.add(new_text_chunk)
    db.commit()
    db.refresh(new_text_chunk)

    initial_score = InitialScore(
        text_chunk_id=new_text_chunk.id,
        score=original_scores_data[0],
        optimism=original_scores_data[1],
        confidence=original_scores_data[2],
        forecast=original_scores_data[3],
    )

    final_score = FinalScore(
        text_chunk_id=new_text_chunk.id,
        score=rewritten_scores_data[0],
        optimism=rewritten_scores_data[1],
        confidence=rewritten_scores_data[2],
        forecast=rewritten_scores_data[3],
    )

    db.add(initial_score)
    db.add(final_score)
    db.commit()

    return new_document

@documents_router.post("", response_model=DocumentResponse)
def create_document(document: DocumentCreate, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    new_document = process_document(user_id, document.title, document.text, db)
    return DocumentResponse(
        id=new_document.id,
        title=new_document.title,
        word_count=new_document.word_count
    )

@documents_router.post("/pdf", response_model=PDFUploadResponse)
def upload_pdf(file: UploadFile = File(...), Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type")

    try:
        pdf_reader = PdfReader(file.file)
        text_content = ""
        for page in pdf_reader.pages:
            text_content += page.extract_text() + "\n"

        new_document = process_document(user_id, file.filename, text_content, db)
        
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
def update_document(doc_id: int, document: DocumentCreate, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    existing_document = db.query(Document).filter_by(id=doc_id, user_id=user_id).first()
    if not existing_document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    if document.title:
        existing_document.title = document.title

    if document.text:
        existing_text_chunk = db.query(TextChunks).filter_by(document_id=existing_document.id).first()
        if existing_text_chunk:
            existing_text_chunk.input_text_chunk = document.text
            rewritten_text = get_rewrite(document.text)
            existing_text_chunk.rewritten_text = rewritten_text
            db.commit()
            db.refresh(existing_text_chunk)

            original_scores_data = get_scoresSA(document.text)
            rewritten_scores_data = get_scoresSA(rewritten_text)

            initial_score = db.query(InitialScore).filter_by(text_chunk_id=existing_text_chunk.id).first()
            if initial_score:
                initial_score.score = original_scores_data[0]
                initial_score.optimism = original_scores_data[1]
                initial_score.forecast = original_scores_data[2]
                initial_score.confidence = original_scores_data[3]

            final_score = db.query(FinalScore).filter_by(text_chunk_id=existing_text_chunk.id).first()
            if final_score:
                final_score.score = rewritten_scores_data[0]
                final_score.optimism = rewritten_scores_data[1]
                final_score.forecast = rewritten_scores_data[2]
                final_score.confidence = rewritten_scores_data[3]

            existing_document.word_count = len(document.text.split())
            db.commit()

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