// pages/home/[doc_id].tsx
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import HomeBody from '../components/HomeBody'; // Adjust the path as needed
import Menu from '../components/Menu';
// Import Header if needed

const DocumentPage = () => {
  const router = useRouter();
  const { doc_id } = router.query;
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (doc_id) {
      const fetchDocument = async () => {
        const authToken = localStorage.getItem('authToken');
        try {
          const response = await axios.get(`https://starcai.onrender.com/docs/${doc_id}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          setDocument(response.data);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching document:', error);
          setIsLoading(false);
        }
      };
      fetchDocument();
    }
  }, [doc_id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen w-screen">
      <Menu></Menu>
      <HomeBody/>
    </div>
  );
};

export default DocumentPage;
