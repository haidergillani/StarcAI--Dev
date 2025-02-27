import React, { useState, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { useRouter } from 'next/router';
// Score icons
import score_optimism from '../../assets/score_optimism.svg';
import score_confidence from '../../assets/score_confidence.svg';
import score_strategicforecast from '../../assets/score_strategicforecast.svg';

export interface ScoreContainerRef {
  fetchScores: () => void;
  updateScores: (scores: number[] | {
    score: number;
    optimism: number;
    forecast: number;
    confidence: number;
  }) => void;
  setIsLoading: (loading: boolean) => void;
}

interface ScoreContainerProps {
  text: string;
  initialScores?: {
    score: number;
    optimism: number;
    forecast: number;
    confidence: number;
  } | null;
}

interface ScoreResponse {
  id: number;
  text_chunk_id: number;
  score: number;
  optimism: number;
  forecast: number;
  confidence: number;
}

interface Scores {
  "Strategic Forecast": number;
  "Optimism": number;
  "Confidence": number;
}

interface TooltipContent {
  "Strategic Forecast": string;
  "Optimism": string;
  "Confidence": string;
}

const tooltipContent: TooltipContent = {
  "Strategic Forecast": "Indicates the potential future outcomes and strategic implications of the content",
  "Optimism": "Measures the positive outlook and constructive tone of the content",
  "Confidence": "Reflects the certainty and reliability of the statements made"
};

const ScoreContainer = forwardRef<ScoreContainerRef, ScoreContainerProps>((props, ref) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';
  const [scores, setScores] = useState<Record<string, number>>({});
  const [overallScore, setOverallScore] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (props.initialScores) {
      setScores({
        "Strategic Forecast": props.initialScores.forecast,
        "Optimism": props.initialScores.optimism,
        "Confidence": props.initialScores.confidence
      });
      setOverallScore(props.initialScores.score);
      setIsLoading(false);
    }
  }, [props.initialScores]);

  const closePopup = () => {
    setShowPopup(false);
  };

  const fetchScores = useCallback(() => {
    const pathArray = router.asPath.split('/');
    const docId = pathArray[pathArray.length - 1];
    const authToken = localStorage.getItem("authToken");

    if (docId) {
      console.log("Fetching scores after typing stopped");
      setIsLoading(true);
      axios.get<ScoreResponse[]>(`${API_URL}/docs/scores/${docId}`, {
        headers: { 'Authorization': `Bearer ${authToken ?? ''}` }
      })
      .then(response => {
        if (response.data?.[0]) {
          const scoreData = response.data[0];
          setScores({
            "Strategic Forecast": scoreData.forecast,
            "Optimism": scoreData.optimism,
            "Confidence": scoreData.confidence
          });
          setOverallScore(scoreData.score);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('There was an error fetching the scores!', error);
        setIsLoading(false);
      });
    }
  }, [router.asPath, API_URL]);

  const updateScores = useCallback((scores: number[] | {
    score: number;
    optimism: number;
    forecast: number;
    confidence: number;
  }) => {
    if (Array.isArray(scores)) {
      setScores({
        "Strategic Forecast": scores[2] ?? 0,
        "Optimism": scores[1] ?? 0,
        "Confidence": scores[3] ?? 0
      });
      setOverallScore(scores[0] ?? 0);
    } else {
      setScores({
        "Strategic Forecast": scores.forecast ?? 0,
        "Optimism": scores.optimism ?? 0,
        "Confidence": scores.confidence ?? 0
      });
      setOverallScore(scores.score ?? 0);
    }
    setIsLoading(false);
  }, []);

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
    fetchScores,
    updateScores,
    setIsLoading
  }));

  return (
    <div className="flex flex-col items-center p-4 relative" onClick={showPopup ? closePopup : undefined}>
      <div className="overall-score-container flex items-center justify-between mb-10 w-full">
        <span className="text-gray-700 dark:text-gray-200 text-[70px] font-bold">{overallScore}%</span>
        <h2 className="text-2xl mt-[20px] mr-[180px] text-gray-800 dark:text-gray-200">Overall Score</h2>
      </div>
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} className="w-full mb-4">
          <div className="flex items-center">
            {isLoading ? (
              <div className="mr-4 mt-4 w-[38px] h-[38px]">
                <div 
                  className="animate-spin rounded-full w-[38px] h-[38px] border-4" 
                  style={{ 
                    borderColor: `${key === 'Optimism' ? '#454F63' : key === 'Confidence' ? '#71063D' : '#117F6A'} transparent transparent transparent`
                  }}
                />
              </div>
            ) : (
              <div className="relative group">
                <Image 
                  src={getScoreIcon(key as keyof Scores)} 
                  alt={`${key} icon`} 
                  width={38} 
                  height={38} 
                  className="mr-4 mt-4" 
                />
                <div className="absolute left-0 -bottom-1 hidden group-hover:block bg-gray-800 dark:bg-gray-700 text-white text-sm rounded px-2 py-1 w-48 z-10">
                  {tooltipContent[key as keyof TooltipContent]}
                </div>
              </div>
            )}
            <div className="flex flex-col w-full">
              <div className="flex justify-between">
                <div className="flex mb-2">
                  <span className="text-[20px] font-bold text-gray-800 dark:text-gray-200 mr-4">{value}%</span>
                  <span className="text-base text-gray-800 dark:text-gray-200 mt-2">{key}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
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
        <div className="popup bg-white dark:bg-gray-800 p-4 rounded shadow-lg border dark:border-gray-700 absolute z-10" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-800 dark:text-gray-200">Score Information</p>
        </div>
      )}
    </div>
  );
});

ScoreContainer.displayName = 'ScoreContainer';

export default ScoreContainer;