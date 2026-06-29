import React from 'react';
import { Memo } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memo: Memo | null;
}

const PinnedMemoModal: React.FC<Props> = ({ isOpen, onClose, memo }) => {
  if (!isOpen) return null;

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const renderContentWithLinks = (content: string) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline break-all">
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-650 to-indigo-550 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black flex items-center space-x-2">
              <span>📌</span>
              <span>상단 고정된 메모</span>
            </h3>
            <p className="text-xs opacity-75 font-medium">가장 최근에 고정된 주요 메모입니다.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {memo ? (
            <div className="space-y-4">
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 max-h-[40vh] overflow-y-auto custom-scrollbar">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-semibold text-sm">
                  {renderContentWithLinks(memo.content)}
                </div>
              </div>
              <div className="text-right text-[10px] text-gray-400 font-bold">
                {formatDateTime(memo.updatedAt)} 수정됨
              </div>
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-400 font-medium leading-relaxed">
              <p>📌 상단고정된 메모가 없습니다.</p>
              <p className="mt-1 text-[10px] text-gray-300">메모 목록에서 중요 메모를 고정해 보세요.</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinnedMemoModal;
