import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import { debounce } from "../../utills/debounce";

interface ContentProps {
  onSave: () => void;
  onUpdateText: (text: string) => void;
  text: string;
  setText: (text: string) => void;
  title: string;
}

interface DocumentResponse {
  text_chunk: string;
  title: string;
}

const Content = ({ onSave, onUpdateText, text, setText, title }: ContentProps) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [countType, setCountType] = useState("word");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const apiUrl = 'http://127.0.0.1:2000';

  const updateCounts = (text: string) => {
    if (text) {
      const words = text.trim().split(/\s+/).length;
      const chars = text.length;
      setWordCount(words);
      setCharCount(chars);
    } else {
      setWordCount(0);
      setCharCount(0);
    }
  };

  const debouncedSave = useCallback(() => {
    return debounce((newText: string, callback?: () => void) => {
      const openDocId = localStorage.getItem("openDocId");
      const authToken = localStorage.getItem("authToken");
      if (openDocId && authToken) {
        void axios.put(`${apiUrl}/docs/${openDocId}`, {
          title: title,
          text: newText
        }, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then(() => {
          if (callback) callback();
        }).catch((error) => {
          console.error("Error saving document:", error);
        });
      }
    }, 1000);
  }, [title, apiUrl]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    updateCounts(newText);
    debouncedSave()(newText, onSave);
    onUpdateText(newText);
  };

  useEffect(() => {
    updateCounts(text);
  }, [text]);

  useEffect(() => {
    const openDocId = localStorage.getItem("openDocId");
    if (openDocId) {
      const fetchDocument = async () => {
        const authToken = localStorage.getItem("authToken");
        try {
          const response = await axios.get<DocumentResponse>(
            `${apiUrl}/docs/${openDocId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          if (response.status === 200) {
            setText(response.data.text_chunk);
            updateCounts(response.data.text_chunk);
          }
        } catch (error) {
          console.error("Error fetching document:", error);
        }
      };

      void fetchDocument();
    }
  }, [setText, apiUrl]);

  return (
    <div className="flex  h-full mt-[60px] rounded-lg flex-col bg-slate-50"  style={{ overflowY: "hidden" }}>
      <textarea
        value={text}
        onChange={handleTextChange}
        className="flex-1 ml-[30px] bg-slate-50 mt-[10px]  resize-none overflow-auto border-none py-2  pr-6 outline-none transition-all sm:text-sm md:text-base lg:text-lg"
        placeholder="Type or paste your text here..."
        autoFocus
      />
      <div className="flex items-center justify-between p-4"> {/* Removed border-t class */}
        <div className="ml-auto">
          {/* Toggle between word count and character count */}
          <div
            className="relative cursor-pointer rounded-lg  p-2 text-gray-500 hover:bg-gray-200"
            onClick={() => setDropdownVisible(!dropdownVisible)}
          >
            {countType === "word"
              ? `${wordCount} words`
              : `${charCount} characters`}
            {dropdownVisible && (
              <div className="absolute bottom-full right-0 mb-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="p-4">
                  <p
                    className="mb-2 cursor-pointer rounded-md p-2 hover:bg-gray-100"
                    onClick={() => {
                      setCountType("word");
                      setDropdownVisible(false);
                    }}
                  >
                    {wordCount} words
                  </p>
                  <p
                    className="cursor-pointer rounded-md p-2 hover:bg-gray-100"
                    onClick={() => {
                      setCountType("character");
                      setDropdownVisible(false);
                    }}
                  >
                    {charCount} characters
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;