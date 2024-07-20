import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/router';
// Score icons
import score_optimism from '../../assets/score_optimism.svg';
import score_confidence from '../../assets/score_confidence.svg';
import score_strategicforecast from '../../assets/score_strategicforecast.svg';
import infoIcon from '../../assets/info.svg';

export default function ScoreContainer() {
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
  
  // Effect hook to fetch scores from the backend
  useEffect(() => {
    // Retrieve the document ID from localStorage
    const pathArray = router.asPath.split('/');
    const docId = pathArray[pathArray.length - 1];
    console.log('Doc ID from score container: ' + docId);

    // Retrieve the authToken from localStorage (if applicable)
    const authToken = localStorage.getItem("authToken");
    console.log('Auth token' + authToken);

    // Ensure that docId is not null before making the request
    if (docId) {
      console.log('Doc ID from score container: ' + docId);
      axios.get(`https://starcai.onrender.com/docs/scores/${docId}`, {
        
        // Include the auth header if authToken is present
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      })

      .then(response => {
        const { Overall, ...individualScores } = response.data;
        const individualScoresData = response.data[0];

        setScores({
          "Strategic Forecast": Math.round(individualScoresData.forecast * 1) / 1,
          "Optimism": Math.round(individualScoresData.optimism * 1) / 1,
          "Confidence": Math.round(individualScoresData.confidence * 1) / 1
        });
        setOverallScore(Math.round(individualScoresData.score * 1) / 1);
         // Set the overall score separately
      })
      .catch(error => {
        console.error('There was an error fetching the scores!', error);
      });
    } else {
      console.error('Document ID not found in localStorage');
    }
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
      <div className="overall-score-container flex items-center justify-between mb-10  w-full">
        <h2 className="text-3xl font-bold">Overall Score</h2>
        <span className="text-base font-bold">{overallScore}%</span>
      </div>
      {/* Mapping through each score to display them */}
      {Object.entries(scores).map(([key, value]: [string, number]) => (
        <div key={key} className="w-full mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Score icon */}
              <Image src={getScoreIcon(key)} alt={`${key} icon`} width={24} height={24} className="mr-2" />
              {/* Score name and info icon */}
              <span className={`text-base font-bold mr-2 text-${key.toLowerCase()}`} style={{ color: `#${key === 'Optimism' ? '0043CE' : key === 'Confidence' ? 'EF5DA8' : '37C6AB'}` }}>
                {key}
              </span>
              <div
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof key === "string") {
                    const content = tooltipContent[key.toLowerCase()];
                    if (content) {
                      handleInfoClick(content);
                    }
                  }
                }}
              >
                <Image src={infoIcon} alt="Info" width={18} height={18} />
              </div>
            </div>
            {/* Score percentage aligned with the end of the bar */}
            <span className="text-base font-bold">{value}%</span>
          </div>
          {/* Score bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1">
            <div className={`bg-${key.toLowerCase()} h-2.5 rounded-full`} style={{ width: `${value}%`, backgroundColor: value > 0 ? `#${key === 'Optimism' ? '0043CE' : key === 'Confidence' ? 'EF5DA8' : '37C6AB'}` : 'transparent' }}></div>
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
}
