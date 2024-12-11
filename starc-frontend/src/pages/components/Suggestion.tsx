import React from "react";
import axios from "axios";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import trashIcon from "../../assets/trash-icon.svg";

interface Suggestion {
  id: number;
  document_id: number;
  input_text_chunk: string;
  rewritten_text: string;
}

interface UpdateResponse {
  updated_text: string;
}

interface SuggestionProps {
  suggestion: Suggestion;
  onSuggestionUpdate: () => void;
  setText: (text: string) => void;
}

const defaultSuggestion: Suggestion = {
  id: 0,
  document_id: 0,
  input_text_chunk: "Default input text",
  rewritten_text: "Default rewritten text",
};

export default function Suggestion({
  suggestion = defaultSuggestion,
  onSuggestionUpdate,
  setText,
}: SuggestionProps) {
  const apiUrl = "http://127.0.0.1:2000";

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${apiUrl}/fix/${suggestion.document_id}/suggestions/${suggestion.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );
      onSuggestionUpdate();
    } catch (error) {
      console.error("Failed to delete suggestion:", error);
    }
  };

  const handleApply = async () => {
    try {
      const response = await axios.put<UpdateResponse>(
        `${apiUrl}/fix/${suggestion.document_id}/suggestions/${suggestion.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );

      const updatedText = response.data.updated_text;
      setText(updatedText);
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
    }
  };

  return (
    <div className="suggestion flex flex-col overflow-auto rounded-lg bg-white pb-18 pl-18 pr-18 pt-18">
      <div className="suggestion-body mb-16 mt-16 rounded-lg bg-background p-12">
        <p>{suggestion.rewritten_text}</p>
      </div>
      <div className="suggestion-footer flex justify-between">
        <button
          onClick={handleApply}
          className="text-sm-3 rounded-md bg-primary-purple pb-6 pl-18 pr-18 pt-6 font-semibold text-white"
        >
          Apply
        </button>
        <button onClick={handleDelete} className="pr-6">
          <Image 
            src={trashIcon as StaticImageData} 
            alt="trash-icon" 
          />
        </button>
      </div>
    </div>
  );
}