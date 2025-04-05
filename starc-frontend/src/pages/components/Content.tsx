import React, { useState, useEffect, useCallback, useRef } from "react";

interface ContentProps {
  onSave: () => void;
  onUpdateText: (text: string) => void;
  text: string;
  setText: (text: string) => void;
}

const Content = ({ onSave, onUpdateText, text, setText }: ContentProps) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [countType, setCountType] = useState("word");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleSave = useCallback(() => {
    onSave();
    setLastSaved(new Date());
  }, [onSave]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    updateCounts(newText);
    onUpdateText(newText);

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 30000); // 30 seconds
  };

  useEffect(() => {
    updateCounts(text);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [text]);

  return (
    <div className="flex h-full mt-[60px] rounded-lg flex-col bg-slate-50 dark:bg-gray-800 pb-[5%]">
      
      {/* Textarea wrapper that scrolls vertically */}
      <div className="flex-1 px-7">
        <textarea
          value={text}
          onChange={handleTextChange}
          className="w-full h-full min-h-[300px] bg-slate-50 dark:bg-gray-800 dark:text-gray-200 mt-[10px] resize-none border-none py-2 pr-6 outline-none transition-all sm:text-sm md:text-base lg:text-lg break-words whitespace-pre-wrap"

          placeholder="Type in or paste your text here..."
          autoFocus
          wrap="soft"
        />
      </div>

      {/* Sticky bottom bar */}

      <div className="sticky bottom-0 flex w-full items-center justify-between px-4 py-3 bg-slate-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10 text-sm">

        {/* Word Count (Left) */}
        <div className="mr-auto">
          <div
            className="relative cursor-pointer rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => setDropdownVisible(!dropdownVisible)}
          >
            {countType === "word" ? `${wordCount} words` : `${charCount} characters`}
            {dropdownVisible && (
              <div className="absolute bottom-full left-0 mb-2 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                <div className="p-4">
                  <p
                    className="mb-2 cursor-pointer rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                    onClick={() => {
                      setCountType("word");
                      setDropdownVisible(false);
                    }}
                  >
                    {wordCount} words
                  </p>
                  <p
                    className="cursor-pointer rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
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

        {/* Fine Print (Center) */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center flex-1">
          StarcAI can make mistakes. Check important info.
          <br/>No legal liability is assumed by StarcAI.          
        </p>

        {/* Save Button (Right) */}
        <div className="flex items-center space-x-4 ml-auto">
          <button
            onClick={handleSave}
            className="rounded-md bg-primary-purple hover:bg-primary-purple-hover font-[550]] tracking-wide px-4 py-2 text-white transition duration-300 ease-in-out"
          >
            Save
          </button>
          {lastSaved && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

      </div>

    </div>
  );
};

export default Content;
