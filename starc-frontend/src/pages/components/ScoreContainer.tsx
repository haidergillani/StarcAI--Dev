import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/router';
// Score icons
import score_optimism from '../../assets/score_optimism.svg';
import score_confidence from '../../assets/score_confidence.svg';
import score_strategicforecast from '../../assets/score_strategicforecast.svg';
import infoIcon from '../../assets/info.svg';

const ScoreContainer = forwardRef((props, ref) => {
  // State to hold the individual scores
  const [scores, setScores] = useState({ "Strategic Forecast": 0, "Optimism": 0, "Confidence": 0 });
  const [overallScore, setOverallScore] = useState(0); // State to hold the overall score
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState('');
  const router = useRouter();
  type TooltipContent = {
    [key: string]: string;
  };

  // Tooltip content for each score
  const tooltipContent: TooltipContent = {
    "optimism": "Positive reactions in investors about your company and its operations.",
    "confidence": "Confidence of an investor in your company's current financial standing.",
    "strategic forecast": "Investor trust and clarity in the future prospects of your business."
  };

  const handleInfoClick = (description: string) => {
    setPopupContent(description);
    setShowPopup(true);
  };

  // Function to close the pop-up when clicking outside of it
  const closePopup = () => {
    setShowPopup(false);
  };

  // Function to fetch scores from the backend
  const fetchScores = () => {
    // Retrieve the document ID from the URL
    const pathArray = router.asPath.split('/');
    const docId = pathArray[pathArray.length - 1];
    console.log('Doc ID from score container: ' + docId);

    // Retrieve the authToken from localStorage (if applicable)
    const authToken = localStorage.getItem("authToken");
    console.log('Auth token' + authToken);

    // Ensure that docId is not null before making the request
    if (docId) {
      axios.get(`http://127.0.0.1:2000/docs/scores/${docId}`, {
        // Include the auth header if authToken is present
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      })
      .then(response => {
        const individualScoresData = response.data[0];

        console.log('Individual scores data:', individualScoresData);
        

        setScores({
          
          "Optimism": Math.round(individualScoresData.optimism * 1) / 1,
          "Confidence": Math.round(individualScoresData.confidence * 1) / 1,
          "Strategic Forecast": Math.round(individualScoresData.forecast * 1) / 1
        });
        setOverallScore(Math.round(individualScoresData.score * 1) / 1);
      })
      .catch(error => {
        console.error('There was an error fetching the scores!', error);
      });
    } else {
      console.error('Document ID not found in URL');
    }
  };

  // Effect hook to fetch scores from the backend every 1 second
  useEffect(() => {
    fetchScores(); // Initial fetch
    const intervalId = setInterval(fetchScores, 1000); // Fetch scores every 1 second

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []); // Dependency array remains empty to run only on component mount

  // Function to dynamically get the score icon
  const getScoreIcon = (key: string) => {
    switch (key) {
      case 'Optimism':
        return score_optimism;
      case 'Confidence':
        return score_confidence;
      case 'Strategic Forecast':
        return score_strategicforecast;
      default:
        return null; // Default case if none match
    }
  };

  return (
    <div className="flex flex-col items-center p-4 relative" onClick={showPopup ? closePopup : undefined}>
      {/* Overall Score container with added bottom margin */}
      <div className="overall-score-container flex items-center justify-between mb-10 w-full">
        <span className="text-gray-700 text-[70px] font-bold">{overallScore}%</span>
        <h2 className="text-2xl mt-[20px] mr-[180px]">Overall Score</h2>
      </div>
      {/* Mapping through each score to display them */}
      {Object.entries(scores).map(([key, value]: [string, number]) => (
        <div key={key} className="w-full mb-4">
          <div className="flex items-center">
            {/* Score icon */}
            <Image src={getScoreIcon(key)} alt={`${key} icon`} width={38} height={38} className="mr-4 mt-4" />
            <div className="flex flex-col w-full">
              <div className="flex justify-between">
                {/* Score percentage and type */}
                <div className="flex mb-2">
                  <span className="text-[20px] font-bold text-black mr-4">{value}%</span>
                  <span className="text-base text-black mt-2">{key}</span>
                </div>
              </div>
              {/* Score bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1"> {/* Set the unfilled portion to light gray */}
                <div className={`h-2.5 rounded-full`} style={{ width: `${value}%`, backgroundColor: value > 0 ? `#${key === 'Optimism' ? '0043CE' : key === 'Confidence' ? 'EF5DA8' : '37C6AB'}` : 'transparent' }}></div>
              </div>
            </div>
          </div>
        </div>
      ))}
      {/* Pop-up component */}
      {showPopup && (
        <div className="popup bg-white p-4 rounded shadow-lg border absolute z-10" onClick={(e) => e.stopPropagation()}>
          <p>{popupContent}</p>
        </div>
      )}
    </div>
  );
});

export default ScoreContainer;