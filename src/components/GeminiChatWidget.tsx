import React, { useState } from 'react';
import { Bot, Sparkles, X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { GeminiChatbot } from './GeminiChatbot';

interface GeminiChatWidgetProps {
  onOpenFullPage?: () => void;
}

export const GeminiChatWidget: React.FC<GeminiChatWidgetProps> = ({ onOpenFullPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all border border-blue-400/30 group"
          title="Open AWASI AI ASSISTANT"
        >
          <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
            <Bot className="w-5 h-5 text-slate-950 group-hover:rotate-6 transition-transform" />
          </div>
          <div className="text-left">
            <div className="text-xs font-black tracking-wide flex items-center gap-1">
              <span>AWASI AI ASSISTANT</span>
              <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
            </div>
            <div className="text-[10px] text-blue-200">Ask Medical &amp; Site Help</div>
          </div>
        </button>
      )}

      {/* Floating Popup Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 shadow-2xl flex flex-col ${
            isExpanded
              ? 'inset-4 md:inset-10 rounded-2xl overflow-hidden'
              : 'bottom-6 right-6 w-[94vw] sm:w-[440px] h-[600px] max-h-[85vh] rounded-2xl overflow-hidden'
          }`}
        >
          <div className="relative h-full flex flex-col">
            {/* Top Toolbar Overlay for Float Modal */}
            <div className="absolute top-3 right-20 z-20 flex items-center gap-1.5">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 transition-colors"
                title={isExpanded ? 'Restore size' : 'Expand full screen'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            <GeminiChatbot
              isEmbedded={true}
              onMinimize={() => {
                setIsOpen(false);
                setIsExpanded(false);
              }}
              onClose={() => {
                setIsOpen(false);
                setIsExpanded(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
