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
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Compare Versions</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Word count change: {wordCountDiff > 0 ? '+' : ''}{wordCountDiff} words
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('diff')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'diff' 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Diff View
              </button>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'side-by-side'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Side by Side
              </button>
            </div>
            <button
              onClick={() => onRestore(oldContent)}
              className="px-3 py-1 bg-indigo-800 text-white rounded hover:bg-indigo-700"
            >
              Restore This Version
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {viewMode === 'diff' ? (
            <div className="prose max-w-none dark:prose-invert">
              {diff.map((part, index) => (
                <span
                  key={index}
                  className={
                    part.added
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : part.removed
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 line-through'
                      : 'text-gray-800 dark:text-gray-200'
                  }
                >
                  {part.value}
                </span>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {formatDate(oldDate)} ({oldWordCount} words)
                </div>
                <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{oldContent}</div>
              </div>
              <div className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {formatDate(newDate)} ({newWordCount} words)
                </div>
                <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{newContent}</div>
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