
import React, { useState, useEffect, useRef } from 'react';
import { 
  getAIRecommendation, 
  generateDefaultPrompt, 
  generateInputDataSection, 
  updatePromptWithLatestData 
} from '../services/geminiService';
import { DailySummary, MealRecord, ActivityLog, HealthDiary, AIRecommendation } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  summary: DailySummary;
  meals: MealRecord[];
  targetKcal: number;
  targetProtein: number;
  activity?: ActivityLog;
  diary?: HealthDiary;
  savedRecommendation?: AIRecommendation;
  onSaveRecommendation: (advice: string) => void;
}

const AIAdviceModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  summary, 
  meals, 
  targetKcal, 
  targetProtein, 
  activity, 
  diary, 
  savedRecommendation, 
  onSaveRecommendation 
}) => {
  const [mode, setMode] = useState<'review' | 'loading' | 'result'>('review');
  const [promptText, setPromptText] = useState('');
  const [advice, setAdvice] = useState('');
  const prevIsOpenRef = useRef(false);

  const fetchAdvice = (customPrompt: string) => {
    setMode('loading');
    getAIRecommendation(summary, meals, targetKcal, targetProtein, activity, diary, customPrompt)
      .then(res => {
        if (res) {
          setAdvice(res);
          onSaveRecommendation(res);
          setMode('result');
        } else {
          setAdvice("조언을 가져오는데 실패했어요. 다시 시도해볼까요?");
          setMode('result');
        }
      })
      .catch(error => {
        console.error("Failed to load AI advice", error);
        setAdvice("데이터를 불러오는데 실패했어요.");
        setMode('result');
      });
  };

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Load saved prompt from localStorage or generate default with current day stats
      const savedPrompt = localStorage.getItem('last_used_prompt');
      const latestDataSection = generateInputDataSection(summary, meals, targetKcal, targetProtein, activity, diary);
      
      if (savedPrompt) {
        const updated = updatePromptWithLatestData(savedPrompt, latestDataSection);
        setPromptText(updated);
      } else {
        const defaultPrompt = generateDefaultPrompt(summary, meals, targetKcal, targetProtein, activity, diary);
        setPromptText(defaultPrompt);
      }

      // If a recommendation already exists for this date, show the result. Otherwise show prompt review.
      if (savedRecommendation) {
        setAdvice(savedRecommendation.advice);
        setMode('result');
      } else {
        setAdvice('');
        setMode('review');
      }
    }

    if (!isOpen && prevIsOpenRef.current) {
      setAdvice('');
      setPromptText('');
      setMode('review');
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, savedRecommendation, summary, meals, targetKcal, targetProtein, activity, diary]);

  const handleGetRecommendation = () => {
    localStorage.setItem('last_used_prompt', promptText);
    fetchAdvice(promptText);
  };

  const handleResetToDefault = () => {
    const defaultPrompt = generateDefaultPrompt(summary, meals, targetKcal, targetProtein, activity, diary);
    setPromptText(defaultPrompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className={`bg-white w-full ${mode === 'review' ? 'max-w-2xl' : 'max-w-md'} rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 animate-in fade-in zoom-in`}>
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-teal-500 text-white flex justify-between items-center">
          <div>
            <h3 className="font-black text-xl">
              {mode === 'review' ? 'AI 추천 프롬프트 설정 📝' : 'AI 영양 추천 ✨'}
            </h3>
            <p className="text-xs opacity-80 font-medium">
              {mode === 'review' ? 'AI에게 보낼 프롬프트를 확인하고 수정하세요' : '쿠쿠님만을 위한 오늘의 한 줄 조언'}
            </p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-8 max-h-[85vh] flex flex-col">
          {mode === 'loading' ? (
            <div className="flex flex-col items-center py-10 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="absolute inset-0 flex items-center justify-center text-xl animate-bounce">🤖</span>
              </div>
              <p className="text-gray-400 font-medium animate-pulse text-sm">식단을 분석하고 있어요...</p>
            </div>
          ) : mode === 'review' ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full h-[40vh] p-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed text-slate-700"
                  placeholder="프롬프트를 작성해주세요..."
                />
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 w-full flex flex-col gap-3">
                <button 
                  onClick={handleResetToDefault}
                  className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 hover:border-slate-350 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center space-x-1"
                >
                  <span>🔄</span>
                  <span>기본 프롬프트로 재설정</span>
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={onClose}
                    className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleGetRecommendation}
                    className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-teal-500 text-white rounded-2xl font-black hover:opacity-95 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100"
                  >
                    추천 받기 🚀
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 min-h-[150px]">
                <div className="bg-indigo-50 p-6 rounded-2xl border-l-4 border-indigo-500 relative w-full mb-4">
                    {advice.split('\n').map((line, i) => {
                      if (line.startsWith('[') && line.includes(']')) {
                        return <div key={i} className="font-black text-indigo-700 mt-4 first:mt-0 mb-2 border-b border-indigo-100 pb-1">{line}</div>;
                      }
                      return <div key={i} className="mb-1 last:mb-0 leading-relaxed font-medium">{line}</div>;
                    })}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 w-full flex gap-3">
                <button 
                  onClick={() => setMode('review')}
                  className="flex-1 py-4 bg-white border-2 border-indigo-500 text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all active:scale-[0.98] shadow-md flex items-center justify-center space-x-1"
                >
                  <span>🔄</span>
                  <span>다시받기</span>
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
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

