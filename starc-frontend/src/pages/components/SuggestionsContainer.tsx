import React, { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Suggestion from "./Suggestion";
import arrowDownIcon from "../../assets/arrow-down.svg";
import arrowUpIcon from "../../assets/arrow-up.svg";

interface Suggestion {
  id: number;
  content: string;
  documentId: number;
}

const SuggestionsContainer = ({ documentId }: { documentId: number }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = 'https://starcai.onrender.com/';

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${apiUrl}/fix/${documentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Replace with auth token retrieval method
        },
      });
      setSuggestions(
        response.data.map((suggestion: Suggestion) => ({
          ...suggestion,
          documentId,
        })),
      );
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setError("Failed to fetch suggestions");
    }
  };

  const handleApplyAllClick = async () => {
    try {
      await axios.put(
        `${apiUrl}/fix/${documentId}/all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );
      fetchSuggestions(); // Refresh suggestions after applying
    } catch (error) {
      console.error("Error applying all suggestions:", error);
    }
  };

  const handleDeleteAllClick = async () => {
    try {
      await axios.delete(`${apiUrl}/fix/${documentId}/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      fetchSuggestions(); // Refresh suggestions after deleting all
    } catch (error) {
      console.error("Error deleting all suggestions:", error);
    }
  };

  const handleReevaluateClick = async () => {
    // Just fetches the documents using the normal refresh method
    fetchSuggestions();
  };

  const toggleSuggestions = () => {
    setIsHidden(!isHidden);
  };

  useEffect(() => {
    // fetchSuggestions();
    const defaultSuggestions: Suggestion[] = [
      {
        id: 1,
        content:
          "This is a test suggestion for improving your confidence score.",
        documentId: 1,
      },
      {
        id: 2,
        content: "This is a test suggestion for improving your optimism score.",
        documentId: 1,
      },
    ];

    setSuggestions(defaultSuggestions);
  }, []); //[documentId]);

  return (
    <div className="suggestions-container">
      {error && <div className="error-message">{error}</div>}
      {!error && suggestions.length > 0 && (
        <>
          <div className="flex space-x-2 text-m_1 font-semibold text-gray-50">
            <h2>All Suggestions</h2>
            <button onClick={toggleSuggestions}>
              <Image
                src={isHidden ? arrowUpIcon : arrowDownIcon}
                alt="arrow-icon"
              />
            </button>
          </div>
          {!isHidden && (
            <div className="flex cursor-pointer gap-12 pb-16 pt-16 text-sm_3 font-semibold text-primary-purple">
              <h3
                className="apply-all-button cursor-pointer"
                onClick={handleApplyAllClick}
              >
                Apply All
              </h3>
              <h3
                className="delete-all-button cursor-pointer"
                onClick={handleDeleteAllClick}
              >
                Delete All
              </h3>
              <h3 className="cursor-pointer" onClick={handleReevaluateClick}>
                Reevaluate suggestions
              </h3>
            </div>
          )}
          <div className="suggestions-list flex flex-col space-y-12">
            {suggestions.map((suggestion) => (
              <Suggestion
                key={suggestion.id}
                suggestion={suggestion}
                onSuggestionUpdate={fetchSuggestions}
              />
            ))}
          </div>
        </>
      )}
      {!error && suggestions.length === 0 && <div>No suggestions found</div>}
    </div>
  );
};

export default SuggestionsContainer;
