import React from 'react';

const WavyBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5E6D3] via-[#FAF0E6] to-[#FFF8DC] opacity-90"></div>
      <svg className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
        
      
        <ellipse cx="20%" cy="30%" rx="35%" ry="25%" fill="#E8D5C4" opacity="0.15" filter="url(#goo)">
          <animate attributeName="cx" values="20%;25%;20%" dur="20s" repeatCount="indefinite" />
          <animate attributeName="cy" values="30%;35%;30%" dur="15s" repeatCount="indefinite" />
        </ellipse>
        
        <ellipse cx="80%" cy="60%" rx="40%" ry="30%" fill="#F0E6D2" opacity="0.2" filter="url(#goo)">
          <animate attributeName="cx" values="80%;75%;80%" dur="18s" repeatCount="indefinite" />
          <animate attributeName="cy" values="60%;55%;60%" dur="22s" repeatCount="indefinite" />
        </ellipse>
        
        <ellipse cx="50%" cy="80%" rx="45%" ry="35%" fill="#FFF5E1" opacity="0.18" filter="url(#goo)">
          <animate attributeName="cx" values="50%;55%;50%" dur="25s" repeatCount="indefinite" />
          <animate attributeName="cy" values="80%;75%;80%" dur="20s" repeatCount="indefinite" />
        </ellipse>
        
        
        <ellipse cx="70%" cy="20%" rx="25%" ry="20%" fill="#DCC9B3" opacity="0.12" filter="url(#goo)">
          <animate attributeName="cx" values="70%;73%;70%" dur="16s" repeatCount="indefinite" />
        </ellipse>
        
        <ellipse cx="30%" cy="70%" rx="30%" ry="25%" fill="#E8DCC8" opacity="0.1" filter="url(#goo)">
          <animate attributeName="cy" values="70%;68%;70%" dur="19s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    </div>
  );
};

export default WavyBackground;
