import React, { useState } from "react";
import axios from "axios";

interface SuggestionsContainerProps {
  documentId: number | null;
  onUpdateText: (text: string) => void;
  setText: (text: string) => void;
}

const SuggestionsContainer: React.FC<SuggestionsContainerProps> = ({ documentId, onUpdateText, setText }) => {
  const [prompts, setPrompts] = useState([
    { id: 1, prompt: "Induce confidence in this" }
  ]);

  const handlePromptChange = (id: number, value: string) => {
    setPrompts((prevPrompts) =>
      prevPrompts.map((prompt) => (prompt.id === id ? { ...prompt, prompt: value } : prompt))
    );
  };

  const handleRewrite = async (id: number, currentPrompt: string) => {
    if (documentId && currentPrompt) {
      const authToken = localStorage.getItem("authToken");
      try {
        const response = await axios.post(
          `http://127.0.0.1:2000/fix/${documentId}/rewrite`,
          { prompt: currentPrompt },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (response.status === 200) {
          const rewrittenText = response.data.rewritten_text;
          setText(rewrittenText);

          // Save the rewritten text to the database
          await axios.post(
            `http://127.0.0.1:2000/docs/${documentId}/save_rewrite`,
            { rewritten_text: rewrittenText },
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
        }
      } catch (error) {
        console.error("Error rewriting text:", error);
      }
    }
  };

  const addMorePrompts = () => {
    setPrompts((prevPrompts) => [...prevPrompts, { id: prevPrompts.length + 1, prompt: "" }]);
  };

  const renderPrompt = (prompt: string) => {
    const parts = prompt.split(/(confidence|optimistic)/gi);
    return parts.map((part, index) =>
      part.toLowerCase() === "confidence" || part.toLowerCase() === "optimistic" ? (
        <span key={index} className="text-purple-700 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      {prompts.map((prompt) => (
        <div key={prompt.id} className="bg-white shadow-lg rounded-lg p-6 mb-4">
          <div className="flex items-center mb-4">
            <span className="bg-rose-950 rounded-full w-2 h-2 inline-block mr-2"></span>
            <p className="text-gray-700 text-sm font-medium">Guide StarcAI to match your style</p>
          </div>
          <div className="bg-gray-100 w-[90%] ml-[20px] p-4 rounded-md">
            <input
              type="text"
              value={prompt.prompt}
              onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
              className="w-full bg-transparent text-center text-gray-800 text-lg font-light outline-none"
            />
          </div>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => handleRewrite(prompt.id, prompt.prompt)}
              className="bg-indigo-800 mb-2 text-white py-1 px-[20px] rounded-md font-semibold hover:bg-purple-800"
            >
              Rewrite
            </button>
          </div>
        </div>
      ))}
      {/* <div className="text-center mt-6">
        <button onClick={addMorePrompts} className="text-gray-500 text-sm font-medium">
          More Suggestions
        </button>
      </div> */}
    </div>
  );
};

export default SuggestionsContainer;