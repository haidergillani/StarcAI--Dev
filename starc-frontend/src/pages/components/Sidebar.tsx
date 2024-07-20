import ScoreContainer from "./ScoreContainer";
import SuggestionsContainer from "./SuggestionsContainer";

export default function Sidebar() {
  return (
    // TODO: flex shrink?
    <div className="flex-col space-y-42">
      {/* TODO: need this column to have its own scroll bar, not push the rest down */}
      {/* TODO: change min heights to be correct */}
      <div className="h-1/3 min-h-[200px] w-full">
        <ScoreContainer />
      </div>
      <div className="container mt-auto h-2/3 min-h-[200px] w-full" style={{ overflowY: 'auto' }}>
        <SuggestionsContainer />
      </div>
    </div>
  );
}
