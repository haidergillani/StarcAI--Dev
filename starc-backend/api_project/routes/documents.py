"""

First few endpoint use Sentences based logic, remove this processing for sentences (and also the tokenizer)
Store them directly as text chunks, trying to keep their formatting as much as possible.

"""


# Import necesary libraries.
from flask import Blueprint, request, jsonify, send_file
from api_project.models import Document, TextChunks, InitialScore, FinalScore
from api_project import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from api_project.processing import get_scores, get_rewrite, chat_bot
from nltk.tokenize import PunktSentenceTokenizer
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
import io

# Set up Punkt to convert text to separate sentences.
tokenizer = PunktSentenceTokenizer()

documents_bp = Blueprint("docs", __name__)


# Generic function to process a document through writing the text of by uploading a pdf.
def process_document(user_id, title, text):
    # Create and save the new document
    new_document = Document(title=title, user_id=user_id, word_count=len(text.split()))
    db.session.add(new_document)
    db.session.commit()

    # Process the text chunk
    new_text_chunk = TextChunks(document_id=new_document.id, input_text_chunk=text)
    original_scores_data = get_scores(text)
    rewritten_text = get_rewrite(text)
    rewritten_scores_data = get_scores(rewritten_text)

    new_text_chunk.rewritten_text = rewritten_text
    db.session.add(new_text_chunk)
    db.session.commit()

    # Store the original and rewritten scores
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

    db.session.add(initial_score)
    db.session.add(final_score)
    db.session.commit()

    # Tokenize and store sentences
    original_sentences = tokenizer.tokenize(text)
    rewritten_sentences = tokenizer.tokenize(rewritten_text)

    for orig, rewr in zip(original_sentences, rewritten_sentences):
        sentence = Sentence(
            text_chunk_id=new_text_chunk.id, original_text=orig, rewritten_text=rewr
        )
        db.session.add(sentence)

    db.session.commit()

    return {
        "message": "Document and text chunk processed successfully",
        "document_id": new_document.id,
        "text_chunk_id": new_text_chunk.id,
    }


# Post doc by writing text.
@documents_bp.route("", methods=["POST"])
@jwt_required()
def create_document():
    data = request.get_json()
    title = data.get("title")
    text = data.get("text")
    user_id = get_jwt_identity()

    if not title or not text:
        return jsonify({"message": "Title and text are required"}), 400

    result = process_document(user_id, title, text)
    return jsonify(result), 200


