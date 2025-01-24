import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DocumentVersionCompare from './DocumentVersionCompare';

interface DocumentHistoryProps {
  documentId: number;
  onRestore: (content: string) => void;
  onOpen: (content: string) => void;
  currentContent?: string;
}

interface HistoryEntry {
  id: number;
  document_id: number;
  content: string;
  created_at: string;
}

const DocumentHistory: React.FC<DocumentHistoryProps> = ({ documentId, onRestore, onOpen, currentContent }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          setError('Authentication required');
          return;
        }

        const response = await axios.get<HistoryEntry[]>(
          `${API_URL}/docs/${documentId}/history`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching document history:', error);
        setError('Failed to load document history');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchHistory();
  }, [API_URL, documentId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleVersionSelect = (id: number) => {
    setSelectedVersions((prev: number[]): number[] => {
      // Case 1: Remove if already selected
      if (prev.includes(id)) {
        return prev.filter((v): v is number => v !== id);
      }
      
      // Case 2: Add to selection if less than 2 items
      if (prev.length < 2) {
        const newVersions = [...prev, id];
        return newVersions.sort((a, b) => b - a);
      }
      
      // Case 3: Replace oldest selection if already have 2 items
      if (typeof prev[1] === 'number') {
        return [prev[1], id].sort((a, b) => b - a);
      }
      
      // Fallback case
      return [id];
    });
  };

  const getSelectedVersions = () => {
    if (selectedVersions.length !== 2) return null;

    // Handle case where current version is selected
    if (selectedVersions.includes(-1)) {
      const savedVersion = history.find(h => h.id === selectedVersions.filter(id => id !== -1)[0]);
      if (!savedVersion || !currentContent) return null;
      
      const currentEntry = {
        id: -1,
        document_id: documentId,
        content: currentContent,
        created_at: new Date().toISOString()
      };
      
      return selectedVersions[0] === -1 
        ? { newer: currentEntry, older: savedVersion }
        : { newer: savedVersion, older: currentEntry };
    }

    // Original logic for two saved versions
    const newer = history.find(h => h.id === selectedVersions[0]);
    const older = history.find(h => h.id === selectedVersions[1]);
    if (!newer || !older) return null;
    return { newer, older };
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading history...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-h-[500px] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Document History</h2>
        {selectedVersions.length === 2 && (
          <button
            onClick={() => setCompareMode(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Compare Selected
          </button>
        )}
      </div>
      {history.length === 0 && !currentContent ? (
        <p className="text-gray-500 text-center">No history available</p>
      ) : (
        <div className="space-y-4">
          {currentContent && (
            <div 
              className={`border rounded-lg p-4 hover:bg-gray-50 ${
                selectedVersions.includes(-1) ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(-1)}
                    onChange={() => handleVersionSelect(-1)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-500 font-semibold">
                    Current Version (Unsaved)
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-700 line-clamp-3">
                {currentContent.slice(0, 200)}
                {currentContent.length > 200 ? '...' : ''}
              </div>
            </div>
          )}
          {history.map((entry) => (
            <div 
              key={entry.id} 
              className={`border rounded-lg p-4 hover:bg-gray-50 ${
                selectedVersions.includes(entry.id) ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(entry.id)}
                    onChange={() => handleVersionSelect(entry.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-500">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => onOpen(entry.content)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => onRestore(entry.content)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Restore
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-700 line-clamp-3">
                {entry.content.slice(0, 200)}
                {entry.content.length > 200 ? '...' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {compareMode && selectedVersions.length === 2 && (
        <DocumentVersionCompare
          oldContent={getSelectedVersions()?.older.content ?? ''}
          newContent={getSelectedVersions()?.newer.content ?? ''}
          oldDate={getSelectedVersions()?.older.created_at ?? ''}
          newDate={getSelectedVersions()?.newer.created_at ?? ''}
          onClose={() => {
            setCompareMode(false);
            setSelectedVersions([]);
          }}
          onRestore={onRestore}
        />
      )}
    </div>
  );
};

// Export as dynamic component with SSR disabled
export default dynamic(() => Promise.resolve(DocumentHistory), {
  ssr: false
}); 