from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    login_identifier: str
    password: str

class TokenResponse(BaseModel):
    access_token: str

class DocumentCreate(BaseModel):
    title: str
    text: str

class DocumentResponse(BaseModel):
    id: int
    title: str
    word_count: int

    class Config:
        orm_mode = True

class PDFUploadResponse(BaseModel):
    message: str
    document_id: int
    text_chunk_id: int

class TextChunkUpdate(BaseModel):
    updated_text_chunk: str

class TextChunkResponse(BaseModel):
    id: int
    input_text_chunk: str
    rewritten_text: str
    document_id: int

    class Config:
        orm_mode = True

class ChatBotRequest(BaseModel):
    prompt: str

class ChatBotResponse(BaseModel):
    response: str

class SearchResponse(BaseModel):
    total_items: int
    total_pages: int
    current_page: int
    page_size: int
    results: list[DocumentResponse]

    class Config:
        orm_mode = True

class SuggestionCreate(BaseModel):
    document_id: int
    input_text_chunk: str
    rewritten_text: str

class SuggestionResponse(BaseModel):
    id: int
    document_id: int
    input_text_chunk: str
    rewritten_text: str

    class Config:
        orm_mode = True
        
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    prompt: str
    chat_log: List[ChatMessage]
    
class ChatResponse(BaseModel):
    response: str
    chat_log: List[ChatMessage]
    
class RewriteRequest(BaseModel):
    prompt: str
    
class SaveRewriteRequest(BaseModel):
       rewritten_text: str