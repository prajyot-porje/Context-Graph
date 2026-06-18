'use client'

import { cn } from "@/lib/utils";
import React from "react";

export interface CpuArchitectureSvgProps {
  className?: string;
  width?: string;
  height?: string;
  text?: string;
  showCpuConnections?: boolean;
  lineMarkerSize?: number;
  animateText?: boolean;
  animateLines?: boolean;
  animateMarkers?: boolean;
}

const CpuArchitecture = ({
  className,
  width = "100%",
  height = "100%",
  showCpuConnections = true,
  animateText = true,
}: CpuArchitectureSvgProps) => {
  // Smooth JS hover scale handler to prevent SVG origin shifting glitch
  const handleMouseEnter = (e: React.MouseEvent<SVGGElement>) => {
    e.currentTarget.style.transform = 'scale(1.15)';
  };

  const handleMouseLeave = (e: React.MouseEvent<SVGGElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  const logoGroupStyle: React.CSSProperties = {
    transformBox: 'fill-box',
    transformOrigin: 'center',
    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    cursor: 'pointer',
  };

  return (
    <svg
      className={cn("text-muted overflow-visible", className)}
      width={width}
      height={height}
      viewBox="0 0 200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Core Premium Monochromatic Beam Gradient */}
        <radialGradient id="cpu-white-grad" fx="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="rgba(255, 255, 255, 0.6)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* CPU Connection Pin Gradient */}
        <linearGradient id="cpu-connection-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#333333" />
          <stop offset="60%" stopColor="#151515" />
          <stop offset="100%" stopColor="#080808" />
        </linearGradient>

        {/* CPU Text Gradient (Subtle White-to-Grey) */}
        <linearGradient id="cpu-text-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#888888">
            <animate
              attributeName="offset"
              values="-2; -1; 0"
              dur="6s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#FFFFFF">
            <animate
              attributeName="offset"
              values="-1; 0; 1"
              dur="6s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#888888">
            <animate
              attributeName="offset"
              values="0; 1; 2"
              dur="6s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* Chip Shadow Filter (Non-clipping, wide boundary bounds) */}
        <filter id="cpu-light-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
        </filter>

        {/* -------------------- SVG Line Masks (Cuts off beams entering CPU) -------------------- */}
        <mask id="cpu-mask-1"><path d="M 10 20 h 79.5 q 5 0 5 5 v 24" strokeWidth="0.5" stroke="white" fill="none" /></mask>
        <mask id="cpu-mask-2"><path d="M 180 10 h -69.7 q -5 0 -5 5 v 24" strokeWidth="0.5" stroke="white" fill="none" /></mask>
        <mask id="cpu-mask-3"><path d="M 130 20 v 21.8 q 0 5 -5 5 h -10" strokeWidth="0.5" stroke="white" fill="none" /></mask>
        <mask id="cpu-mask-4"><path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50" strokeWidth="0.5" stroke="white" fill="none" /></mask>
        <mask id="cpu-mask-5"><path d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20" strokeWidth="0.5" stroke="white" fill="none" /></mask>
        <mask id="cpu-mask-6"><path d="M 94.8 95 v -36" strokeWidth="0.5" stroke="white" fill="none" /></mask>
        <mask id="cpu-mask-7"><path d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14" strokeWidth="0.5" stroke="white" fill="none" /></mask>
        <mask id="cpu-mask-8"><path d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20" strokeWidth="0.5" stroke="white" fill="none" /></mask>

        {/* -------------------- Premium Unified Logo Definitions -------------------- */}
        
        {/* ChatGPT */}
        <g id="logo-chatgpt">
          <circle cx="0" cy="0" r="7.5" fill="#141414" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          <path
            d="M -2.2 -1.7 C -2.5 -1 -2.0 -0.2 -1.3 0 C -2.0 0.2 -2.5 1 -2.2 1.7 C -1.9 2.4 -0.9 2.4 -0.4 1.9 C -0.4 2.6 0.4 3.0 1.1 2.7 C 1.8 2.4 1.9 1.5 1.3 1 C 2.0 1 2.5 0.2 2.2 -0.5 C 1.9 -1.2 0.9 -1.2 0.4 -0.7 C 0.4 -1.4 -0.4 -1.8 -1.1 -1.5 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.75"
            strokeLinecap="round"
          />
          <circle cx="0" cy="0" r="1" fill="#ffffff" />
        </g>

        {/* Claude */}
        <g id="logo-claude">
          <circle cx="0" cy="0" r="7.5" fill="#141414" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          <path
            d="M -2.8 3 L -0.5 -3 L 0.5 -3 L 2.8 3 M -1.8 0.8 h 3.6"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Gemini */}
        <g id="logo-gemini">
          <circle cx="0" cy="0" r="7.5" fill="#141414" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          <path
            d="M 0 -4.5 Q 0 0 4.5 0 Q 0 0 0 4.5 Q 0 0 -4.5 0 Q 0 0 0 -4.5 Z"
            fill="#ffffff"
          />
        </g>

        {/* Claude Code */}
        <g id="logo-claudecode">
          <circle cx="0" cy="0" r="7.5" fill="#141414" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          <path d="M -3.5 -2 L -1 0.5 L -3.5 3" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="1.5" y1="3" x2="4.5" y2="3" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* Codex */}
        <g id="logo-codex">
          <circle cx="0" cy="0" r="7.5" fill="#141414" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          <path
            d="M -3 -1.2 C -3 -2.5 3 -2.5 3 -1.2 C 3 0.4 -3 -0.4 -3 1.2 C -3 2.5 3 2.5 3 1.2"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </g>

        {/* Cursor */}
        <g id="logo-cursor">
          <circle cx="0" cy="0" r="7.5" fill="#141414" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          <path
            d="M -2.2 -3.2 L 3 0.5 L 0.2 1.2 L -0.8 3.8 Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="0.4"
            strokeLinejoin="round"
          />
        </g>

        {/* Windsurf */}
        <g id="logo-windsurf">
          <circle cx="0" cy="0" r="7.5" fill="#141414" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          <path
            d="M -3.5 1.8 Q -1.8 -2.5 0 0.2 T 3.5 -1.8"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </g>

        {/* Antigravity (Standout highlight in electric lime) */}
        <g id="logo-antigravity">
          <circle cx="0" cy="0" r="7.5" fill="#111111" stroke="var(--accent)" strokeWidth="1" />
          <path
            d="M -2.5 2.5 L 0 -2.5 L 2.5 2.5"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <ellipse
            cx="0"
            cy="1.2"
            rx="4"
            ry="1.2"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="0.5"
            strokeDasharray="1.2 0.8"
          />
        </g>
      </defs>

      {/* -------------------- SVG Connection Paths (Drawn exactly as original) -------------------- */}
      <g stroke="rgba(255, 255, 255, 0.07)" fill="none" strokeWidth="0.3">
        <path d="M 10 20 h 79.5 q 5 0 5 5 v 30" />
        <path d="M 180 10 h -69.7 q -5 0 -5 5 v 30" />
        <path d="M 130 20 v 21.8 q 0 5 -5 5 h -10" />
        <path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50" />
        <path d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20" />
        <path d="M 94.8 95 v -36" />
        <path d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14" />
        <path d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20" />
      </g>

      {/* -------------------- Light Beams (Traveling Circles in White/Silver) -------------------- */}
      <g>
        <g mask="url(#cpu-mask-1)"><circle className="cpu-architecture cpu-line-1" cx="0" cy="0" r="8" fill="url(#cpu-white-grad)" /></g>
        <g mask="url(#cpu-mask-2)"><circle className="cpu-architecture cpu-line-2" cx="0" cy="0" r="8" fill="url(#cpu-white-grad)" /></g>
        <g mask="url(#cpu-mask-3)"><circle className="cpu-architecture cpu-line-3" cx="0" cy="0" r="8" fill="url(#cpu-white-grad)" /></g>
        <g mask="url(#cpu-mask-4)"><circle className="cpu-architecture cpu-line-4" cx="0" cy="0" r="8" fill="url(#cpu-white-grad)" /></g>
        <g mask="url(#cpu-mask-5)"><circle className="cpu-architecture cpu-line-5" cx="0" cy="0" r="8" fill="url(#cpu-white-grad)" /></g>
        <g mask="url(#cpu-mask-6)"><circle className="cpu-architecture cpu-line-6" cx="0" cy="0" r="8" fill="url(#cpu-white-grad)" /></g>
        <g mask="url(#cpu-mask-7)"><circle className="cpu-architecture cpu-line-7" cx="0" cy="0" r="8" fill="url(#cpu-white-grad)" /></g>
        <g mask="url(#cpu-mask-8)"><circle className="cpu-architecture cpu-line-8" cx="0" cy="0" r="8" fill="url(#cpu-white-grad)" /></g>
      </g>

      {/* -------------------- Central Silicon Chip -------------------- */}
      <g filter="url(#cpu-light-shadow)">
        {/* Chip Connection Pins */}
        {showCpuConnections && (
          <g fill="url(#cpu-connection-gradient)">
            {/* Top/Bottom Pins */}
            <rect x="93" y="37" width="2.5" height="5" rx="0.7" />
            <rect x="104" y="37" width="2.5" height="5" rx="0.7" />
            <rect x="104" y="16" width="2.5" height="5" rx="0.7" transform="rotate(180 105.25 39.5)" />
            <rect x="114.5" y="16" width="2.5" height="5" rx="0.7" transform="rotate(180 105.25 39.5)" />
            
            {/* Left/Right Pins */}
            <rect x="116.3" y="44" width="2.5" height="5" rx="0.7" transform="rotate(90 116.25 45.5)" />
            <rect x="122.8" y="44" width="2.5" height="5" rx="0.7" transform="rotate(90 116.25 45.5)" />
            <rect x="80" y="-13.6" width="2.5" height="5" rx="0.7" transform="rotate(270 115.25 19.5)" />
            <rect x="87" y="-13.6" width="2.5" height="5" rx="0.7" transform="rotate(270 115.25 19.5)" />
          </g>
        )}

        {/* Central Chip Rectangle */}
        <rect
          x="85"
          y="40"
          width="30"
          height="20"
          rx="2"
          fill="#111111"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.8"
        />

        {/* Central Text */}
        <text
          x="100"
          y="48.5"
          fontSize="4.2"
          textAnchor="middle"
          fill={animateText ? "url(#cpu-text-gradient)" : "#ffffff"}
          fontWeight="700"
          letterSpacing="0.08em"
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          CONTEXT
        </text>
        <text
          x="100"
          y="54"
          fontSize="4.2"
          textAnchor="middle"
          fill={animateText ? "url(#cpu-text-gradient)" : "#ffffff"}
          fontWeight="700"
          letterSpacing="0.08em"
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          GRAPH
        </text>
      </g>

      {/* -------------------- Surrounding AI Logo Nodes (Centered exactly at start points) -------------------- */}
      
      {/* 1. ChatGPT @ (10, 20) */}
      <g style={logoGroupStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <use href="#logo-chatgpt" x="10" y="20" />
      </g>
      
      {/* 2. Claude @ (180, 10) */}
      <g style={logoGroupStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <use href="#logo-claude" x="180" y="10" />
      </g>

      {/* 3. Gemini @ (130, 20) */}
      <g style={logoGroupStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <use href="#logo-gemini" x="130" y="20" />
      </g>

      {/* 4. Claude Code @ (170, 80) */}
      <g style={logoGroupStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <use href="#logo-claudecode" x="170" y="80" />
      </g>

      {/* 5. Codex @ (135, 65) */}
      <g style={logoGroupStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <use href="#logo-codex" x="135" y="65" />
      </g>

      {/* 6. Cursor @ (94.8, 95) */}
      <g style={logoGroupStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <use href="#logo-cursor" x="94.8" y="95" />
      </g>

      {/* 7. Windsurf @ (88, 88) */}
      <g style={logoGroupStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <use href="#logo-windsurf" x="88" y="88" />
      </g>

      {/* 8. Antigravity @ (30, 30) */}
      <g style={logoGroupStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <use href="#logo-antigravity" x="30" y="30" />
      </g>
    </svg>
  );
};

export { CpuArchitecture };