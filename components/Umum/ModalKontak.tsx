
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ContactLink } from '../../types';

interface ContactLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: ContactLink[];
}

const ContactLinksModal: React.FC<ContactLinksModalProps> = ({ isOpen, onClose, links }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-[280px] max-h-[70vh] flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto border border-white/20"
            >
              {/* Header */}
              <div className="bg-gray-50 px-6 py-5 text-center border-b border-gray-100 shrink-0">
                <div className="w-12 h-12 bg-orange-600 rounded-xl mx-auto flex items-center justify-center text-white shadow-lg shadow-orange-100 mb-3 animate-bounce">
                  <i className="fas fa-headset text-xl"></i>
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Hubungi Kami</h3>
              </div>
              
              {/* Grid of Links (Scrollable if too many) */}
              <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
                {links.map((link) => (
                  <motion.a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center gap-2 p-3 rounded-[2rem] border border-gray-50 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all group"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base shadow-md transition-transform group-hover:rotate-6"
                      style={{ backgroundColor: link.color }}
                    >
                      <i className={link.icon}></i>
                    </div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center group-hover:text-gray-900 transition-colors truncate w-full">
                      {link.name}
                    </span>
                  </motion.a>
                ))}
                
                {links.length === 0 && (
                  <div className="col-span-2 py-8 text-center">
                    <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest">Belum ada link</p>
                  </div>
                )}
              </div>
              
              {/* Footer / Close */}
              <div className="px-5 pb-5 pt-2 shrink-0">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-orange-600 text-white font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-orange-100 active:scale-95 transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContactLinksModal;
