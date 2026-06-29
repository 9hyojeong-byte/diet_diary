import React, { useState } from 'react';
import { BMRRecord } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bmrHistory: BMRRecord[];
  onSaveBMR: (bmr: number, effectiveDate: string) => Promise<boolean>;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, bmrHistory, onSaveBMR }) => {
  const getTodayKST = () => {
    const now = new Date();
    const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kstDate.toISOString().split('T')[0];
  };

  const [bmrInput, setBmrInput] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(getTodayKST());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Sort history in descending order of effectiveDate, then createdAt
  const sortedHistory = [...bmrHistory].sort((a, b) => {
    const dateCompare = b.effectiveDate.localeCompare(a.effectiveDate);
    if (dateCompare !== 0) return dateCompare;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedBmr = parseInt(bmrInput);
    if (isNaN(parsedBmr) || parsedBmr <= 0) {
      setErrorMsg('올바른 기초대사량(정수, 0보다 큰 값)을 입력해주세요.');
      return;
    }

    if (!effectiveDate) {
      setErrorMsg('적용 날짜를 선택해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSaveBMR(parsedBmr, effectiveDate);
      if (success) {
        setBmrInput('');
      } else {
        setErrorMsg('기초대사량을 저장하지 못했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      console.error('Failed to save BMR', err);
      setErrorMsg('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">⚙️ 설정 및 기초대사량 관리</h3>
            <p className="text-xs opacity-75 font-medium">나의 일일 기초대사량(BMR)을 관리해보세요.</p>
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

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* New BMR Form */}
          <form onSubmit={handleSave} className="space-y-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
            <h4 className="text-xs font-black text-indigo-900 flex items-center space-x-1 uppercase tracking-wider">
              <span>✍️</span>
              <span>새 기초대사량 등록</span>
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase tracking-widest">기초대사량 (kcal)</label>
                <input 
                  type="number" 
                  placeholder="예: 1410"
                  value={bmrInput}
                  onChange={(e) => setBmrInput(e.target.value)}
                  className="w-full p-3 bg-white rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-600 text-sm"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase tracking-widest">적용일자</label>
                <input 
                  type="date" 
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full p-3 bg-white rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                  disabled={isSaving}
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-red-500 font-bold ml-1">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isSaving || !bmrInput}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 active:scale-[0.98] shadow-lg shadow-indigo-100"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>저장 중...</span>
                </>
              ) : (
                <span>새 기초대사량 저장하기 💾</span>
              )}
            </button>
          </form>

          {/* History Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-800 flex items-center space-x-1 uppercase tracking-wider">
              <span>📅</span>
              <span>기초대사량 변경 이력</span>
            </h4>

            {sortedHistory.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-400 font-medium leading-relaxed">
                <p>아직 등록된 변경 이력이 없습니다. 🐾</p>
                <p className="mt-1 text-[10px] text-gray-300">새 기초대사량을 입력해 등록해 보세요.</p>
              </div>
            ) : (
              <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {sortedHistory.map((record) => (
                  <div 
                    key={record.id} 
                    className="flex justify-between items-center p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-gray-800">{record.effectiveDate}</span>
                      <span className="text-[9px] text-gray-400 font-medium">등록일: {record.createdAt.split('T')[0]}</span>
                    </div>
                    <span className="font-extrabold text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                      {record.bmr.toLocaleString()} kcal
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
