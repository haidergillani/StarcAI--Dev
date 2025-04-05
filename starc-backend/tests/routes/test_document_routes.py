import pytest
from unittest.mock import patch, MagicMock
from api_project.models import Document, TextChunks, InitialScore, FinalScore
import io

@pytest.fixture
def test_document(test_db, test_user):
    document = Document(
        title="Test Document",
        user_id=test_user.id,
        word_count=5
    )
    test_db.add(document)
    test_db.commit()
    
    text_chunk = TextChunks(
        document_id=document.id,
        input_text_chunk="This is a test document.",
        rewritten_text="This is a test document."
    )
    test_db.add(text_chunk)
    test_db.commit()
    
    initial_score = InitialScore(
        text_chunk_id=text_chunk.id,
        score=0.75,
        optimism=0.6,
        forecast=0.8,
        confidence=0.9
    )
    test_db.add(initial_score)
    
    final_score = FinalScore(
        text_chunk_id=text_chunk.id,
        score=0.85,
        optimism=0.7,
        forecast=0.9,
        confidence=0.95
    )
    test_db.add(final_score)
    test_db.commit()
    
    return document

@pytest.mark.asyncio
async def test_create_document(client, test_tokens):
    with patch('api_project.routes.documents.get_scoresSA', return_value=[0.8, 0.7, 0.6, 0.9]), \
         patch('api_project.routes.documents.ensure_model_warm'):
        
        response = client.post(
            "/docs",
            json={"title": "New Doc", "text": "Test content"},
            headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
        )
        
        assert response.status_code == 200
        assert response.json()["title"] == "New Doc"
        assert "id" in response.json()
        assert "word_count" in response.json()

def test_create_document_unauthorized(client):
    response = client.post(
        "/docs",
        json={"title": "New Doc", "text": "Test content"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_upload_pdf(client, test_tokens):
    # Create a mock PDF file
    pdf_content = b"%PDF-1.4 mock pdf content"
    pdf_file = io.BytesIO(pdf_content)
    
    with patch('api_project.routes.documents.PdfReader') as mock_pdf_reader, \
         patch('api_project.routes.documents.get_scoresSA', return_value=[0.8, 0.7, 0.6, 0.9]), \
         patch('api_project.routes.documents.ensure_model_warm'):
        
        # Mock PDF reader behavior
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Extracted text"
        mock_pdf_reader.return_value.pages = [mock_page]
        
        response = client.post(
            "/docs/pdf",
            files={"file": ("test.pdf", pdf_file, "application/pdf")},
            headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
        )
        
        assert response.status_code == 200
        assert "document_id" in response.json()
        assert "text_chunk_id" in response.json()

def test_delete_document(client, test_tokens, test_document):
    response = client.delete(
        f"/docs/{test_document.id}",
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Document and related data deleted successfully"

def test_delete_nonexistent_document(client, test_tokens):
    response = client.delete(
        "/docs/99999",
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_document(client, test_tokens, test_document):
    with patch('api_project.routes.documents.get_scoresSA', return_value=[0.8, 0.7, 0.6, 0.9]):
        
        response = client.put(
            f"/docs/{test_document.id}",
            json={"title": "Updated Doc", "text": "Updated content"},
            headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
        )
        
        assert response.status_code == 200
        assert "initial_scores" in response.json()
        assert "final_scores" in response.json()

def test_get_document_details(client, test_tokens, test_document):
    response = client.get(
        f"/docs/{test_document.id}",
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Test Document"
    assert "text_chunk" in response.json()

def test_get_final_scores(client, test_tokens, test_document):
    response = client.get(
        f"/docs/scores/{test_document.id}",
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    score = response.json()[0]
    assert "score" in score
    assert "optimism" in score
    assert "forecast" in score
    assert "confidence" in score

def test_search_documents(client, test_tokens, test_document):
    response = client.get(
        "/api/search",
        params={"q": "Test Document"},
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_items" in data
    assert "total_pages" in data
    assert "current_page" in data
    assert "page_size" in data
    assert "results" in data
    assert len(data["results"]) > 0
    assert data["results"][0]["title"] == "Test Document"

def test_search_documents_empty_query(client, test_tokens, test_document):
    response = client.get(
        "/api/search",
        params={"q": ""},
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_items" in data
    assert "results" in data
    assert len(data["results"]) > 0  # Should return all documents when query is empty

def test_search_documents_pagination(client, test_tokens, test_db, test_user):
    # Create multiple test documents
    for i in range(15):  # Create 15 documents to test pagination
        document = Document(
            title=f"Test Document {i}",
            user_id=test_user.id,
            word_count=5
        )
        test_db.add(document)
    test_db.commit()

    # Test first page
    response = client.get(
        "/api/search",
        params={"page": 1, "limit": 10},  # 10 items per page
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["current_page"] == 1
    assert len(data["results"]) == 10
    assert data["total_pages"] == 2

    # Test second page
    response = client.get(
        "/api/search",
        params={"page": 2, "limit": 10},
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["current_page"] == 2
    assert len(data["results"]) == 5  # Should have remaining 5 documents

def test_search_documents_unauthorized(client):
    response = client.get("/api/search", params={"q": "Test"})
    assert response.status_code == 401

def test_search_documents_no_results(client, test_tokens):
    response = client.get(
        "/api/search",
        params={"q": "NonexistentDocument"},
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 0
    assert len(data["results"]) == 0 