
import React, { useState, useEffect } from 'react';
import { getAIRecommendation } from '../services/geminiService';
import { DailySummary, MealRecord, ActivityLog, HealthDiary } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  summary: DailySummary;
  meals: MealRecord[];
  targetKcal: number;
  targetProtein: number;
  activity?: ActivityLog;
  diary?: HealthDiary;
}

const AIAdviceModal: React.FC<Props> = ({ isOpen, onClose, summary, meals, targetKcal, targetProtein, activity, diary }) => {
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      
      getAIRecommendation(summary, meals, targetKcal, targetProtein, activity, diary)
        .then(res => setAdvice(res || "조언을 가져오는데 실패했어요. 다시 시도해볼까요?"))
        .catch(error => {
          console.error("Failed to load AI advice", error);
          setAdvice("데이터를 불러오는데 실패했어요.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, summary, meals, targetKcal, targetProtein, activity, diary]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-teal-500 text-white flex justify-between items-center">
          <div>
            <h3 className="font-black text-xl">AI 영양 추천 ✨</h3>
            <p className="text-xs opacity-80 font-medium">쿠쿠님만을 위한 오늘의 한 줄 조언</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-8 max-h-[85vh] flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center py-10 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="absolute inset-0 flex items-center justify-center text-xl animate-bounce">🤖</span>
              </div>
              <p className="text-gray-400 font-medium animate-pulse text-sm">식단을 분석하고 있어요...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 flex items-center justify-center min-h-[150px]">
                <div className="bg-indigo-50 p-6 rounded-2xl border-l-4 border-indigo-500 relative w-full">
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                    "{advice}"
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 w-full flex justify-center">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
                >
                  확인했어요!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAdviceModal;
