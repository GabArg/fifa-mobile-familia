import React from 'react';

export const NeonBall = ({ className = "w-12 h-12", color = "#00ff9d" }) => (
    <svg
        viewBox="0 0 100 100"
        className={`${className} animate-spin-slow`}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
    >
        <defs>
            <linearGradient id="ballGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#888888" />
            </linearGradient>
        </defs>

        {/* Outer Glow Circle */}
        <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.8" />

        {/* Ball Main Body */}
        <circle cx="50" cy="50" r="45" fill="url(#ballGradient)" opacity="0.1" />

        {/* Hexagon Pattern (Simplified) */}
        <path
            d="M50 5 L75 25 L75 55 L50 75 L25 55 L25 25 Z"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M50 5 L50 25 M75 25 L95 25 M75 55 L90 80 M50 75 L50 95 M25 55 L10 80 M25 25 L5 25"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
        />

        {/* Center Detail */}
        <circle cx="50" cy="50" r="10" fill={color} fillOpacity="0.3" />
    </svg>
);
