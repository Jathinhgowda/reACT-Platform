// src/pages/Onboarding.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const coreStages = [
    { 
      key: "ACT", 
      title: "ACT - Report the Issue", 
      description: 'Quickly file reports on civic problems with immediate location tagging. Be the catalyst for change.', 
      emoji: "💡", 
      color: 'border-teal-400',
      textColor: 'text-teal-400'
    },
    { 
      key: "COLLABORATE", 
      title: "COLLABORATE - Verify & Support", 
      description: 'Use community verification and comments to amplify valid reports. Prioritize what matters most.', 
      emoji: "🤝", 
      color: 'border-indigo-400',
      textColor: 'text-indigo-400'
    },
    { 
      key: "TRANSFORM", 
      title: "TRANSFORM - Track & Reward", 
      description: 'Watch the official timeline as authorities resolve the issue. Earn points, badges, and recognition.', 
      emoji: "🏆", 
      color: 'border-yellow-400',
      textColor: 'text-yellow-400'
    },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0); 
  const CARD_WIDTH = 300; 
  const GAP_WIDTH = 24;
  const SLIDE_INTERVAL = 4000; 

  // Auto-sliding mechanism
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prevIndex => (prevIndex + 1) % coreStages.length);
    }, SLIDE_INTERVAL); 

    return () => clearInterval(interval); 
  }, []);

  const handleStartClick = () => {
    localStorage.setItem("onboarding_complete", "true");
    navigate("/auth/signup");
  };

  const offset = activeIndex * (CARD_WIDTH + GAP_WIDTH);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.08),transparent_70%)] pointer-events-none" />
      
      <div className="max-w-5xl w-full text-center bg-gray-900/70 backdrop-blur-2xl rounded-3xl border border-gray-700 shadow-[0_0_40px_-10px_rgba(45,212,191,0.4)] p-8 md:p-12 z-10">
        
        {/* Title Block */}
        <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-teal-400 via-cyan-300 to-green-300 bg-clip-text text-transparent drop-shadow-lg mb-6">
          Welcome to reACT
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-gray-300 mb-6"> {/* Reduced margin bottom */}
          Empowering citizens through <span className="text-teal-400">Action</span>, <span className="text-indigo-400">Collaboration</span>, and <span className="text-yellow-400">Transformation</span>.
        </p>

        {/* --- Stages Carousel Container --- */}
        <div 
             // FIX: Removed negative margin. Added pt-12 to push content down significantly
             // The tiles are now positioned lower within the card structure.
             className="relative h-96 overflow-hidden pt-12 mb-8" 
        > 
            <div className="flex justify-start items-start space-x-6 w-full h-full transition-transform duration-1000 ease-in-out"
                 style={{ transform: `translateX(calc(50% - ${offset}px))` }}> 
                
                {coreStages.map((stage, index) => {
                    const isActive = index === activeIndex;
                    
                    return (
                        <div
                            key={stage.key}
                            className={`flex-shrink-0 w-72 p-6 rounded-2xl border ${stage.color} shadow-lg transition-all duration-500 ease-out cursor-default z-20 
                                ${isActive 
                                    ? `bg-gray-800/80 shadow-[0_0_30px_rgba(45,212,191,0.6)] border-opacity-100 transform scale-105` 
                                    : `bg-gray-800/30 border-opacity-30 transform scale-90 opacity-60`
                                }`}
                            onClick={() => setActiveIndex(index)}
                        >
                            <div className={`text-6xl mb-3 flex justify-center ${stage.textColor}`}>{stage.emoji}</div> 
                            <h2 className="text-2xl font-bold mb-3 text-white">{stage.title}</h2>
                            <p className="text-sm text-gray-400 leading-relaxed">{stage.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
        
        <div className='mt-8'> 
            {/* Start Button */}
            <button
              onClick={handleStartClick}
              className="px-10 py-4 bg-gradient-to-r from-teal-400 via-cyan-400 to-green-400 text-gray-900 text-xl font-extrabold rounded-full shadow-lg hover:shadow-[0_0_25px_rgba(45,212,191,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-teal-500/50"
            >
              Get Started - Join the Movement!
            </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;