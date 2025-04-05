import React, { useState, useRef, useEffect, forwardRef } from "react";
import axios from "axios";
import type { ScoreContainerRef } from "./ScoreContainer";

interface SuggestionsContainerProps {
  documentId: number | null;
  onUpdateText: (text: string) => void;
  setText: (text: string) => void;
  scoreContainerRef: React.RefObject<ScoreContainerRef>;
}

interface RewriteResponse {
  rewritten_text: string;
  scores: number[];
}

const SuggestionsContainer = forwardRef<HTMLDivElement, SuggestionsContainerProps>(
  ({ documentId, setText, scoreContainerRef }, _ref) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';

    const [prompts, setPrompts] = useState([
      { id: 1, prompt: "Make this sound more optimistic" },
      { id: 2, prompt: "Rewrite this to be more confidence inducing" }
    ]);

    const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

    useEffect(() => {
      prompts.forEach(prompt => {
        const ref = textareaRefs.current[prompt.id];
        if (ref) {
          ref.style.height = "auto";
          ref.style.height = `${ref.scrollHeight}px`;
        }
      });
    }, [prompts]);

    const handlePromptChange = (id: number, value: string) => {
      setPrompts((prevPrompts) =>
        prevPrompts.map((prompt) => (prompt.id === id ? { ...prompt, prompt: value } : prompt))
      );
    };

    const handleRewrite = async (id: number, currentPrompt: string) => {
      if (documentId && currentPrompt) {
        const authToken = localStorage.getItem("authToken");
        try {
          if (scoreContainerRef.current) {
            scoreContainerRef.current.setIsLoading(true);
          }

          const response = await axios.post<RewriteResponse>(
            `${API_URL}/fix/${documentId}/rewrite`,
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

            if (response.data.scores && scoreContainerRef.current) {
              scoreContainerRef.current.updateScores(response.data.scores);
              scoreContainerRef.current.setIsLoading(false);
            }

            await axios.post(
              `${API_URL}/docs/${documentId}/save_rewrite`,
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
          if (scoreContainerRef.current) {
            scoreContainerRef.current.setIsLoading(false);
          }
        }
      }
    };

    return (
      <div className="max-w-md mx-auto mt-5">
        {/* Header shown once */}
        <div className="flex items-center mb-5">
          <span className="bg-emerald-700 rounded-full w-3 h-3 inline-block mr-2"></span>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Guide StarcAI to match your style
          </p>
        </div>

        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-white shadow-lg rounded-lg p-6 mb-10">
            <div className="bg-gray-100 w-[90%] ml-[20px] px-4 py-[10px] flex items-center rounded-md min-h-[3.5rem]">
              <textarea
                ref={(el) => {
                  textareaRefs.current[prompt.id] = el;
                }}
                rows={1}
                value={prompt.prompt}
                onChange={(e) => {
                  handlePromptChange(prompt.id, e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                className="w-full bg-transparent text-center text-gray-800 text-lg font-light outline-none leading-[1.5rem] transition-all duration-200 ease-in-out resize-none overflow-hidden"
              />
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => handleRewrite(prompt.id, prompt.prompt)}
                className="bg-primary-purple mb-4 text-white py-1 px-[16px] rounded-md font-[550] tracking-wide hover:bg-primary-purple-hover transition-colors duration-300 ease-in-out"
              >
                Rewrite
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

SuggestionsContainer.displayName = "SuggestionsContainer";

export default SuggestionsContainer;
