"""

Ensure logic works smoothly with TextChunk being the unit of text being changed


"""


# Import necessary libraries
from flask import Blueprint, jsonify
from api_project.models import Document, TextChunks
from api_project import db
from flask_jwt_extended import jwt_required, get_jwt_identity

# Define the Blueprint for 'rewrite'
rewrite_bp = Blueprint('rewrite', __name__)

@rewrite_bp.route('/<int:document_id>', methods=['GET'])
@jwt_required()
def get_document_text_chunk(document_id):
    user_id = get_jwt_identity()

    # Retrieve the document to ensure it belongs to the user
    document = Document.query.filter_by(id=document_id, user_id=user_id).first()
    if not document:
        return jsonify({"message": "Document not found or access denied"}), 404

    # Fetch the text chunk related to the document
    text_chunk = TextChunks.query.filter_by(document_id=document_id).first()
    if not text_chunk:
        return jsonify({"message": "Text chunk not found for the given document"}), 404

    # Prepare the response data
    text_chunk_data = {
        "text_chunk_id": text_chunk.id,
        "original_text_chunk": text_chunk.original_text_chunk,
        "rewritten_text_chunk": text_chunk.rewritten_text_chunk
    }

    return jsonify(text_chunk_data), 200

@rewrite_bp.route('/<int:document_id>', methods=['PUT'])
@jwt_required()
def update_text_chunk(document_id):
    user_id = get_jwt_identity()
    # Data to update should be retrieved from request body
    updated_text_chunk = request.json.get('updated_text_chunk')

    # Validate the document
    document = Document.query.filter_by(id=document_id, user_id=user_id).first()
    if not document:
        return jsonify({"message": "Document not found or access denied"}), 404

    # Fetch the text chunk related to the document
    text_chunk = TextChunks.query.filter_by(document_id=document_id).first()
    if not text_chunk:
        return jsonify({"message": "Text chunk not found for the given document"}), 404

    # Update the text chunk
    text_chunk.rewritten_text_chunk = updated_text_chunk
    db.session.commit()

    # Update the word count of the document
    document.word_count = len(updated_text_chunk.split())
    db.session.commit()

    return jsonify({"message": "Text chunk updated successfully"}), 200

@rewrite_bp.route('/<int:document_id>/reset', methods=['PUT'])
@jwt_required()
def reset_text_chunk_to_original(document_id):
    user_id = get_jwt_identity()

    # Validate the document
    document = Document.query.filter_by(id=document_id, user_id=user_id).first()
    if not document:
        return jsonify({"message": "Document not found or access denied"}), 404

    # Fetch the text chunk related to the document
    text_chunk = TextChunks.query.filter_by(document_id=document_id).first()
    if not text_chunk:
        return jsonify({"message": "Text chunk not found for the given document"}), 404

    # Reset the rewritten text to match the original text
    text_chunk.rewritten_text_chunk = text_chunk.original_text_chunk
    db.session.commit()

    return jsonify({"message": "Text chunk reset to original text successfully"}), 200
