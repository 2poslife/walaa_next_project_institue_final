import React from 'react';

export const TimeIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    {/* Simple clock - pink/purple */}
    <circle cx="12" cy="12" r="9" fill="#ec4899" />
    <circle cx="12" cy="12" r="7" fill="white" />
    {/* Clock hands */}
    <line x1="12" y1="12" x2="12" y2="7" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="12" x2="15" y2="12" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" />
    {/* Center dot */}
    <circle cx="12" cy="12" r="1.5" fill="#9333ea" />
  </svg>
);

export const QuietIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    {/* Face with zipper - 🤐 emoji style - yellow face */}
    <circle cx="12" cy="12" r="10" fill="#fbbf24" />
    {/* Eyes - simple black dots */}
    <circle cx="9" cy="10" r="1.8" fill="#1f2937" />
    <circle cx="15" cy="10" r="1.8" fill="#1f2937" />
    {/* Zipper across mouth - more prominent */}
    <rect x="7" y="13.5" width="10" height="3" rx="1.5" fill="#ffffff" />
    {/* Zipper puller at top */}
    <rect x="10.5" y="12.5" width="3" height="1.5" rx="0.5" fill="#6b7280" />
    {/* Zipper teeth - vertical lines */}
    <line x1="8.5" y1="13.5" x2="8.5" y2="16.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="10" y1="13.5" x2="10" y2="16.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="11.5" y1="13.5" x2="11.5" y2="16.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13" y1="13.5" x2="13" y2="16.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="14.5" y1="13.5" x2="14.5" y2="16.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="13.5" x2="16" y2="16.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const PhoneOffIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    {/* Phone - grey */}
    <rect x="7" y="3" width="10" height="16" rx="2" fill="#9ca3af" />
    <rect x="8" y="5" width="8" height="10" rx="1" fill="white" />
    {/* Screen lines */}
    <line x1="10" y1="8" x2="14" y2="8" stroke="#9ca3af" strokeWidth="1" />
    <line x1="10" y1="11" x2="14" y2="11" stroke="#9ca3af" strokeWidth="1" />
    {/* Home button */}
    <circle cx="12" cy="17" r="1.5" fill="#6b7280" />
    {/* Prohibition - red circle with diagonal line */}
    <circle cx="12" cy="12" r="11" fill="none" stroke="#ef4444" strokeWidth="2.5" />
    <line x1="5" y1="5" x2="19" y2="19" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const AssignmentIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    {/* Document - grey */}
    <rect x="6" y="4" width="12" height="16" rx="1" fill="#9ca3af" />
    {/* Document lines */}
    <line x1="8" y1="8" x2="16" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="11" x2="14" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="14" x2="16" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    {/* Orange pencil */}
    <path d="M16 4 L20 8 L17 11 L13 7 Z" fill="#f97316" />
    <line x1="16" y1="4" x2="20" y2="8" stroke="white" strokeWidth="1" />
  </svg>
);

export const HandshakeIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    {/* Handshake - 🤝 emoji style */}
    {/* Left hand - yellow/orange skin tone */}
    <path d="M 4 11 Q 3 9, 4 7 Q 5 6, 6 7 Q 7 8, 7 10 L 7 15 Q 7 17, 6 18 Q 5 19, 4 18 Q 3 17, 3 15 Z" fill="#fbbf24" />
    {/* Left thumb */}
    <ellipse cx="5.5" cy="8" rx="1.8" ry="2.5" fill="#f59e0b" />
    {/* Left fingers */}
    <rect x="6.5" y="6" width="1.5" height="4" rx="0.8" fill="#f59e0b" />
    <rect x="7.5" y="5" width="1.5" height="5" rx="0.8" fill="#f59e0b" />
    
    {/* Right hand - orange/yellow skin tone */}
    <path d="M 20 11 Q 21 9, 20 7 Q 19 6, 18 7 Q 17 8, 17 10 L 17 15 Q 17 17, 18 18 Q 19 19, 20 18 Q 21 17, 21 15 Z" fill="#f97316" />
    {/* Right thumb */}
    <ellipse cx="18.5" cy="8" rx="1.8" ry="2.5" fill="#ea580c" />
    {/* Right fingers */}
    <rect x="16" y="6" width="1.5" height="4" rx="0.8" fill="#ea580c" />
    <rect x="15" y="5" width="1.5" height="5" rx="0.8" fill="#ea580c" />
    
    {/* Hands connected/shaking in the middle */}
    <path d="M 8 12 Q 10 11, 12 12 Q 14 11, 16 12" stroke="#f97316" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Connection point */}
    <circle cx="12" cy="12" r="2" fill="#f97316" />
  </svg>
);

export const AbsenceIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    {/* Prohibition circle - red */}
    <circle cx="12" cy="12" r="10" fill="none" stroke="#ef4444" strokeWidth="2.5" />
    {/* Diagonal line */}
    <line x1="5" y1="5" x2="19" y2="19" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    {/* Simple person silhouette */}
    <circle cx="12" cy="9" r="2.5" fill="#ef4444" opacity="0.4" />
    <ellipse cx="12" cy="16" rx="3" ry="4" fill="#ef4444" opacity="0.4" />
  </svg>
);
