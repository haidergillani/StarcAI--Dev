import React from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from 'next/router';
import purpleDot from "../../assets/purple-ellipse.svg";
import trashIcon from "../../assets/trash-icon.svg";

interface Suggestion {
  id: number;
  document_id: number;
  input_text_chunk: string;
  rewritten_text: string;
}

interface SuggestionProps {
  suggestion: Suggestion;
  onSuggestionUpdate: () => void;
  setText: (text: string) => void; // Add setText prop
}

export default function Suggestion({
  suggestion,
  onSuggestionUpdate,
  setText, // Destructure setText prop
}: SuggestionProps) {
  const apiUrl = "http://127.0.0.1:2000";
  const router = useRouter();

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
      const response = await axios.put(
        `${apiUrl}/fix/${suggestion.document_id}/suggestions/${suggestion.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );

      console.log(response.data.updated_text);

      setText(response.data.updated_text); // Update the text in the editor
      // router.reload();
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
          <Image src={trashIcon} alt="trash-icon" />
        </button>
      </div>
    </div>
  );
}