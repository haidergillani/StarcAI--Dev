import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import axios from 'axios';
import styles from "../../styles/Menu.module.css";
import Spinner from "./Spinner";

// Importing icons
import HomeIcon from "../../assets/home.svg";
import AccountIcon from "../../assets/account.svg";
import SettingsIcon from "../../assets/settings.svg";
import DocumentIcon from "../../assets/document.svg";
import CloseIcon from "../../assets/close.svg";
import MenuIcon from "../../assets/menu.svg";
import UploadIcon from "../../assets/upload.svg";
import DownloadIcon from "../../assets/download.svg";

interface MenuProps {
  defaultOpen?: boolean;
}

interface DocumentResponse {
  id: number;
  title: string;
  text: string;
}

interface ScoreResponse {
  score: number;
  optimism: number;
  forecast: number;
  confidence: number;
}

const Menu: React.FC<MenuProps> = ({ defaultOpen = false }) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocText, setNewDocText] = useState("");
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [documentId, setDocumentId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      const pathArray = router.asPath.split('/');
      const potentialDocId = pathArray[pathArray.length - 1];
      if (potentialDocId) {
        setDocumentId(potentialDocId);
      }
    }
  }, [router.isReady, router.asPath]);

  useEffect(() => {
    if (!defaultOpen) {
      if (isOpen) {
        const timer = setTimeout(() => setAnimationCompleted(true), 300);
        return () => clearTimeout(timer);
      } else {
        setAnimationCompleted(false);
      }
    }
  }, [isOpen, defaultOpen]);

  const onTransitionEnd = () => {
    if (isOpen) {
      setAnimationCompleted(true);
    }
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const createNewDocument = async () => {
    setIsCreating(true);
    const authToken = localStorage.getItem("authToken");
    try {
      // Create document
      const response = await axios.post<DocumentResponse>(
        `${API_URL}/docs`,
        { title: newDocTitle, text: newDocText },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      // Fetch both document and scores in parallel
      const [docResponse, scoresResponse] = await Promise.all([
        axios.get<DocumentResponse>(
          `${API_URL}/docs/${response.data.id}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        ),
        axios.get<ScoreResponse[]>(
          `${API_URL}/docs/scores/${response.data.id}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        )
      ]);
      
      // Navigate with complete data
      await router.push({
        pathname: `/home/${response.data.id}`,
        query: { 
          initialDoc: JSON.stringify(docResponse.data),
          initialScores: JSON.stringify(scoresResponse.data[0])
        }
      });
      setIsNewDocModalOpen(false);
    } catch (error) {
      console.error("Error creating document:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const exportDocumentAsPdf = async () => {
    if (!documentId) {
      console.error("No document ID found");
      return;
    }
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("No auth token found");
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/docs/pdf/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          responseType: "blob",
        },
      );

      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting document as PDF:", error);
    }
  };

  const navigateTo = (path: string) => {
    if (router.pathname.includes("/docs") && path === "/docs") {
      return;
    }
    setIsOpen(false);
    void router.push(path);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target?.files;
    if (files?.[0]) {
      setSelectedFile(files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      console.error("No file selected");
      return;
    }

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("No auth token found");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        `${API_URL}/docs/pdf`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.status === 200) {
        console.log("File uploaded successfully");
        setIsUploadModalOpen(false);
        void router.reload();
      } else {
        console.error("Error uploading file:", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {!defaultOpen && (
        <button
          onClick={toggleMenu}
          className="absolute left-0 top-0 z-30 mt-[20px] rounded-full p-2 transition duration-300 hover:bg-gray-200"
        >
          <div className="relative">
            {isOpen ? (
              <div> </div>
            ) : (
              <Image src={MenuIcon as StaticImageData} alt="Menu" width={42} height={42} />
            )}
          </div>
        </button>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-20 transition-transform duration-300 ${
          !defaultOpen ? (isOpen ? "translate-x-0" : "-translate-x-full") : ""
        } ${
          animationCompleted && !defaultOpen ? "bg-gray-800 bg-opacity-75" : ""
        } ${!defaultOpen ? (defaultOpen ? "right-1/4" : "right-0") : ""}`}
        onTransitionEnd={onTransitionEnd}
      >
        <div className="fixed inset-y-0 left-0 z-30 w-full max-w-xs overflow-y-auto border-r-2 border-gray-300 bg-white p-5">
          <nav className="flex flex-col space-y-5">
            <button
              onClick={() => navigateTo("/docs")}
              className={`flex items-center space-x-2 rounded-md bg-white px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300 ${styles.menuItem}`}
            >
              <Image src={HomeIcon as StaticImageData} alt="Home" width={24} height={24} />
              <span>Home</span>
            </button>
            <button
              onClick={() => navigateTo("/not-found")}
              className={`flex items-center space-x-2 rounded-md bg-white px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300 ${styles.menuItem}`}
            >
              <Image src={AccountIcon as StaticImageData} alt="Account" width={24} height={24} />
              <span>Account</span>
            </button>
            <button
              onClick={() => navigateTo("/not-found")}
              className={`flex items-center space-x-2 rounded-md bg-white px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300 ${styles.menuItem}`}
            >
              <Image src={SettingsIcon as StaticImageData} alt="Settings" width={24} height={24} />
              <span>Settings</span>
            </button>

            {isNewDocModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
                <div className="relative rounded bg-white p-5">
                  {isCreating ? (
                    <div className="flex flex-col items-center justify-center p-8">
                      <Spinner />
                      <p className="mt-4 text-lg text-gray-700">Processing...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-lg">Create New Document</h2>
                        <button
                          onClick={() => setIsNewDocModalOpen(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Image src={CloseIcon as StaticImageData} alt="Close" width={32} height={32} />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Document Title"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        className="mb-2 w-full rounded border p-2"
                      />
                      <textarea
                        placeholder="Document Content"
                        value={newDocText}
                        onChange={(e) => setNewDocText(e.target.value)}
                        className="mb-2 h-40 w-full rounded border p-2"
                      />
                      <button
                        onClick={createNewDocument}
                        className="w-full rounded bg-blue-500 p-2 text-white"
                      >
                        Create
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsNewDocModalOpen(true)}
              className={`flex items-center  space-x-2 rounded-md bg-white px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300 ${styles.menuItem}`}
            >
              <Image src={DocumentIcon as StaticImageData} alt="New Document" width={24} height={24} />
              <span>New document</span>
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className={`flex items-center space-x-2 rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300 ${styles.menuItem}`}
            >
              <Image src={UploadIcon as StaticImageData} alt="Upload" width={24} height={24} />
              <span>Upload</span>
            </button>

            <button
              onClick={() => documentId ? exportDocumentAsPdf() : console.warn('Document ID is undefined')}
              className="flex items-center space-x-2 rounded-md bg-white px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300"
            >
              <Image src={DownloadIcon as StaticImageData} alt="Download" width={24} height={24} />
              <span>Download</span>
            </button>

            {isUploadModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
                <div className="relative rounded bg-white p-5">
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center p-8">
                      <Spinner />
                      <p className="mt-4 text-lg text-gray-700">Processing PDF...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-lg">Upload File</h2>
                        <button
                          onClick={() => setIsUploadModalOpen(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Image src={CloseIcon as StaticImageData} alt="Close" width={32} height={32} />
                        </button>
                      </div>
                      <input
                        type="file"
                        name="pdf"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                      />
                      <button
                        onClick={uploadFile}
                        className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
                      >
                        Upload
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
      {animationCompleted && !defaultOpen && (
        <button
          onClick={toggleMenu}
          className="absolute left-80 top-0 z-40 ml-6 rounded-full bg-white p-2 transition duration-300 hover:bg-gray-200"
        >
          <Image src={CloseIcon as StaticImageData} alt="Close" width={32} height={32} />
        </button>
      )}
    </>
  );
};

export default Menu;