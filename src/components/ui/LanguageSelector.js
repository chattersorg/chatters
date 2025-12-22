import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'ro', name: 'Romana' },
  { code: 'es', name: 'Espanol' }
];

const LanguageSelector = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className={`px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer ${className}`}
      aria-label="Select language"
    >
      {LANGUAGE_OPTIONS.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;
