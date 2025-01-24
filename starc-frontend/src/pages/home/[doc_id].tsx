// pages/home/[doc_id].tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import HomeBody from '../components/HomeBody';
import Menu from '../components/Menu';
import debounce from 'lodash/debounce';

interface DocumentData {
  text_chunk: string;
  title: string;
  id: number;
}

interface ScoreData {
  score: number;
  optimism: number;
  forecast: number;
  confidence: number;
}

interface DocumentWithScores {
  document: DocumentData | null;
  scores: ScoreData | null;
}

interface PutResponse {
  message: string;
  document_id: number;
  initial_scores: ScoreData;
  final_scores: ScoreData;
}

const DocumentPage: React.FC = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';
  const router = useRouter();
  const { doc_id, initialDoc, initialScores } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [documentData, setDocumentData] = useState<DocumentWithScores | null>(null);
  const hasSetInitialData = useRef(false);
  
  // Create stable debounced function
  const debouncedUpdate = useRef(
    debounce(async (text: string, docId: string, authToken: string, title: string) => {
      try {
        const response = await axios.put<PutResponse>(
          `${API_URL}/docs/${docId}`,
          { text, title },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        if (response.data.final_scores) {
          setDocumentData(prevData => ({
            document: prevData?.document ?? null,
            scores: response.data.final_scores
          }));
        }
      } catch (error) {
        console.error('Error in debounced update:', error);
      }
    }, 1000)
  ).current;

  const handleSaveHistory = useCallback(async () => {
    const authToken = localStorage.getItem('authToken') ?? '';
    if (documentData?.document && doc_id) {
      const docId = Array.isArray(doc_id) ? doc_id[0] : doc_id;
      if (typeof docId === 'string') {
        try {
          await axios.post(
            `${API_URL}/docs/${docId}/history`,
            { content: documentData.document.text_chunk },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
        } catch (error) {
          console.error('Error saving document history:', error);
        }
      }
    }
  }, [API_URL, doc_id, documentData?.document]);

  useEffect(() => {
    if (router.isReady && doc_id && !hasSetInitialData.current) {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        void router.push('/login');
        return;
      }

      const fetchData = async () => {
        try {
          if (initialDoc && initialScores) {
            const parsedDoc = JSON.parse(initialDoc as string) as DocumentData;
            const parsedScores = JSON.parse(initialScores as string) as ScoreData;
            setDocumentData({
              document: parsedDoc,
              scores: parsedScores
            });
          } else {
            const docId = Array.isArray(doc_id) ? doc_id[0] : doc_id;
            const [docResponse, scoresResponse] = await Promise.all([
              axios.get<DocumentData>(`${API_URL}/docs/${docId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
              }),
              axios.get<ScoreData[]>(`${API_URL}/docs/scores/${docId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
              })
            ]);

            const document: DocumentData = docResponse.data;
            const scores: ScoreData | null = scoresResponse.data[0] ?? null;

            setDocumentData({
              document,
              scores
            });
          }
          hasSetInitialData.current = true;
        } catch (error) {
          console.error('Error fetching document data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      void fetchData();
    }
  }, [router.isReady, doc_id, initialDoc, initialScores, API_URL, router]);

  const handleUpdateDocument = useCallback(
    (newText: string) => {
      const authToken = localStorage.getItem('authToken') ?? '';
      if (documentData?.document && doc_id) {
        const docId = Array.isArray(doc_id) ? doc_id[0] : doc_id;
        if (typeof docId === 'string') {
          void debouncedUpdate(newText, docId, authToken, documentData.document.title);
        }
      }
    },
    [doc_id, documentData?.document, debouncedUpdate]
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen w-screen">
      <Menu />
      <HomeBody 
        initialDocument={documentData?.document} 
        initialScores={documentData?.scores}
        onUpdateDocument={handleUpdateDocument}
        onSave={handleSaveHistory}
      />
    </div>
  );
};

export default DocumentPage;
