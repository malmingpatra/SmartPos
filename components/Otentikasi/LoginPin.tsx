
import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { supabaseService } from '../../supabase';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPinProps {
  onLogin: (user: User) => void;
  onCancel: () => void;
}

const LoginPin: React.FC<LoginPinProps> = ({ onLogin, onCancel }) => {
  const [username, setUsername] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem('pos_remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setIsLocked(true);
    }
  }, []);

  const handleToggleLock = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    if (!newLocked) {
      localStorage.removeItem('pos_remembered_username');
    } else if (username) {
      localStorage.setItem('pos_remembered_username', username);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 12) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleCancelAction = () => {
    setPin('');
    setError('');
    onCancel();
  };

  const handleLoginAttempt = async () => {
    if (!username) {
      setError('USERNAME DIPERLUKAN');
      return;
    }
    if (pin.length < 3) {
      setError('PIN MINIMAL 3 DIGIT');
      return;
    }

    setLoading(true);
    const foundUser = await supabaseService.verifyUsernamePin(username, pin);
    setLoading(false);

    if (foundUser) {
      if (isLocked) {
        localStorage.setItem('pos_remembered_username', username);
      }
      onLogin(foundUser);
      // Auto-close modal
      const modal = document.getElementById('login-modal') as HTMLDialogElement;
      if (modal) modal.close();
    } else {
      setError('LOGIN GAGAL');
      setPin('');
    }
  };

  const startPress = (key: string) => setActiveKey(key);
  const endPress = () => setActiveKey(null);

  const baseNumClass = "h-12 md:h-14 text-lg font-black rounded-2xl border border-gray-100 select-none touch-manipulation outline-none appearance-none flex items-center justify-center transition-all duration-100";

  const renderButton = (label: string | React.ReactNode, id: string, onClick: () => void, extraClass: string = "") => {
    const isActive = activeKey === id;
    
    return (
      <button
        key={id}
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
            ? 'scale-90 bg-orange-600 text-white border-orange-600' 
            : (extraClass.includes('text-red') ? 'bg-red-50 border-red-100' : extraClass.includes('text-gray-400') ? 'bg-transparent border-transparent' : 'bg-white text-gray-700 hover:border-orange-100')
        }`}
        style={{ WebkitTouchCallout: 'none' }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="bg-white flex flex-col min-w-[320px] max-w-sm rounded-[2.5rem] overflow-hidden">
      {/* Header / Input Area */}
      <div className="p-8 pb-4 flex flex-col items-center">
        {/* Username Input & Lock */}
        <div className="flex gap-2 w-full mb-6 relative">
          <div className="relative flex-1">
            <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-[10px]"></i>
            <input 
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              disabled={isLocked}
              className={`w-full bg-gray-50 border border-gray-100 py-3.5 pl-10 pr-4 rounded-xl text-[10px] font-black lowercase tracking-widest focus:ring-4 focus:ring-orange-50 outline-none transition-all ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
          <button 
            type="button"
            onClick={handleToggleLock}
            className={`w-12 rounded-xl flex items-center justify-center transition-all ${isLocked ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-gray-50 text-gray-300 border border-gray-100'}`}
            title="Kunci Username"
          >
            <i className={`fas ${isLocked ? 'fa-lock' : 'fa-lock-open'} text-[10px]`}></i>
          </button>
        </div>

        {/* PIN Indicator (1 Row) */}
        <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 mb-2 w-full">
          <div className="flex justify-center gap-2 items-center">
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full border-2 transition-all duration-300 ${
                  i < pin.length 
                    ? 'bg-orange-600 border-orange-600 scale-125' 
                    : 'bg-transparent border-orange-100'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Info/Error Message */}
        <div className="h-4 flex items-center justify-center">
          {error ? (
            <p className="text-red-500 text-[8px] font-black uppercase tracking-widest animate-shake">
              {error}
            </p>
          ) : (
            <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest">
              {pin.length > 0 ? `${pin.length} DIGIT` : 'PIN DIPERLUKAN'}
            </p>
          )}
        </div>
      </div>

      {/* Numpad Area */}
      <div className="p-8 pt-2">
        <div className="grid grid-cols-3 gap-3 mb-6">
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
            <i className="fas fa-backspace text-sm"></i>, 
            "backspace", 
            handleBackspace, 
            "text-gray-300 border-transparent"
          )}
        </div>

        <button 
          type="button"
          onClick={handleLoginAttempt}
          disabled={pin.length < 3 || loading || !username}
          className={`w-full py-4 rounded-[2rem] font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 select-none outline-none transition-all ${
            pin.length >= 3 && !loading && username
              ? 'bg-orange-600 text-white shadow-xl shadow-orange-100 active:scale-95' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {loading ? <i className="fas fa-spinner fa-spin"></i> : 'AUTHORIZE'}
        </button>
      </div>
    </div>
  );
};

export default LoginPin;
