import DocThumbnail from "./DocThumbnail";
import SearchBar from "./SearchBar";
import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import router from "next/router";

interface Document {
  id: number;
  title: string;
  wordCount: number;
  onDelete: (id: number) => void;
}

export default function DocsContainer() {
  const apiUrl = 'https://starcai.onrender.com/';

  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await axios.get(`${apiUrl}/api/search`, {
          params: {
            q: "", // Fetch all documents
          },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        console.log("Response from fetchDocuments:", response);
        handleSearchComplete(response);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDocuments();
  }, []); // Run once when the component mounts

  const handleDelete = async (docId: number) => {
    console.log("Delete clicked", docId);
    try {
      const authToken = localStorage.getItem("authToken");
      // Assuming `apiUrl` is defined somewhere in your code with the base URL of your API
      await axios.delete(`${apiUrl}/docs/${docId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      // Assuming `setDocuments` and `documents` are part of your component's state management
      setDocuments(documents.filter((document) => document.id !== docId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchComplete = (response: AxiosResponse) => {
    // Returns correct documents and errors based on status code
    switch (response.status) {
      case 200:
        // check response message to determine correct action
        // no matching documents returns error text
        if (response.data.message === "No matching documents found") {
          setDocuments([]);
          setError("No documents match the query");
          break;
          // other message indicates search results were found
        } else {
          setDocuments(
            response.data.results.map((doc: any) => ({
              id: doc.id,
              title: doc.title,
              wordCount: doc.word_count, // Make sure it matches the expected property name
              onDelete: handleDelete,
            })),
          );
          setError(null);
          break;
        }
      case 204:
        setDocuments([]);
        setError("No documents exist");
        break;
      default:
        setError("An error occurred");
    }
  };

  const handleDocClick = (id: number) => {
    // Navigate to the corresponding page
    router.push(`/home/${id}`);
  };

  return (
    <div className="flex h-full flex-col space-y-24 pb-57 pl-116 pr-116 pt-57">
      <div className="text-lg_1 font-medium">Documents</div>
      <div>
        <SearchBar onSearchComplete={handleSearchComplete} />
      </div>
      {/* Shows loaded documents in grid format */}
      <div className="flex flex-wrap justify-start gap-x-37 gap-y-57 pt-42">
        {/* If there is an error, documents is an empty array */}
        {error && (
          <div className="text-base font-normal text-black">{error}</div>
        )}
        {documents.length > 0 &&
          documents.map((document: Document) => (
            <div
              key={document.id}
              onClick={() => handleDocClick(document.id)}
              className="cursor-pointer"
            >
              <DocThumbnail
                key={document.id}
                id={document.id}
                title={document.title}
                wordCount={document.wordCount}
                onDelete={handleDelete}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
