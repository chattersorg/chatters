import React, { useState } from 'react';
import { useKiosk } from '../context/KioskContext';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const PairingScreen = () => {
  const { pairDevice, isLoading, error } = useKiosk();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCodeChange = (index, value) => {
    // Only allow uppercase alphanumeric
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 1);

    const newCode = [...code];
    newCode[index] = cleanValue;
    setCode(newCode);
    setLocalError(null);

    // Auto-focus next input
    if (cleanValue && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when all filled
    if (index === 5 && cleanValue) {
      const fullCode = [...newCode.slice(0, 5), cleanValue].join('');
      if (fullCode.length === 6) {
        handleSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace - go to previous input
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const chars = pastedText.slice(0, 6).split('');

    const newCode = [...code];
    chars.forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);

    // Focus last filled input or submit
    if (chars.length === 6) {
      handleSubmit(chars.join(''));
    } else if (chars.length > 0) {
      const lastInput = document.getElementById(`code-input-${Math.min(chars.length, 5)}`);
      if (lastInput) lastInput.focus();
    }
  };

  const handleSubmit = async (fullCode) => {
    const codeToSubmit = fullCode || code.join('');

    if (codeToSubmit.length !== 6) {
      setLocalError('Please enter a 6-character code');
      return;
    }

    const result = await pairDevice(codeToSubmit);

    if (result.success) {
      setSuccess(true);
    } else {
      setLocalError(result.error || 'Failed to pair device');
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-input-0')?.focus();
    }
  };

  const displayError = localError || error;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Paired!</h1>
          <p className="text-lg text-gray-600">Starting kiosk mode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-6">
            <img
              src="/img/logo/chatters-logo-black-2025.svg"
              alt="Chatters"
              className="h-10 mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Up Kiosk
          </h1>
          <p className="text-lg text-gray-600">
            Enter the 6-character pairing code from your Chatters dashboard
          </p>
        </div>

        {/* Code Input */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex justify-center gap-3 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-input-${index}`}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isLoading}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${displayError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              />
            ))}
          </div>

          {displayError && (
            <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{displayError}</span>
            </div>
          )}

          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || code.join('').length !== 6}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg
              hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Pairing...
              </>
            ) : (
              'Pair Device'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">
            Don't have a code? Generate one from your venue settings
          </p>
          <p>
            Go to <span className="font-medium">Settings → Venue → Kiosk Devices</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PairingScreen;
