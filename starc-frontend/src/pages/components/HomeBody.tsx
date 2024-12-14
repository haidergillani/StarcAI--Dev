import React, { useRef, useState, useEffect, useCallback } from "react";
import Content from "./Content";
import Sidebar from "./Sidebar";
import ScoreContainer from "./ScoreContainer";
import Chatbot from "./Chatbot";
import axios from "axios";
import debounce from "lodash/debounce";

// Add interfaces for API responses
interface DocumentResponse {
  title: string;
  text_chunk: string;
}

interface ErrorResponse {
  response: {
    status: number;
  };
}

export default function HomeBody() {
  const scoreContainerRef = useRef<{ fetchScores: () => void } | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const suggestionsContainerRef = useRef<{ fetchSuggestions: () => void } | null>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';

  const handleSave = useCallback(() => {
    if (scoreContainerRef.current) {
      scoreContainerRef.current.fetchScores();
    }
  }, []);

  const handleUpdateText = useCallback((newText: string) => {
    setText(newText);
  }, [setText]);

  useEffect(() => {
    const openDocId = localStorage.getItem("openDocId");
    if (openDocId) {
      setDocumentId(parseInt(openDocId, 10));
      // Fetch scores when document ID changes
      if (scoreContainerRef.current) {
        scoreContainerRef.current.fetchScores();
      }
    }
  }, []);

  const debouncedFetchDocument = useCallback(
    debounce(async () => {
      const openDocId = localStorage.getItem("openDocId");
      if (!openDocId) return;

      const authToken = localStorage.getItem("authToken");
      try {
        const response = await axios.get<DocumentResponse>(
          `${API_URL}/docs/${openDocId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (response.status === 200) {
          setTitle(response.data.title);
          setText(response.data.text_chunk);
        }
      } catch (error: unknown) {
        const typedError = error as ErrorResponse;
        if (typedError.response && typedError.response.status === 404) {
          console.error("Document not found or access denied");
        } else {
          console.error(error);
        }
      }
    }, 5000),
    [API_URL, setTitle, setText]
  );

  useEffect(() => {
    const openDocId = localStorage.getItem("openDocId");
    if (openDocId) {
      void debouncedFetchDocument();
    }
    return () => {
      debouncedFetchDocument.cancel();
    };
  }, [debouncedFetchDocument]);

  return (
    <div className="flex w-screen h-screen overflow-x-hidden"> {/* Added overflow-x-hidden */}
      <div className="absolute ml-[80px] mt-[15px] text-[45px] text-gray-500 font-bold">
        {title} 
      </div>
      <div className="w-[32%] p-4 min-w-250">
        <Chatbot />
      </div>
      <div className="flex-1 py-4 w-[28%]">
        <Content onSave={handleSave} onUpdateText={handleUpdateText} text={text} setText={setText} title={title} />
      </div>
      <div className="w-[30%] pt-35 pb-42 pr-33 min-w-250">
        <ScoreContainer ref={scoreContainerRef} text={text} />
        {documentId && <Sidebar documentId={documentId} onUpdateText={handleUpdateText} suggestionsContainerRef={suggestionsContainerRef} setText={setText} />}
      </div>
    </div>
  );
}