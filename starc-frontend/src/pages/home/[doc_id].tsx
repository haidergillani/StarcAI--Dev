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
    debounce((text: string, docId: string, authToken: string, title: string) => {
      void axios.put(
        `${API_URL}/docs/${docId}`,
        { text, title },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    }, 1000)
  ).current;

  useEffect(() => {
    if (!router.isReady) return;
    
    // Only try to use initial data once
    if (initialDoc && initialScores && !hasSetInitialData.current) {
      try {
        console.log("Using initial data from navigation");
        setDocumentData({
          document: JSON.parse(initialDoc as string) as DocumentData,
          scores: JSON.parse(initialScores as string) as ScoreData
        });
        setIsLoading(false);
        hasSetInitialData.current = true;
        return;
      } catch (error) {
        console.error("Error parsing initial data:", error);
      }
    }

    // Only fetch if we haven't set initial data
    if (doc_id && !hasSetInitialData.current) {
      console.log("No initial data, fetching fresh data");
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

          setDocumentData({
            document: docResponse.data,
            scores: scoresResponse.data[0] ?? null
          });
          
          localStorage.setItem('openDocId', String(docResponse.data.id));
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          setIsLoading(false);
        }
      };
      void fetchData();
    }
  }, [router.isReady, doc_id, initialDoc, initialScores, API_URL]);

  const handleUpdateDocument = useCallback(
    debounce((newText: string) => {
      const authToken = localStorage.getItem('authToken') ?? '';
      if (documentData?.document && doc_id) {
        const docId = Array.isArray(doc_id) ? doc_id[0] : doc_id;
        if (typeof docId === 'string') {
          void axios.put<PutResponse>(
            `${API_URL}/docs/${docId}`,
            { text: newText, title: documentData.document.title },
            { headers: { Authorization: `Bearer ${authToken}` } }
          ).then(response => {
            console.log('PUT response:', response.data);
            
            if (response.data.final_scores) {
              console.log('Setting new scores:', response.data.final_scores);
              
              setDocumentData(prevData => {
                const newData = {
                  document: prevData?.document ?? null,
                  scores: response.data.final_scores
                };
                console.log('New document data:', newData);
                return newData;
              });
            }
          }).catch(error => {
            console.error('Error updating document:', error);
          });
        }
      }
    }, 1000),
    [API_URL, doc_id, documentData?.document]
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
      />
    </div>
  );
};

export default DocumentPage;
