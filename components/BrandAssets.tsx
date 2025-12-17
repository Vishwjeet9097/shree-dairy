
import React from 'react';

export const AppLogo = ({ className, size = 48 }: { className?: string, size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 512 512" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#bef264', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#84cc16', stopOpacity: 1 }} />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Background Circle */}
    <circle cx="256" cy="256" r="256" fill="url(#logoGradient)" />
    
    {/* Inner White Ring */}
    <circle cx="256" cy="256" r="220" fill="none" stroke="white" strokeWidth="10" opacity="0.4" />
    
    {/* Drop Icon */}
    <path 
      d="M256 120 C256 120 160 240 160 310 C160 365 203 410 256 410 C309 410 352 365 352 310 C352 240 256 120 256 120 Z" 
      fill="white" 
    />
    
    {/* Text */}
    <text 
      x="50%" 
      y="55%" 
      dominantBaseline="middle" 
      textAnchor="middle" 
      fontFamily="Hind, sans-serif" 
      fontWeight="bold" 
      fontSize="220" 
      fill="#dc2626"
      filter="url(#glow)"
    >
      श्री
    </text>
  </svg>
);

export const AdaptiveIcon = () => (
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#111827"/>
        <circle cx="256" cy="256" r="192" fill="#bef264"/>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Hind, sans-serif" font-weight="bold" font-size="200" fill="#dc2626">श्री</text>
    </svg>
);
