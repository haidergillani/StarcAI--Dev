import React, { useState } from "react";
import axios from "axios";

// Add interface for API response
interface ChatResponse {
  response: string;
}

const Chatbot = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("Is Deferred revenue is taxable?");
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
        setInput("Is Deferred revenue is taxable?");
      }
    }
  };

  return (
    <div className="flex flex-col mt-[25%] w-full p-4 bg-white shadow-lg rounded-lg">
      <div className="flex items-center mb-4">
        <div className="w-3 h-3 bg-rose-950 rounded-full mr-2"></div>
        <h1 className="text-lg font-light">Ask StarcAI – Financial Reporting Expert</h1>
      </div>
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-4 ${msg.sender === "user" ? "bg-gray-100 text-center rounded-md" : "bg-white-100"}`}>
            <div className={`inline-block p-2 rounded ${msg.sender === "user" ? "w-full bg-transparent text-center text-gray-800 text-lg font-semibold outline-none" : "w-full bg-transparent  text-center text-white-100 text-lg font-light outline-none"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-left mb-2">
            <div className="inline-block p-2 rounded bg-gray-300">
              <div className="loader"></div>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-center items-center">
        <div className="bg-gray-100 p-6 rounded-md w-[90%] max-w-lg">
          <input
            type="text"
            className="w-full text-center bg-transparent text-gray-800 text-lg font-light outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <button className="bg-indigo-800 text-white py-2 px-4 rounded-md font-semibold hover:bg-purple-800" onClick={handleSend}>
          Enter
        </button>
      </div>
    </div>
  );
};

export default Chatbot;