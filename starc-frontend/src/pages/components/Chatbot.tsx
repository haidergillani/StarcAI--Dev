import React, { useState } from "react";
import axios from "axios";

// Add interface for API response
interface ChatResponse {
  response: string;
}

const Chatbot = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("Is Deferred revenue taxable?");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim()) {
      const newMessages = [...messages, { sender: "user", text: input }];
      setMessages(newMessages);
      setLoading(true);

      try {
        const authToken = localStorage.getItem("authToken");
        const response = await axios.post<ChatResponse>(
          `${API_URL}/fix/chat`,
          {
            prompt: input,
            chat_log: newMessages.map(msg => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text
            }))
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        setMessages([...newMessages, { sender: "bot", text: response.data.response }]);
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages([...newMessages, { sender: "bot", text: "Error: Unable to get response." }]);
      } finally {
        setLoading(false);
        setInput("Is Deferred revenue taxable?");
      }
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
  
      {/* Sticky Header */}
      <div className="sticky top-1 z-10 bg-white dark:bg-gray-800 px-4 py-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-rose-950 rounded-full mr-2"></div>
          <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Ask StarcAI – Financial Reporting Expert
          </h1>
        </div>
      </div>
  
      {/* Scrollable content INCLUDING messages and input */}
      <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
        {/* Messages */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${
              msg.sender === "user"
                ? "bg-gray-100 dark:bg-gray-700 text-center rounded-md"
                : "bg-white-100"
            } fade-in`}
          >
            <div
              className={`inline-block p-2 rounded w-full bg-transparent text-center text-gray-800 dark:text-gray-200 text-lg ${
                msg.sender === "user" ? "font-semibold" : "font-light"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
  
        {loading && (
          <div className="text-left mb-2">
            <div className="inline-block p-2 rounded bg-gray-300 dark:bg-gray-600">
              <div className="loader"></div>
            </div>
          </div>
        )}
  
        {/* Input Area - scrolls with messages */}
        <div className="pt-6 pb-[5vh]">
          <div className="flex justify-center items-center">
            <div className="bg-gray-100 dark:bg-gray-700 w-full max-w-lg px-4 py-0 rounded-md min-h-[3.5rem] flex items-center">
            
            <textarea
              rows={1}
              className="w-full resize-none overflow-hidden text-center bg-transparent text-gray-800 dark:text-gray-200 text-lg font-light outline-none leading-tight transition-all duration-200 ease-in-out pt-[10px]"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              style={{
                height: "auto",
                minHeight: "2.75rem",
              }}
            />
            
            </div>
          </div>
          <div className="flex justify-center mt-3">
            <button
              className="bg-primary-purple text-white py-2 px-4 rounded-md font-semibold tracking-wide hover:bg-primary-purple-hover transition-colors duration-300 ease-in-out"
              onClick={handleSend}
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
