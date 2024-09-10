from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session
from api_project.models import Document
from api_project.database import get_db
from api_project.schemas import DocumentResponse, SearchResponse

search_router = APIRouter()

@search_router.get('/search', response_model=SearchResponse)
def search_documents(
    q: str = Query('', alias='q'),
    page: int = Query(1, alias='page'),
    limit: int = Query(12, alias='limit'),
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    # ... existing code ...

    total_docs_count = db.query(Document).filter(Document.user_id == user_id).count()
    if total_docs_count == 0:
        raise HTTPException(status_code=204, detail="No docs found")

    total_count = db.query(Document).filter(
        Document.user_id == user_id,
        Document.title.like(f'%{q}%')
    ).count()

    if total_count == 0:
        response = {
            "total_items": 0,
            "total_pages": 0,
            "current_page": page,
            "page_size": limit,
            "results": []
        }
        return response

    matching_documents = db.query(Document).filter(
        Document.user_id == user_id,
        Document.title.like(f'%{q}%')
    ).limit(limit).offset((page - 1) * limit).all()

    results = [DocumentResponse(id=doc.id, title=doc.title, word_count=doc.word_count) for doc in matching_documents]

    response = {
        "total_items": total_count,
        "total_pages": (total_count + limit - 1) // limit,
        "current_page": page,
        "page_size": limit,
        "results": results
    }

    return response