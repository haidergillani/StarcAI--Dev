// keep as is

import axios, { Axios } from "axios";
import { useRouter } from "next/router";
import React, { useState, useEffect, useRef } from "react";

interface Document {
  id: number;
  title: string;
  text: string;
  // Add other relevant properties of a document
}
interface ContentProps {
  document: Document | null;
}

const Content = ({ document }: ContentProps) => {
  const [text, setText] = useState(""); // State to store the text from the editor
  const [title, setTitle] = useState(""); // State to store the title of the document
  const [wordCount, setWordCount] = useState(0); // State for word count
  const [charCount, setCharCount] = useState(0); // State for character count
  const [countType, setCountType] = useState("word"); // State to toggle between word and character count
  const [dropdownVisible, setDropdownVisible] = useState(false); // State to control the visibility of the dropdown
  const [isEditingTitle, setIsEditingTitle] = useState(false); // State to track if we're editing the title
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const apiUrl = 'https://starcai.onrender.com/';
  const router = useRouter();
  // Function to update word and character counts based on the text

  const updateCounts = (text: string) => {
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word);
    setWordCount(words.length);
    setCharCount(text.length);
  };

  // Effect to focus the title input when it becomes editable
  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current!.focus();
    }
  }, [isEditingTitle]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Save the title when Enter is pressed
      setIsEditingTitle(false);
      // Here you would also update the title in the document's storage
    }
  };

  const handleTitleBlur = () => {
    // Save the title when focus is lost
    setIsEditingTitle(false);
    // Here you would also update the title in the document's storage
  };

  // Effect to update counts whenever the text changes
  useEffect(() => {
    // updateCounts(text);
  }, [text]);

  useEffect(() => {
    const openDocId = localStorage.getItem("openDocId");
    console.log(openDocId);
    if (openDocId) {
      const fetchDocument = async () => {
        const newOpenDocId = localStorage.getItem("openDocId");
        console.log(newOpenDocId);
        const authToken = localStorage.getItem("authToken");
        try {
          const response = await axios.get(`${apiUrl}/docs/${newOpenDocId}`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          if (response.status === 200) {
            console.log("ReSPONSE", response.data);
            setText(response.data.sentences_combined);
            setTitle(response.data.title);
            updateCounts(response.data.sentences_combined);
          }
        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            console.error("Document not found or access denied");
          } else {
            console.error(error);
          }
        }
      };

      fetchDocument();
    }
  }, []);

  return (
    <div className="flex h-full flex-col" style={{ overflowY: "hidden" }}>
      {isEditingTitle ? (
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          onBlur={handleTitleBlur}
          className="ml-83 border-none bg-transparent text-lg font-bold text-gray-50 outline-none"
        />
      ) : (
        <h1
          className="ml-83 mt-42 cursor-pointer text-lg font-bold text-gray-50 hover:underline"
          onClick={() => setIsEditingTitle(true)}
        >
          {title}
        </h1>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 resize-none overflow-auto border-none py-2 pl-20 pr-6 outline-none transition-all sm:text-sm md:text-base lg:text-lg"
        placeholder="Type or paste your text here..."
        autoFocus
      />
      <div className="flex items-center justify-between border-t p-4">
        <div className="ml-auto">
          {/* Toggle between word count and character count */}
          <div
            className="relative cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-200"
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
