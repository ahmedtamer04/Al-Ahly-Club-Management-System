'use client';

/**
 * Tooltip Component - Display helpful hints on hover
 * @param {Object} props
 * @param {string} props.text - Tooltip text to display
 * @param {ReactNode} props.children - Element to attach tooltip to
 * @param {string} props.position - 'top', 'bottom', 'left', 'right' (default: 'top')
 */
export default function Tooltip({ text, children, position = 'top' }) {
  if (!text) {
    return children;
  }
  
  return (
    <span className="tooltip-wrapper">
      {children}
      <span className={`tooltip tooltip-${position}`} role="tooltip">
        {text}
      </span>
    </span>
  );
}
