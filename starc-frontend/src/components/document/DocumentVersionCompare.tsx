import dynamic from 'next/dynamic';
import React, { useMemo } from 'react';
import { diffWords } from 'diff';

interface DocumentVersionCompareProps {
  oldContent: string;
  newContent: string;
  oldDate: string;
  newDate: string;
  onClose: () => void;
  onRestore: (content: string) => void;
}

const DocumentVersionCompare: React.FC<DocumentVersionCompareProps> = ({
  oldContent = '',
  newContent = '',
  oldDate,
  newDate,
  onClose,
  onRestore,
}) => {
  const [viewMode, setViewMode] = React.useState<'diff' | 'side-by-side'>('diff');
  
  const diff = useMemo(() => {
    if (!oldContent || !newContent) return [];
    try {
      return diffWords(oldContent || '', newContent || '');
    } catch (error) {
      console.error('Error computing diff:', error);
      return [];
    }
  }, [oldContent, newContent]);

  const getWordCount = (text = '') => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const oldWordCount = getWordCount(oldContent);
  const newWordCount = getWordCount(newContent);
  const wordCountDiff = newWordCount - oldWordCount;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Compare Versions</h2>
            <div className="text-sm text-gray-500 mt-1">
              Word count change: {wordCountDiff > 0 ? '+' : ''}{wordCountDiff} words
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('diff')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'diff' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                }`}
              >
                Diff View
              </button>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'side-by-side' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                }`}
              >
                Side by Side
              </button>
            </div>
            <button
              onClick={() => onRestore(oldContent)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Restore This Version
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {viewMode === 'diff' ? (
            <div className="prose max-w-none">
              {diff.map((part, index) => (
                <span
                  key={index}
                  className={
                    part.added
                      ? 'bg-green-100 text-green-800'
                      : part.removed
                      ? 'bg-red-100 text-red-800 line-through'
                      : ''
                  }
                >
                  {part.value}
                </span>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-2">
                  {formatDate(oldDate)} ({oldWordCount} words)
                </div>
                <div className="whitespace-pre-wrap">{oldContent}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-2">
                  {formatDate(newDate)} ({newWordCount} words)
                </div>
                <div className="whitespace-pre-wrap">{newContent}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export as dynamic component with SSR disabled
export default dynamic(() => Promise.resolve(DocumentVersionCompare), {
  ssr: false
}); 