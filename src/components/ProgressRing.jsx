import { useEffect, useRef } from 'react';

/**
 * SVG circular progress ring component
 * Props: percentage (0-100), size, strokeWidth, color, bgColor, label, sublabel, animate
 */
export default function ProgressRing({
  percentage = 0,
  size = 120,
  strokeWidth = 10,
  color = '#7C3AED',
  bgColor = 'rgba(124,58,237,0.15)',
  label = null,
  sublabel = null,
  animate = true,
  children = null,
  className = '',
  glowColor = null,
}) {
  const circleRef = useRef(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPct / 100) * circumference;

  useEffect(() => {
    if (!animate || !circleRef.current) return;
    const circle = circleRef.current;
    circle.style.transition = 'none';
    circle.style.strokeDashoffset = String(circumference);
    // Force reflow
    void circle.getBoundingClientRect();
    circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
    circle.style.strokeDashoffset = String(offset);
  }, [percentage, circumference, offset, animate]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        style={{ filter: glowColor ? `drop-shadow(0 0 8px ${glowColor})` : undefined }}
      >
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          ref={circleRef}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : offset}
          strokeLinecap="round"
          style={animate ? undefined : { strokeDashoffset: offset }}
        />
      </svg>

      {/* Center content */}
      <div className="relative flex flex-col items-center justify-center z-10 text-center">
        {children ? (
          children
        ) : (
          <>
            {label !== null && (
              <span
                className="font-bold leading-none"
                style={{
                  fontSize: size * 0.2,
                  color: '#E2E8F0',
                }}
              >
                {label}
              </span>
            )}
            {sublabel !== null && (
              <span
                className="text-slate-400 mt-1 leading-none"
                style={{ fontSize: size * 0.1 }}
              >
                {sublabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
