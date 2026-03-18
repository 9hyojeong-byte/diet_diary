
import React, { useState, useEffect } from 'react';
import { HealthDiary } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  diary?: HealthDiary | null;
  onSave: (content: string) => void;
  isAdmin: boolean;
}

const DiaryModal: React.FC<Props> = ({ isOpen, onClose, selectedDate, diary, onSave, isAdmin }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (!isAdmin && diary) {
        setContent('건강일기 샘플입니다');
      } else {
        setContent(diary?.content || '');
      }
    }
  }, [isOpen, diary, isAdmin]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!isAdmin) {
      alert("체험 모드에서는 저장이 불가능합니다.");
      return;
    }
    onSave(content);
    onClose();
  };

  const [y, m, d] = selectedDate.split('-');
  const displayDate = `${m}월 ${d}일`;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b flex justify-between items-center bg-white rounded-t-[40px] sm:rounded-t-3xl">
          <div>
            <h2 className="text-xl font-black text-gray-800">{displayDate} 건강 일기</h2>
            {diary?.updated_at && (
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">마지막 수정: {diary.updated_at}</p>
            )}
          </div>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:bg-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <textarea
            autoFocus={isAdmin}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            readOnly={!isAdmin}
            placeholder="오늘의 컨디션, 운동, 혹은 특별한 증상이 있었나요? 자유롭게 기록해 보세요."
            className={`w-full h-48 p-4 bg-emerald-50/30 rounded-2xl border-2 border-emerald-50 outline-none font-medium text-gray-700 resize-none transition-all ${isAdmin ? 'focus:border-emerald-500' : 'opacity-80'}`}
          />
          
          <div className="mt-6 flex space-x-3">
            <button 
              onClick={onClose}
              className={`py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl active:scale-95 transition-all ${isAdmin ? 'flex-1' : 'w-full'}`}
            >
              {isAdmin ? '취소' : '닫기'}
            </button>
            {isAdmin && (
              <button 
                onClick={handleSave}
                disabled={!content.trim() && !diary}
                className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-30 transition-all"
              >
                기록 저장하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryModal;
