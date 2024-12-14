import React, { useState, useCallback, useEffect, useRef } from 'react';
import Content from './Content';
import Sidebar from './Sidebar';
import ScoreContainer from './ScoreContainer';
import Chatbot from './Chatbot';

interface HomeBodyProps {
  initialDocument?: {
    text_chunk: string;
    title: string;
    id: number;
  } | null;
  initialScores?: {
    score: number;
    optimism: number;
    forecast: number;
    confidence: number;
  } | null;
  onUpdateDocument?: (newText: string) => void;
}

const HomeBody: React.FC<HomeBodyProps> = ({ 
  initialDocument, 
  initialScores,
  onUpdateDocument 
}) => {
  const [text, setText] = useState(initialDocument?.text_chunk ?? "");
  const [title] = useState(initialDocument?.title ?? "");
  const documentId = initialDocument?.id ?? null;
  const scoreContainerRef = useRef<{ fetchScores: () => void } | null>(null);
  const suggestionsContainerRef = useRef<{ fetchSuggestions: () => void } | null>(null);

  const handleUpdateText = useCallback((newText: string) => {
    setText(newText);
    onUpdateDocument?.(newText);
  }, [onUpdateDocument]);

  const handleSave = useCallback(() => {
    if (scoreContainerRef.current) {
      scoreContainerRef.current.fetchScores();
    }
  }, []);

  return (
    <div className="flex w-screen h-screen overflow-x-hidden">
      <div className="absolute ml-[80px] mt-[15px] text-[45px] text-gray-500 font-bold">
        {title} 
      </div>
      <div className="w-[32%] p-4 min-w-250">
        <Chatbot />
      </div>
      <div className="flex-1 py-4 w-[28%]">
        <Content 
          onSave={handleSave}
          onUpdateText={handleUpdateText} 
          text={text} 
          setText={setText} 
          title={title} 
        />
      </div>
      <div className="w-[30%] pt-35 pb-42 pr-33 min-w-250">
        <ScoreContainer ref={scoreContainerRef} initialScores={initialScores} text={text} />
        {documentId && (
          <Sidebar 
            documentId={documentId} 
            onUpdateText={handleUpdateText} 
            setText={setText}
            suggestionsContainerRef={suggestionsContainerRef}
          />
        )}
      </div>
    </div>
  );
};

export default HomeBody;