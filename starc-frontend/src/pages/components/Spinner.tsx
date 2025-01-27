import React, { useEffect } from 'react';

interface SpinnerProps {
  duration?: number;
  onComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const Spinner: React.FC<SpinnerProps> = ({ duration, onComplete, size = 'medium' }) => {
  useEffect(() => {
    if (duration && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-32 h-32'
  };

  return (
    <div role="status" className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer spinning ring with gradient */}
        <div className={`${sizeClasses[size]} absolute animate-spin`}>
          <div className="w-full h-full rounded-full border-4 border-transparent border-t-[#4F46E5] border-r-[#818CF8] border-b-[#A5B4FC] border-l-[#C7D2FE]" style={{
            background: 'linear-gradient(to right, rgba(79, 70, 229, 0.1), rgba(129, 140, 248, 0.1), rgba(165, 180, 252, 0.1), rgba(199, 210, 254, 0.1))'
          }} />
        </div>
        {/* Inner pulsing circle */}
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 opacity-30 animate-pulse`} />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;