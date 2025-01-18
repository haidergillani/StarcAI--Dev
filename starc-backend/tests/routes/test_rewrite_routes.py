import pytest
from unittest.mock import patch, AsyncMock, Mock
from api_project.models import TextChunks, Suggestion, Document

@pytest.fixture
def test_document(test_db, test_user):
    document = Document(
        title="Test Document",
        user_id=test_user.id,
        word_count=10
    )
    test_db.add(document)
    test_db.commit()
    return document

@pytest.fixture
def test_text_chunk(test_db, test_document):
    text_chunk = TextChunks(
        document_id=test_document.id,
        input_text_chunk="This is a test text chunk.",
        rewritten_text="This is a rewritten test text chunk."
    )
    test_db.add(text_chunk)
    test_db.commit()
    return text_chunk

@pytest.fixture
def test_suggestion(test_db, test_document):
    suggestion = Suggestion(
        document_id=test_document.id,
        input_text_chunk="Original text",
        rewritten_text="Suggested text"
    )
    test_db.add(suggestion)
    test_db.commit()
    return suggestion

def test_get_suggestions(client, test_tokens, test_suggestion):
    response = client.get(
        f"/fix/{test_suggestion.document_id}/suggestions",
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    suggestions = response.json()
    assert isinstance(suggestions, list)
    assert len(suggestions) > 0
    assert suggestions[0]["input_text_chunk"] == "Original text"
    assert suggestions[0]["rewritten_text"] == "Suggested text"

def test_apply_suggestion(client, test_tokens, test_suggestion, test_text_chunk):
    response = client.put(
        f"/fix/{test_suggestion.document_id}/suggestions/{test_suggestion.id}",
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Suggestion applied and deleted successfully"
    assert "updated_text" in response.json()

def test_delete_suggestion(client, test_tokens, test_suggestion):
    response = client.delete(
        f"/fix/{test_suggestion.document_id}/suggestions/{test_suggestion.id}",
        headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Suggestion deleted successfully"

@pytest.mark.asyncio
async def test_rewrite_text(client, test_tokens, test_text_chunk):
    # Create a regular mock for the synchronous function
    mock_rewrite = Mock(return_value="Rewritten text")
    # Create an async mock for the async function
    mock_scores = AsyncMock(return_value=[0.8, 0.7, 0.6, 0.9])

    with patch('api_project.routes.rewrites.rewrite_text_with_prompt', mock_rewrite), \
         patch('api_project.routes.rewrites.get_scoresSA', mock_scores):
        response = client.post(
            f"/fix/{test_text_chunk.document_id}/rewrite",
            json={"prompt": "Make it better"},
            headers={"Authorization": f"Bearer {test_tokens['access_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Text rewritten successfully"
        assert data["rewritten_text"] == "Rewritten text"
        assert data["scores"] == [0.8, 0.7, 0.6, 0.9]

        # Verify the mock was called correctly
        mock_rewrite.assert_called_once_with(test_text_chunk.input_text_chunk, "Make it better") 