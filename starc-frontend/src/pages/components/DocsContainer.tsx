import DocThumbnail from "./DocThumbnail";
import SearchBar from "./SearchBar";
import axios from "axios";
import type { AxiosResponse, AxiosError } from "axios";
import { useState, useCallback } from "react";
import router from "next/router";

interface Document {
  id: number;
  title: string;
  wordCount: number;
  onDelete: (id: number) => void;
}

interface SearchResponse {
  results: Array<{
    id: number;
    title: string;
    word_count: number;
  }>;
}

interface RefreshResponse {
  access_token: string;
}

interface DocumentResponse {
  id: number;
  title: string;
  text_chunk: string;
}

interface ScoreResponse {
  score: number;
  optimism: number;
  forecast: number;
  confidence: number;
}

export default function DocsContainer() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';

  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(async (docId: number) => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setError("No auth token found. Please log in.");
        await router.push('/login');
        return;
      }

      await axios.delete(`${API_URL}/docs/${docId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setDocuments(prev => prev.filter(document => document.id !== docId));
    } catch (error) {
      console.error(error);
    }
  }, [API_URL]);

  const handleSearchComplete = useCallback((response: AxiosResponse<SearchResponse>) => {
    switch (response.status) {
      case 200:
        setDocuments(
          response.data.results.map((doc) => ({
            id: doc.id,
            title: doc.title,
            wordCount: doc.word_count,
            onDelete: handleDelete,
          }))
        );
        setError(null);
        break;
      case 204:
        setDocuments([]);
        setError("No documents exist");
        break;
      default:
        setError("An error occurred");
    }
  }, [handleDelete]);

  const fetchDocuments = useCallback(async (query = "", page = 1, limit = 12) => {
    console.log("Fetching documents with query:", query, page, limit);
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("No auth token found. Please log in.");
      void router.push('/login');
      return;
    }

    try {
      const response = await axios.get<SearchResponse>(`${API_URL}/api/search`, {
        params: { q: query, page, limit },
        headers: { Authorization: `Bearer ${authToken}` },
      });
      handleSearchComplete(response);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        try {
          const refreshResponse = await axios.post<RefreshResponse>(
            `${API_URL}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          localStorage.setItem("authToken", refreshResponse.data.access_token);
          await fetchDocuments(query, page, limit);
        } catch (refreshError) {
          setError("Failed to refresh token. Please log in again.");
          void router.push('/login');
        }
      } else {
        setError("Failed to fetch documents");
      }
    }
  }, [handleSearchComplete, API_URL]);

  const handleDocClick = useCallback(async (id: number) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("No auth token found. Please log in.");
      await router.push('/login');
      return;
    }

    await router.push(`/home/${id}`);
  }, []);

  return (
    <div className="flex h-full flex-col space-y-24 pb-57 pl-116 pr-116 pt-57">
      <div className="text-lg_1 font-medium">Documents</div>
      <div>
        <SearchBar onSearchComplete={fetchDocuments} />
      </div>
      <div className="flex flex-wrap justify-start gap-x-37 gap-y-57 pt-42">
        {error && (
          <div className="text-base font-normal text-black dark:text-gray-200">{error}</div>
        )}
        {documents.length > 0 &&
          documents.map((document: Document) => (
            <div
              key={document.id}
              onClick={() => void handleDocClick(document.id)}
              className="cursor-pointer"
            >
              <DocThumbnail
                key={document.id}
                id={document.id}
                title={document.title}
                wordCount={document.wordCount}
                onDelete={handleDelete}
              />
            </div>
          ))}
      </div>
    </div>
  );
}