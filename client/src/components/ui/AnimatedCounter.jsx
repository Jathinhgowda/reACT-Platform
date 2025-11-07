// src/components/ui/AnimatedCounter.jsx
import React, { useState, useEffect } from 'react';

const DURATION = 1000; // Animation duration in milliseconds

const AnimatedCounter = ({ endValue, title, colorClass, icon, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (endValue === 0) return; // Skip animation if value is zero

    let startTime;
    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / DURATION, 1);

      // Calculate the current value using the percentage progress
      const currentValue = Math.floor(percentage * endValue);
      setCount(currentValue);

      // Continue the animation until 100% progress is reached
      if (percentage < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);

    // Cleanup function
    return () => {
      // Optional cleanup if component unmounts mid-animation
    };
  }, [endValue]);

  // Display the animated count with optional suffix
  const displayCount = (count === 0 && endValue === 0) ? endValue : count;

  return (
    <div className={`p-4 rounded-xl shadow-lg flex flex-col items-center justify-center ${colorClass}`}>
      <div className="text-5xl mb-2">{icon}</div>
      <p className="text-4xl font-extrabold">
        {displayCount.toLocaleString()}{suffix}
      </p>
      <p className="text-lg font-medium opacity-90 mt-1">{title}</p>
    </div>
  );
};

export default AnimatedCounter;
