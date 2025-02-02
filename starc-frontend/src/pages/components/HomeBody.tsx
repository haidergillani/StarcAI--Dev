import React, { useState, useCallback, useRef } from 'react';
import Content from './Content';
import Sidebar from './Sidebar';
import ScoreContainer, { ScoreContainerRef } from './ScoreContainer';
import Chatbot from './Chatbot';
import DocumentHistory from '../../components/document/DocumentHistory';

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
  onUpdateDocument?: (newText: string, scoreContainerRef: React.MutableRefObject<ScoreContainerRef | null>) => void;
  onSave?: () => void;
}

const HomeBody: React.FC<HomeBodyProps> = ({ 
  initialDocument, 
  initialScores,
  onUpdateDocument,
  onSave
}) => {
  const [text, setText] = useState(initialDocument?.text_chunk ?? "");
  const [title] = useState(initialDocument?.title ?? "");
  const [showHistory, setShowHistory] = useState(false);
  const documentId = initialDocument?.id ?? null;
  const suggestionsContainerRef = useRef<{ fetchSuggestions: () => void } | null>(null);
  const scoreContainerRef = useRef<ScoreContainerRef | null>(null);

  const handleUpdateText = useCallback((newText: string) => {
    setText(newText);
    if (scoreContainerRef.current) {
      scoreContainerRef.current.setIsLoading(true);
    }
    onUpdateDocument?.(newText, scoreContainerRef);
  }, [onUpdateDocument]);

  const handleSave = useCallback(() => {
    if (scoreContainerRef.current) {
      scoreContainerRef.current.fetchScores();
    }
    onSave?.();
  }, [onSave]);

  const handleRestoreVersion = useCallback((content: string) => {
    setText(content);
    onUpdateDocument?.(content, scoreContainerRef);
    setShowHistory(false);
  }, [onUpdateDocument]);

  const handleOpenVersion = useCallback((content: string) => {
    setText(content);
    setShowHistory(false);
  }, []);

  return (
    <div className="flex w-screen h-screen overflow-x-hidden">
      <div className="absolute ml-[80px] mt-[15px] text-[45px] text-gray-500 font-bold flex items-center space-x-4">
        <span>{title}</span>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>
      <div className="w-[32%] p-4 min-w-250">
        <Chatbot />
      </div>
      <div className="flex-1 py-4 w-[28%]">
        <Content 
          onUpdateText={handleUpdateText} 
          text={text} 
          setText={setText} 
          title={title}
          onSave={handleSave}
        />
      </div>
      <div className="w-[30%] pt-35 pb-42 pr-33 min-w-250">
        {showHistory && documentId ? (
          <DocumentHistory
            documentId={documentId}
            onRestore={handleRestoreVersion}
            onOpen={handleOpenVersion}
            currentContent={text}
          />
        ) : (
          <>
            <ScoreContainer ref={scoreContainerRef} initialScores={initialScores} text={text} />
            {documentId && (
              <Sidebar 
                documentId={documentId} 
                onUpdateText={handleUpdateText} 
                setText={setText}
                suggestionsContainerRef={suggestionsContainerRef}
                scoreContainerRef={scoreContainerRef}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomeBody;