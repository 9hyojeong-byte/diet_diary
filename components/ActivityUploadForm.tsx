
import React, { useState, useRef } from 'react';
import { ActivityLog } from '../types';
import { analyzeActivityImage } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  initialDate: string;
  existingActivity?: ActivityLog;
  onSave: (activity: ActivityLog) => void;
  onDelete: (date: string) => void;
  onCancel: () => void;
}

const ActivityUploadForm: React.FC<Props> = ({ isOpen, initialDate, existingActivity, onSave, onDelete, onCancel }) => {
  const [date, setDate] = useState(initialDate);
  const [steps, setSteps] = useState(existingActivity?.steps.toString() || '');
  const [activeCals, setActiveCals] = useState(existingActivity?.active_calories.toString() || '');
  const [totalCals, setTotalCals] = useState(existingActivity?.total_calories.toString() || '');
  const [imageUrl, setImageUrl] = useState<string | null>(existingActivity?.image_url || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImageUrl(base64);
      
      setIsAnalyzing(true);
      try {
        const result = await analyzeActivityImage(base64);
        if (result) {
          setSteps(result.steps.toString());
          setActiveCals(result.active_calories.toString());
          setTotalCals(result.total_calories.toString());
        }
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!date) return;
    
    setIsSaving(true);
    try {
      await onSave({
        date,
        steps: parseInt(steps) || 0,
        active_calories: parseInt(activeCals) || 0,
        total_calories: parseInt(totalCals) || 0,
        image_url: imageUrl || undefined,
        created_at: new Date().toISOString()
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onCancel}>
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in slide-in-from-bottom-10 relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 bg-indigo-600 text-white">
          <h3 className="text-xl font-black">운동 기록 업로드</h3>
          <p className="text-xs opacity-70 font-medium">이미지를 올리면 AI가 데이터를 분석해드려요!</p>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase tracking-widest">날짜 선택</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
            />
          </div>

          {/* AI 인식 데이터 */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase tracking-widest">걸음수 (steps)</label>
              <input 
                type="number" 
                placeholder="0"
                value={steps} 
                onChange={e => setSteps(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-orange-500 outline-none font-black text-orange-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase tracking-widest">활동 칼로리 (kcal)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={activeCals} 
                  onChange={e => setActiveCals(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none font-black text-emerald-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase tracking-widest">총 소모량 (kcal)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={totalCals} 
                  onChange={e => setTotalCals(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {!imageUrl ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="w-full py-8 rounded-2xl border-2 border-dashed bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 transition-all flex flex-col items-center justify-center space-y-2"
              >
                {isAnalyzing ? (
                  <div className="flex flex-col items-center py-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-xs font-bold">AI가 이미지를 분석 중입니다...</span>
                  </div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-black text-sm">활동 스크린샷 업로드</span>
                  </>
                )}
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border shadow-inner bg-gray-50 mx-auto max-w-[300px] group">
                <img src={imageUrl} alt="Preview" className="w-full h-auto block" />
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 bg-white text-indigo-600 text-xs font-black rounded-full shadow-lg active:scale-95 transition-all"
                  >
                    이미지 변경
                  </button>
                  <button 
                    onClick={() => setImageUrl(null)}
                    className="p-1.5 bg-red-500 text-white rounded-full shadow-lg active:scale-95 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-[10px] font-bold text-indigo-600">분석 중...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            {existingActivity && (
              <button 
                onClick={() => {
                  if (confirm('정말 이 활동 기록을 삭제하시겠습니까?')) {
                    onDelete(existingActivity.date);
                  }
                }}
                className="px-4 py-4 bg-red-50 text-red-500 font-black rounded-2xl border border-red-100 transition-all text-xs hover:bg-red-100 active:scale-95"
              >
                삭제
              </button>
            )}
            <button 
              onClick={onCancel}
              className="flex-1 py-4 text-gray-400 font-black border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
            >
              취소
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || isAnalyzing}
              className={`flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center ${isSaving ? 'opacity-70' : ''}`}
            >
              {isSaving ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                existingActivity ? '기록 수정하기' : '기록 저장하기'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityUploadForm;
