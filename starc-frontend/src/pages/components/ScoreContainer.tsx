import React, { useState, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { useRouter } from 'next/router';
// Score icons
import score_optimism from '../../assets/score_optimism.svg';
import score_confidence from '../../assets/score_confidence.svg';
import score_trustworthy from '../../assets/score_trustworthy.svg';

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
  "Strategic Forecast": "Indicates how likely investors are to trust the forward looking statements",
  "Optimism": "Measures the positive outlook and optimistic tone of the content",
  "Confidence": "Reflects the confidence investors will likely have in the company's future"
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
        "Optimism": props.initialScores.optimism,
        "Confidence": props.initialScores.confidence,
        "Strategic Forecast": props.initialScores.forecast
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
            "Optimism": scoreData.optimism,
            "Confidence": scoreData.confidence,
            "Strategic Forecast": scoreData.forecast
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
        "Optimism": scores.optimism ?? 0,
        "Confidence": scores.confidence ?? 0,
        "Strategic Forecast": scores.forecast ?? 0
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
        return score_trustworthy as StaticImageData;
      default:
        throw new Error(`Unknown score key: ${String(key)}`);
    }
  };

  const displayLabels: Record<string, string> = {
    "Optimism": "Optimistic",
    "Confidence": "Confident",
    "Strategic Forecast": "Trustworthy"
  };
  
  useImperativeHandle(ref, () => ({
    fetchScores,
    updateScores,
    setIsLoading
  }));

  return (
    <div className="flex flex-col items-center p-4 relative" onClick={showPopup ? closePopup : undefined}>
      <div className="overall-score-container w-full mb-6">
        <div className="flex items-center space-x-3">
          <p className="text-[38px] font-bold text-gray-700 dark:text-white">{Math.floor(overallScore)}%</p>
          <p className="text-[24px] font-medium text-gray-600 dark:text-gray-300">Overall Score</p>
        </div>
      </div>
      {Object.entries(scores)
        .sort(([a], [b]) => {
          const order = ["Optimism", "Confidence", "Strategic Forecast"];
          return order.indexOf(a) - order.indexOf(b);
        })
        .map(([key, value], index) => (

        <div
          key={key}
          className={`w-full mb-4 ${index === 0 ? 'mt-2' : ''}`}
        >

          <div className="flex items-center">
            {isLoading ? (
              <div className="mr-4 mt-4 w-[38px] h-[38px]">
                <div 
                  className="animate-spin rounded-full w-[38px] h-[38px] border-4" 
                  style={{ 
                    borderColor: `${key === 'Optimism' ? '#117F6A' : key === 'Confidence' ? '#454F63' : '#71063D'} transparent transparent transparent`
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
              <div className="flex items-center space-x-2 mt-4">
                <span className="text-[20px] font-medium text-gray-800 dark:text-gray-200">{Math.floor(value)}%</span>
                <span className="text-[17px] text-gray-600 dark:text-gray-400">
                  {displayLabels[key] ?? key}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ 
                    width: `${value}%`, 
                    backgroundColor: value > 0
                    ? key === 'Optimism'
                      ? '#117F6A'
                      : key === 'Confidence'
                      ? '#454F63'
                      : '#71063D' // Strategic Forecast
                    : 'transparent'
                  
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