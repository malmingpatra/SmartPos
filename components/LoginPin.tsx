
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabaseService } from '../supabase';

interface LoginPinProps {
  onLogin: (user: User) => void;
  onCancel: () => void;
}

const LoginPin: React.FC<LoginPinProps> = ({ onLogin, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    if (pin.length < 12) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleCancelAction = () => {
    setPin('');
    setError('');
    onCancel();
  };

  const handleLoginAttempt = async () => {
    if (pin.length < 4) {
      setError('PIN MINIMAL 4 DIGIT');
      return;
    }

    setLoading(true);
    const foundUser = await supabaseService.verifyPin(pin);
    setLoading(false);

    if (foundUser) {
      onLogin(foundUser);
      setPin('');
      const modal = document.getElementById('login-modal') as HTMLDialogElement;
      if (modal) modal.close();
    } else {
      setError('PIN TIDAK VALID');
      setPin('');
    }
  };

  const startPress = (key: string) => setActiveKey(key);
  const endPress = () => setActiveKey(null);

  // Tombol statis tanpa trace klik
  const baseNumClass = "h-12 md:h-16 landscape:h-10 text-xl font-black rounded-[1.2rem] border border-gray-100 select-none touch-manipulation outline-none appearance-none flex items-center justify-center";

  const renderButton = (label: string | React.ReactNode, id: string, onClick: () => void, extraClass: string = "") => {
    const isActive = activeKey === id;
    return (
      <button
        type="button"
        onMouseDown={() => startPress(id)}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={() => startPress(id)}
        onTouchEnd={endPress}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className={`${baseNumClass} ${extraClass} ${
          isActive 
            ? 'bg-blue-600 text-white border-blue-600' 
            : (extraClass.includes('text-red') ? 'bg-red-50 border-red-100' : extraClass.includes('text-gray-400') ? 'bg-transparent border-transparent' : 'bg-white text-gray-700')
        }`}
        style={{ WebkitTouchCallout: 'none' }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="bg-white flex flex-col landscape:flex-row min-h-fit overflow-hidden">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 landscape:from-white landscape:to-white landscape:w-[200px] p-6 landscape:p-6 flex flex-col items-center justify-center text-center shrink-0 border-b landscape:border-b-0 landscape:border-r border-white/10 landscape:border-gray-100">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none landscape:hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white"></div>
        </div>

        <div className="relative z-10 mb-5 landscape:mb-4">
          <h2 className="text-xl landscape:text-lg font-black text-white landscape:text-blue-600 tracking-tight uppercase leading-none">MASUKAN PIN</h2>
        </div>

        <div className="relative z-10 bg-black/10 landscape:bg-blue-50 p-3 landscape:p-2.5 rounded-xl border border-white/10 landscape:border-blue-100 mb-1">
          <div className="grid grid-cols-6 gap-2 landscape:gap-1.5 w-fit mx-auto h-6 items-center">
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-2.5 h-2.5 landscape:w-2 landscape:h-2 rounded-full border-2 transition-all duration-300 ${
                  i < pin.length 
                    ? 'bg-white border-white scale-110 landscape:bg-blue-600 landscape:border-blue-600' 
                    : 'bg-transparent border-white/20 landscape:border-blue-100'
                }`}
              ></div>
            ))}
          </div>
        </div>

        <div className="relative z-10 h-5 flex items-center justify-center">
          {error ? (
            <p className="text-white landscape:text-red-500 text-[9px] font-black uppercase tracking-widest animate-shake bg-red-500/60 landscape:bg-transparent px-3 py-0.5 rounded-full">{error}</p>
          ) : (
            <p className="text-[8px] text-blue-100 landscape:text-gray-400 font-bold uppercase tracking-[0.1em]">
              {pin.length > 0 ? `${pin.length} / 12 DIGIT` : 'PIN DIPERLUKAN'}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 landscape:p-6 bg-white min-w-[300px]">
        <div className="grid grid-cols-3 gap-3 landscape:gap-2 mb-6 landscape:mb-4 max-w-[280px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => 
            renderButton(num.toString(), num.toString(), () => handleKeyPress(num.toString()))
          )}
          
          {renderButton(
            <span className="text-[9px] font-black tracking-widest">CANCEL</span>, 
            "cancel", 
            handleCancelAction, 
            "text-red-500 border-red-50"
          )}
          
          {renderButton("0", "0", () => handleKeyPress("0"))}
          
          {renderButton(
            <i className="fas fa-backspace text-base"></i>, 
            "backspace", 
            handleBackspace, 
            "text-gray-300 border-transparent"
          )}
        </div>

        <div className="max-w-[280px] mx-auto">
          <button 
            type="button"
            onClick={handleLoginAttempt}
            disabled={pin.length < 4 || loading}
            className={`w-full py-4 landscape:py-3 rounded-2xl landscape:rounded-xl font-black text-sm tracking-[0.2em] flex items-center justify-center gap-3 select-none outline-none ${
              pin.length >= 4 && !loading
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'AUTHORIZE'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPin;
