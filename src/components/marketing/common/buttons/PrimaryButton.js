import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PrimaryButton = ({ 
  text = "Book a Demo", 
  to = "/demo",
  size = "lg", // sm, md, lg
  showArrow = true,
  className = "",
  onClick,
  type = "link" // link, button
}) => {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const baseClasses = `
    group inline-flex items-center bg-[#4E74FF] text-white rounded-lg font-semibold
    hover:bg-[#2F5CFF] transition-all duration-200 font-satoshi shadow-lg hover:shadow-xl
    overflow-hidden relative
    ${sizeClasses[size]} ${className}
  `.trim();

  const arrowSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  const containerWidth = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';

  if (type === 'button') {
    return (
      <button
        onClick={onClick}
        className={baseClasses}
      >
        <span>{text}</span>
        {showArrow && (
          <span className={`relative ml-2 ${containerWidth} overflow-hidden inline-block`}>
            <ArrowRight className={`${arrowSize} absolute top-0 left-0 transition-all duration-300 group-hover:translate-x-6 group-hover:opacity-0`} />
            <ArrowRight className={`${arrowSize} absolute top-0 left-0 -translate-x-6 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100`} />
          </span>
        )}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={baseClasses}
    >
      <span>{text}</span>
      {showArrow && (
        <span className={`relative ml-2 ${containerWidth} overflow-hidden inline-block`}>
          <ArrowRight className={`${arrowSize} absolute top-0 left-0 transition-all duration-300 group-hover:translate-x-6 group-hover:opacity-0`} />
          <ArrowRight className={`${arrowSize} absolute top-0 left-0 -translate-x-6 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100`} />
        </span>
      )}
    </Link>
  );
};

export default PrimaryButton;