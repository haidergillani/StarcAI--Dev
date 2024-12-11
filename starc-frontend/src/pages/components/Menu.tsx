import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import axios from 'axios';
import styles from "../../styles/Menu.module.css"; // Adjust the path to your CSS module

// Importing icons
import HomeIcon from "../../assets/home.svg"; // Adjust the path according to your assets folder structure
import AccountIcon from "../../assets/account.svg";
import SettingsIcon from "../../assets/settings.svg";
import DocumentIcon from "../../assets/document.svg";
import CloseIcon from "../../assets/close.svg";
import MenuIcon from "../../assets/menu.svg";
import UploadIcon from "../../assets/upload.svg";
import DownloadIcon from "../../assets/download.svg"; // Import the download icon

const Menu = ({ defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocText, setNewDocText] = useState("");
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [documentId, setDocumentId] = useState('');
  const [isCreating, setIsCreating] = useState(false); // State to track document creation

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
      setAnimationCompleted(true); // Set to true once the opening transition ends
    }
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const createNewDocument = async () => {
    if (isCreating) return; // Prevent multiple clicks

    setIsCreating(true); // Set loading state
    const authToken = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        "http://127.0.0.1:2000/docs",
        {
          title: newDocTitle,
          text: newDocText,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200) {
        const newDocId = response.data.id;
        localStorage.setItem("openDocId", newDocId); // Update local storage with new document ID
        setIsNewDocModalOpen(false);
        router.push(`/home/${newDocId}`);
      } else {
        // Handle other status codes appropriately
      }
    } catch (error) {
      console.error("Error creating new document:", error);
    } finally {
      setIsCreating(false); // Reset loading state
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
        `http://127.0.0.1:2000/docs/pdf/${documentId}`,
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
      link.setAttribute('download', 'document.pdf'); // or use response headers to get filename
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
    router.push(path);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedFile(file);
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

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "http://127.0.0.1:2000/docs/pdf",
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
        router.reload(); // Reload the page after successful upload
      } else {
        console.error("Error uploading file:", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <>
      {/* Menu Toggle Button */}
      {!defaultOpen && (
        <button
          onClick={toggleMenu}
          className="absolute left-0 top-0 z-30 mt-[20px] rounded-full p-2 transition duration-300 hover:bg-gray-200"
        >
          <div className="relative">
            {isOpen ? (
              <div> </div>
            ) : (
              <Image src={MenuIcon} alt="Menu" width={42} height={42} />
            )}
          </div>
        </button>
      )}

      {/* Menu Overlay */}
      <div
        className={`fixed inset-y-0 left-0 z-20 transition-transform duration-300 ${
          !defaultOpen ? (isOpen ? "translate-x-0" : "-translate-x-full") : ""
        } ${
          animationCompleted && !defaultOpen ? "bg-gray-800 bg-opacity-75" : ""
        } ${!defaultOpen ? (defaultOpen ? "right-1/4" : "right-0") : ""}`}
        onTransitionEnd={onTransitionEnd}
      >
        {/* Menu Items Container */}
        <div className="fixed inset-y-0 left-0 z-30 w-full max-w-xs overflow-y-auto border-r-2 border-gray-300 bg-white p-5">
          {/* Navigation Links */}
          <nav className="flex flex-col space-y-5">
            <button
              onClick={() => navigateTo("/docs")}
              className={`flex items-center space-x-2 rounded-md bg-white px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300 ${styles.menuItem}`}
            >
              <Image src={HomeIcon} alt="Home" width={24} height={24} />
              <span>Home</span>
            </button>
            <button
              onClick={() => navigateTo("/not-found")}
              className={`flex items-center space-x-2 rounded-md bg-white px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300 ${styles.menuItem}`}
            >
              <Image src={AccountIcon} alt="Account" width={24} height={24} />
              <span>Account</span>
            </button>
            <button
              onClick={() => navigateTo("/not-found")}
              className={`flex items-center space-x-2 rounded-md bg-white px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300 ${styles.menuItem}`}
            >
              <Image src={SettingsIcon} alt="Settings" width={24} height={24} />
              <span>Settings</span>
            </button>

            {/* New Document Modal */}
            {isNewDocModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
                <div className="relative rounded bg-white p-5">
                  <h2 className="text-lg">Create New Document</h2>
                  <input
                    type="text"
                    placeholder="Document Title"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="mt-2 w-full rounded border p-2"
                  />
                  <textarea
                    placeholder="Document Content"
                    value={newDocText}
                    onChange={(e) => setNewDocText(e.target.value)}
                    className="mt-2 w-full rounded border p-2"
                    rows={4}
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setIsNewDocModalOpen(false)}
                      className="mr-2 rounded bg-gray-300 px-4 py-2 text-black"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createNewDocument}
                      className="rounded bg-blue-500 px-4 py-2 text-white"
                      disabled={isCreating} // Disable the button while creating
                    >
                      {isCreating ? "Creating..." : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsNewDocModalOpen(true)}
              className={`flex items-center  space-x-2 rounded-md bg-white px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300 ${styles.menuItem}`}
            >
              <Image
                src={DocumentIcon}
                alt="New Document"
                width={24}
                height={24}
              />
              <span>New document</span>
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className={`flex items-center space-x-2 rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300 ${styles.menuItem}`}
            >
              <Image src={UploadIcon} alt="Upload" width={24} height={24} />
              <span>Upload</span>
            </button>

            <button
              onClick={() => documentId ? exportDocumentAsPdf() : console.warn('Document ID is undefined')}
              className="flex items-center space-x-2 rounded-md bg-white px-4 py-2 text-gray-800 transition-colors duration-200 hover:bg-gray-300"
            >
              <Image src={DownloadIcon} alt="Download" width={24} height={24} /> {/* Add the download icon */}
              <span>Download</span>
            </button>

            {/* Upload Modal */}
            {isUploadModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
                <div className="relative rounded bg-white p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-lg">Upload File</h2>
                    <button
                      onClick={() => setIsUploadModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Image
                        src={CloseIcon}
                        alt="Close"
                        width={32}
                        height={32}
                      />
                    </button>
                  </div>
                  {/* Updated file input */}
                  <input
                    type="file"
                    name="pdf"
                    accept=".pdf" // Accept only PDF files if that's the requirement
                    onChange={handleFileChange}
                    className={styles.fileInput} // Apply your CSS styles if needed
                  />
                  <button
                    onClick={uploadFile}
                    className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
                  >
                    Upload
                  </button>
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
          <Image src={CloseIcon} alt="Close" width={32} height={32} />
        </button>
      )}
    </>
  );
};

export default Menu;