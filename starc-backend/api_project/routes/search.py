"""

Likely no changes needed here

"""


# Import necesary libraries, register blueprints.
from flask import Blueprint, request, jsonify
from api_project.models import Document
from flask_jwt_extended import jwt_required, get_jwt_identity

search_bp = Blueprint('search_bp', __name__)

# Search a users docs to show on the documents page.
@search_bp.route('/search', methods=['GET'])
@jwt_required()
def search_documents():
    user_id = get_jwt_identity()  # Get the user ID from the JWT token

    query_text = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 12, type=int)

    # Check if there are any documents in the database for the user
    total_docs_count = Document.query.count()
    if total_docs_count == 0:
        return jsonify({"message": "No docs found"}), 204

    # Filter documents by user ID and query text, and calculate total number of matching documents
    total_count = Document.query.filter(
        Document.user_id == user_id,
        Document.title.like(f'%{query_text}%')
    ).count()

    if total_count == 0:
        return jsonify({"message": "No matching documents found"}), 200

    # Perform a paginated search filtered by user ID
    matching_documents = Document.query.filter(
        Document.user_id == user_id,
        Document.title.like(f'%{query_text}%')
    ).limit(limit).offset((page - 1) * limit).all()

    # Construct a list of dictionaries with document id, title, and word count
    results = [{
        'id': doc.id,
        'title': doc.title,
        'word_count': doc.word_count
    } for doc in matching_documents]

    # Include pagination information in the response
    response = {
        "total_items": total_count,
        "total_pages": (total_count + limit - 1) // limit,  # Calculate total pages
        "current_page": page,
        "page_size": limit,
        "results": results
    }

    return jsonify(response), 200
