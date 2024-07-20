// most things remain the same with the exception of suggestion - suggetions are for chunks of text rather than sentences

import React from "react";
import axios from "axios";
import Image from "next/image";
import purpleDot from "../../assets/purple-ellipse.svg";
import trashIcon from "../../assets/trash-icon.svg";

interface Suggestion {
  id: number;
  content: string;
  documentId: number;
}

interface SuggestionProps {
  suggestion: Suggestion;
  onSuggestionUpdate: () => void;
}

export default function Suggestion({
  suggestion,
  onSuggestionUpdate,
}: SuggestionProps) {
  const apiUrl = process.env.NEXT_PUBLIC_REACT_APP_API_URL;

  const handleDelete = async () => {
    try {
      await axios.delete(`https://starcai.onrender.com/fix/${suggestion.documentId}/${suggestion.id}`);
      await axios.delete(
        `${apiUrl}/fix/${suggestion.documentId}/${suggestion.id}`,
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

  const handleRephrase = async () => {
    try {
      await axios.put(`https://starcai.onrender.com/fix/${suggestion.documentId}/${suggestion.id}`);
      onSuggestionUpdate();
    } catch (error) {
      console.error("Failed to rephrase suggestion:", error);
    }
  };

  return (
    <div className="suggestion flex flex-col overflow-auto rounded-lg bg-white pb-18 pl-18 pr-18 pt-18">
      <div className="suggestion-body mb-16 mt-16 rounded-lg bg-background p-12">
        <p>{suggestion.content}</p>
      </div>
      <div className="suggestion-footer flex justify-between">
        <button
          onClick={handleRephrase}
          className="text-sm-3 rounded-md bg-primary-purple pb-6 pl-18 pr-18 pt-6 font-semibold text-white"
        >
          Rephrase
        </button>
        <button onClick={handleDelete} className="pr-6">
          <Image src={trashIcon} alt="trash-icon" />
        </button>
      </div>
    </div>
  );
}
