import React, { useState, useCallback, useRef } from 'react';
import Content from './Content';
import Sidebar from './Sidebar';
import ScoreContainer from './ScoreContainer';
import type { ScoreContainerRef } from './ScoreContainer';
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
    <div className="flex flex-col sm:flex-row w-screen h-screen overflow-hidden gap-x-[4%] px-[4%]">

      <div className="absolute ml-[10px] mt-[20px] text-[28px] sm:text-[28px] md:text-[32px] lg:text-[36px] text-gray-600 dark:text-gray-400 font-bold flex items-center space-x-10">
        <span>{title}</span>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-md text-gray-800 dark:text-gray-200"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      <div className="w-full sm:w-[30%] min-w-[250px] mt-[90px] sm:mt-[70px] md:mt-[90px] overflow-y-auto max-h-screen pb-[5vh]">

        <Chatbot />
      </div>
      
      <div className="w-full sm:w-[45%] pt-4 pb-[2vh] px-4 sm:px-6">


        <Content 
          onUpdateText={handleUpdateText} 
          text={text} 
          setText={setText} 
          onSave={handleSave}
        />
      </div>

      <div className="w-full sm:w-[30%] flex flex-col justify-start pt-[60px] pb-8 pr-4 sm:pr-8 pl-4 sm:pl-4 lg:pl-3 min-w-[250px] overflow-visible" style={{ height: "fit-content" }}>
        
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