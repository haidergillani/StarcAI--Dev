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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (doc_id) {
      const fetchDocument = async () => {
        const authToken = localStorage.getItem('authToken');
        try {
          await axios.get(`http://127.0.0.1:2000/docs/${Array.isArray(doc_id) ? doc_id[0] : doc_id}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching document:', error);
          setIsLoading(false);
        }
      };
      void fetchDocument(); // Use void to explicitly ignore the promise
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
