import SuggestionsContainer from "./SuggestionsContainer";

export default function Sidebar({ documentId, onUpdateText, suggestionsContainerRef, setText }: { documentId: number, onUpdateText: (text: string) => void, suggestionsContainerRef: React.RefObject<{ fetchSuggestions: () => void }>, setText: (text: string) => void }) {
  return (
    <div className="flex-col space-y-42">
      <div className="container mt-auto h-2/3 min-h-[200px] w-full" style={{ overflowY: 'auto' }}>
        <SuggestionsContainer ref={suggestionsContainerRef} documentId={documentId} onUpdateText={onUpdateText} setText={setText} />
      </div>
    </div>
  );
}