# Post doc by PDF.
@documents_bp.route("/pdf", methods=["POST"])
@jwt_required()
def upload_pdf():
    # Check if the post request has the file part
    if "pdf" not in request.files:
        return jsonify({"message": "No file part"}), 400
    file = request.files["pdf"]

    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if file.filename == "":
        return jsonify({"message": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)

        try:
            # Read the PDF content
            pdf_reader = PdfReader(file)
            text_content = ""
            for page in pdf_reader.pages:
                text_content += page.extract_text() + "\n"

            # Get the user ID
            user_id = get_jwt_identity()

            # Use the process_document function to handle document processing
            result = process_document(user_id, filename, text_content)

            return (
                jsonify({"message": "PDF uploaded and document processed", **result}),
                201,
            )
        except Exception as e:
            # Return a JSON response with the error message and a 400 status code
            response = jsonify(message="Could not read PDF file", error=str(e))
            response.status_code = 400
            return response


def allowed_file(filename):
    ALLOWED_EXTENSIONS = {"pdf"}
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# Delete doc.
@documents_bp.route("/<int:doc_id>", methods=["DELETE"])
@jwt_required()
def delete_document(doc_id):
    user_id = get_jwt_identity()

    # Retrieve the document to be deleted
    document = Document.query.filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        return jsonify({"message": "Document not found or access denied"}), 404

    # Delete the document, since cascading is opted in the database, all associated content will also be deleted.
    db.session.delete(document)
    db.session.commit()

    return jsonify({"message": "Document and related data deleted successfully"}), 200


# Update doc text or title but not both at the same time. This is because the update for each is made by different buttons on the frontend.
@documents_bp.route("/<int:doc_id>", methods=["PUT"])
@jwt_required()
def update_document(doc_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    # Retrieve the document to be updated
    document = Document.query.filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        return jsonify({"message": "Document not found or access denied"}), 404

    title = data.get("title")
    new_text = data.get("text")

    # Update the title if provided
    if title != document.title:
        document.title = title
        return (
            jsonify(
                {"message": "Title updated successfully", "document_id": document.id}
            ),
            200,
        )

    # If new text is provided, handle the text chunk and related data
    if new_text:
        # Delete existing text chunk and related data
        existing_text_chunk = TextChunks.query.filter_by(
            document_id=document.id
        ).first()
        if existing_text_chunk:
            db.session.delete(existing_text_chunk)
            db.session.commit()

        # Create a new text chunk
        new_text_chunk = TextChunks(document_id=document.id, input_text_chunk=new_text)
        rewritten_text = get_rewrite(new_text)
        new_text_chunk.rewritten_text = rewritten_text
        db.session.add(new_text_chunk)
        db.session.commit()

        # Calculate and save scores
        original_scores_data = get_scores(new_text)
        rewritten_scores_data = get_scores(rewritten_text)

        initial_score = InitialScore(
            text_chunk_id=new_text_chunk.id,
            score=original_scores_data[0],
            optimism=original_scores_data[1],
            forecast=original_scores_data[2],
            confidence=original_scores_data[3],
        )
        db.session.add(initial_score)

        final_score = FinalScore(
            text_chunk_id=new_text_chunk.id,
            score=rewritten_scores_data[0],
            optimism=rewritten_scores_data[1],
            forecast=rewritten_scores_data[2],
            confidence=rewritten_scores_data[3],
        )
        db.session.add(final_score)
        document.word_count = len(new_text_chunk.input_text_chunk.split())
        db.session.commit()

        # Tokenize and store new sentences
        original_sentences = tokenizer.tokenize(new_text)
        rewritten_sentences = tokenizer.tokenize(rewritten_text)

        for orig, rewr in zip(original_sentences, rewritten_sentences):
            new_sentence = Sentence(
                text_chunk_id=new_text_chunk.id, original_text=orig, rewritten_text=rewr
            )
            db.session.add(new_sentence)
        db.session.commit()

    return (
        jsonify({"message": "Text updated successfully", "document_id": document.id}),
        200,
    )


# Get scores for a given doc from processing.py.
@documents_bp.route("/scores/<int:doc_id>", methods=["GET"])
@jwt_required()
def get_original_scores(doc_id):
    user_id = get_jwt_identity()

    # Retrieve the document to ensure it belongs to the user
    document = Document.query.filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        return jsonify({"message": "Document not found or access denied"}), 404

    # Fetch the text chunk related to the document
    text_chunk = TextChunks.query.filter_by(document_id=doc_id).first()
    if not text_chunk:
        return jsonify({"message": "Text chunk not found for the given document"}), 404

    # Fetch and return the original scores
    initial_scores = InitialScore.query.filter_by(text_chunk_id=text_chunk.id).all()
    if not initial_scores:
        return (
            jsonify({"message": "No initial scores found for the given document"}),
            404,
        )

    scores_list = [
        {
            "score": score.score,
            "optimism": score.optimism,
            "forecast": score.forecast,
            "confidence": score.confidence,
        }
        for score in initial_scores
    ]

    return jsonify(scores_list), 200


# Get document text and wordcount to display on home page.
@documents_bp.route("<int:doc_id>", methods=["GET"])
@jwt_required()
def get_document_details(doc_id):
    user_id = get_jwt_identity()

    # Retrieve the document to ensure it belongs to the user
    document = Document.query.filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        return jsonify({"message": "Document not found or access denied"}), 404

    # Fetch the text chunk related to the document
    text_chunk = TextChunks.query.filter_by(document_id=doc_id).first()
    if not text_chunk:
        return jsonify({"message": "Text chunk not found for the given document"}), 404

    # Fetch and order the sentences related to the text chunk
    sentences = (
        Sentence.query.filter_by(text_chunk_id=text_chunk.id)
        .order_by(Sentence.id)
        .all()
    )
    if not sentences:
        return jsonify({"message": "No sentences found for the given document"}), 404

    # Prepare the response data
    document_details = {
        "title": document.title,
        "word_count": document.word_count,
        "sentences_combined": ". ".join(
            [sentence.original_text for sentence in sentences]
        ).replace("\n", " "),
    }

    return jsonify(document_details), 200


# Download doc as a pdf file.
@documents_bp.route("/pdf/<int:doc_id>", methods=["GET"])
@jwt_required()
def get_document_as_pdf(doc_id):
    user_id = get_jwt_identity()

    # Retrieve the document and its text
    document = Document.query.filter_by(id=doc_id, user_id=user_id).first()
    if not document:
        return jsonify({"message": "Document not found or access denied"}), 404

    text_chunk = TextChunks.query.filter_by(document_id=doc_id).first()
    if not text_chunk:
        return jsonify({"message": "Text chunk not found for the given document"}), 404

    # Create a PDF from the text
    pdf_buffer = io.BytesIO()
    p = canvas.Canvas(pdf_buffer, pagesize=LETTER)
    text = text_chunk.input_text_chunk

    # Can customize the PDF generation here
    p.drawString(72, 720, text)

    p.showPage()
    p.save()

    # Return the PDF as a response
    pdf_buffer.seek(0)
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=f"{document.title}.pdf",
        mimetype="application/pdf",
    )

@documents_bp.route('/chatbot', methods=['POST'])
@jwt_required()
def chat_with_bot():
    user_id = get_jwt_identity()
    data = request.get_json()

    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"message": "Prompt is required"}), 400

    try:
        response, log = chat_bot(prompt)
        return jsonify({"response": response}), 200
    except Exception as e:
        return jsonify({"message": "Error processing request", "error": str(e)}), 500