import DocThumbnail from "./DocThumbnail";
import SearchBar from "./SearchBar";
import axios, { AxiosResponse } from "axios";
import { useEffect, useState, useCallback } from "react";
import router from "next/router";

interface Document {
  id: number;
  title: string;
  wordCount: number;
  onDelete: (id: number) => void;
}

export default function DocsContainer() {
  const apiUrl = 'http://127.0.0.1:2000/api';

  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (query: string = "", page: number = 1, limit: number = 12) => {
    console.log("Fetching documents with query:", query);
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("No auth token found. Please log in.");
      router.push('/login'); // Redirect to login page
      return;
    }

    try {
      const response = await axios.get(`${apiUrl}/search`, {
        params: {
          q: query,
          page: page,
          limit: limit
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      handleSearchComplete(response);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // Token might be expired, try to refresh it
        try {
          const refreshResponse = await axios.post("http://127.0.0.1:2000/auth/refresh", {}, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          localStorage.setItem("authToken", refreshResponse.data.access_token);
          // Retry fetching documents with new token
          fetchDocuments(query, page, limit);
        } catch (refreshError) {
          setError("Failed to refresh token. Please log in again.");
          router.push('/login'); // Redirect to login page
        }
      } else {
        setError("Failed to fetch documents");
      }
    }
  }, []);

  useEffect(() => {
    console.log("Component mounted, fetching documents...");
    fetchDocuments(); // Fetch documents with default parameters when the component mounts
  }, [fetchDocuments]); // Run once when the component mounts

  const handleDelete = async (docId: number) => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setError("No auth token found. Please log in.");
        router.push('/login'); // Redirect to login page
        return;
      }

      await axios.delete(`http://127.0.0.1:2000/docs/${docId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setDocuments(documents.filter((document) => document.id !== docId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchComplete = (response: AxiosResponse) => {
    switch (response.status) {
      case 200:
        setDocuments(
          response.data.results.map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            wordCount: doc.word_count,
            onDelete: handleDelete,
          })),
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
  };

  const handleDocClick = (id: number) => {
    router.push(`/home/${id}`);
  };

  return (
    <div className="flex h-full flex-col space-y-24 pb-57 pl-116 pr-116 pt-57">
      <div className="text-lg_1 font-medium">Documents</div>
      <div>
        <SearchBar onSearchComplete={fetchDocuments} />
      </div>
      <div className="flex flex-wrap justify-start gap-x-37 gap-y-57 pt-42">
        {error && (
          <div className="text-base font-normal text-black">{error}</div>
        )}
        {documents.length > 0 &&
          documents.map((document: Document) => (
            <div
              key={document.id}
              onClick={() => handleDocClick(document.id)}
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