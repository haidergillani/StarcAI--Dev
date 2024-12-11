import React, { useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import axios from 'axios';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { useRouter } from 'next/router';
// Score icons
import score_optimism from '../../assets/score_optimism.svg';
import score_confidence from '../../assets/score_confidence.svg';
import score_strategicforecast from '../../assets/score_strategicforecast.svg';

interface ScoreContainerRef {
  fetchScores: () => void;
}

interface ScoreContainerProps {
  text?: string;
}

interface ScoreResponse {
  optimism: number;
  confidence: number;
  forecast: number;
  score: number;
}

interface Scores {
  "Strategic Forecast": number;
  "Optimism": number;
  "Confidence": number;
}

const ScoreContainer = forwardRef<ScoreContainerRef, ScoreContainerProps>((props, ref) => {
  const [scores, setScores] = useState<Scores>({ "Strategic Forecast": 0, "Optimism": 0, "Confidence": 0 });
  const [overallScore, setOverallScore] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  const closePopup = () => {
    setShowPopup(false);
  };

  const fetchScores = useCallback(() => {
    const pathArray = router.asPath.split('/');
    const docId = pathArray[pathArray.length - 1];
    const authToken = localStorage.getItem("authToken");

    if (docId) {
      axios.get<ScoreResponse>(`http://127.0.0.1:2000/docs/scores/${docId}`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      })
      .then(response => {
        const scoreData = response.data;
        setScores({
          "Optimism": Math.round(scoreData.optimism * 1) / 1,
          "Confidence": Math.round(scoreData.confidence * 1) / 1,
          "Strategic Forecast": Math.round(scoreData.forecast * 1) / 1
        });
        setOverallScore(Math.round(scoreData.score * 1) / 1);
      })
      .catch(error => {
        console.error('There was an error fetching the scores!', error);
      });
    } else {
      console.error('Document ID not found in URL');
    }
  }, [router.asPath]);

  const getScoreIcon = (key: keyof Scores): StaticImageData => {
    switch (key) {
      case 'Optimism':
        return score_optimism as StaticImageData;
      case 'Confidence':
        return score_confidence as StaticImageData;
      case 'Strategic Forecast':
        return score_strategicforecast as StaticImageData;
      default:
        throw new Error(`Unknown score key: ${String(key)}`);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchScores
  }));

  return (
    <div className="flex flex-col items-center p-4 relative" onClick={showPopup ? closePopup : undefined}>
      <div className="overall-score-container flex items-center justify-between mb-10 w-full">
        <span className="text-gray-700 text-[70px] font-bold">{overallScore}%</span>
        <h2 className="text-2xl mt-[20px] mr-[180px]">Overall Score</h2>
      </div>
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} className="w-full mb-4">
          <div className="flex items-center">
            <Image 
              src={getScoreIcon(key as keyof Scores)} 
              alt={`${key} icon`} 
              width={38} 
              height={38} 
              className="mr-4 mt-4" 
            />
            <div className="flex flex-col w-full">
              <div className="flex justify-between">
                <div className="flex mb-2">
                  <span className="text-[20px] font-bold text-black mr-4">{value}%</span>
                  <span className="text-base text-black mt-2">{key}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ 
                    width: `${value}%`, 
                    backgroundColor: value > 0 ? `#${key === 'Optimism' ? '454F63' : key === 'Confidence' ? '71063D' : '117F6A'}` : 'transparent' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      {showPopup && (
        <div className="popup bg-white p-4 rounded shadow-lg border absolute z-10" onClick={(e) => e.stopPropagation()}>
          <p>Score Information</p>
        </div>
      )}
    </div>
  );
});

ScoreContainer.displayName = 'ScoreContainer';

export default ScoreContainer;