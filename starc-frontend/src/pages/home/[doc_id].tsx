// pages/home/[doc_id].tsx
import React, { useState, useEffect, useCallback } from 'react';
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

const DocumentPage: React.FC = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';
  const router = useRouter();
  const { doc_id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [scores, setScores] = useState<ScoreData | null>(null);

  useEffect(() => {
    if (doc_id) {
      const fetchData = async () => {
        const authToken = localStorage.getItem('authToken') ?? '';
        try {
          const docId = Array.isArray(doc_id) ? doc_id[0] : doc_id;
          const [docResponse, scoresResponse] = await Promise.all([
            axios.get<DocumentData>(`${API_URL}/docs/${docId}`, {
              headers: { Authorization: `Bearer ${authToken}` },
            }),
            axios.get<ScoreData[]>(`${API_URL}/docs/scores/${docId}`, {
              headers: { Authorization: `Bearer ${authToken}` },
            })
          ]);

          setDocument(docResponse.data);
          setScores(scoresResponse.data[0] ?? null);
          localStorage.setItem('openDocId', String(docResponse.data.id));
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          setIsLoading(false);
        }
      };
      void fetchData();
    }
  }, [doc_id, API_URL]);

  const handleUpdateDocument = useCallback(
    debounce((newText: string) => {
      const authToken = localStorage.getItem('authToken') ?? '';
      if (document && doc_id) {
        const docId = Array.isArray(doc_id) ? doc_id[0] : doc_id;
        void axios.put(
          `${API_URL}/docs/${docId}`,
          { text: newText, title: document.title },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      }
    }, 1000),
    [document, doc_id, API_URL]
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen w-screen">
      <Menu />
      <HomeBody 
        initialDocument={document} 
        initialScores={scores}
        onUpdateDocument={handleUpdateDocument}
      />
    </div>
  );
};

export default DocumentPage;
