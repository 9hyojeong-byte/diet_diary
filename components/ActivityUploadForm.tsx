
import React, { useState, useRef, useEffect } from 'react';
import { ActivityLog, MealRecord, MealStatus } from '../types';
import { analyzeActivityImage } from '../services/geminiService';
import { generateUUID } from '../utils';

interface Props {
  isOpen: boolean;
  initialDate: string;
  existingActivity?: ActivityLog;
  onSave: (activity: ActivityLog) => void;
  onDelete: (date: string) => void;
  onCancel: () => void;
  meals: MealRecord[];
  bmr: number;
}

const ActivityUploadForm: React.FC<Props> = ({ isOpen, initialDate, existingActivity, onSave, onDelete, onCancel, meals, bmr }) => {
  const [date, setDate] = useState(initialDate);
  const [steps, setSteps] = useState(existingActivity?.steps.toString() || '');
  const [activeCals, setActiveCals] = useState(existingActivity?.active_calories.toString() || '');
  const [totalCals, setTotalCals] = useState(existingActivity?.total_calories.toString() || '');
  const [imageUrl, setImageUrl] = useState<string | null>(existingActivity?.image_url || null);

  const [tef, setTef] = useState<number | null>(existingActivity?.tef ? Number(existingActivity.tef) : null);
  const [tdee, setTdee] = useState<number | null>(existingActivity?.tdee ? Number(existingActivity.tdee) : null);
  const [showTdeeCalc, setShowTdeeCalc] = useState<boolean>(!!existingActivity?.tdee);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get KST Today's string representation
  const getTodayKST = (): string => {
    const now = new Date();
    const kstDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const year = kstDate.getFullYear();
    const month = String(kstDate.getMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Remaining hours helper
  const getRemainingHours = (selectedDateStr: string): number => {
    const todayStr = getTodayKST();
    if (selectedDateStr < todayStr) return 0;
    if (selectedDateStr > todayStr) return 24;

    const now = new Date();
    const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const hour = kstNow.getHours();
    const min = kstNow.getMinutes();
    const sec = kstNow.getSeconds();

    return Math.max(0, Math.min(24, 24 - (hour + min / 60 + sec / 3600)));
  };

  const handleCalculateTdee = () => {
    // 1. Calculate TEF (Thermic Effect of Food) - 10% of ingested calories for selection date
    const dailyMeals = meals.filter(m => String(m.date).startsWith(date) && m.status === MealStatus.ACTUAL);
    const totalIntake = dailyMeals.reduce((sum, m) => sum + (Number(m.kcal) || 0), 0);
    const calculatedTef = Math.round(totalIntake * 0.1);

    // 2. Calculate remaining hours and remaining BMR
    const remainingHours = getRemainingHours(date);
    const remainingBmr = Math.round(bmr * (remainingHours / 24));

    // 3. 최종 예상 소모량(TDEE) = 현재 총 칼로리 소모량 + 남은 시간 추가 소모량
    const totalCalsNum = parseFloat(totalCals) || 0;
    const calculatedTdee = Math.round(totalCalsNum + remainingBmr);

    setTef(calculatedTef);
    setTdee(calculatedTdee);
    setShowTdeeCalc(true);
  };

  // Recalculate TDEE on the fly if inputs change while TDEE is already calculated
  useEffect(() => {
    if (showTdeeCalc) {
      handleCalculateTdee();
    }
  }, [date, totalCals, meals]);

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
      const tdeeVal = tdee !== null ? tdee : undefined;
      const tefVal = tef !== null ? tef : undefined;
      const tdeeWithTefVal = (tdeeVal !== undefined && tefVal !== undefined) ? (tdeeVal + tefVal) : undefined;

      let calorieDeficitVal: number | undefined = undefined;
      if (tdeeWithTefVal !== undefined) {
        const intakeCalories = meals
          .filter(m => m.date && String(m.date).split('T')[0] === date && m.status === MealStatus.ACTUAL)
          .reduce((acc, cur) => acc + (Number(cur.kcal) || 0), 0);
        calorieDeficitVal = tdeeWithTefVal - intakeCalories;
      }

      await onSave({
        uuid: existingActivity?.uuid || generateUUID(),
        date,
        steps: parseInt(steps) || 0,
        active_calories: parseInt(activeCals) || 0,
        total_calories: parseInt(totalCals) || 0,
        tef: tefVal,
        tdee: tdeeVal,
        tdee_with_tef: tdeeWithTefVal,
        calorie_deficit: calorieDeficitVal,
        bmr: bmr,
        image_url: imageUrl || undefined,
        created_at: existingActivity?.created_at || new Date().toISOString()
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

          {/* TDEE 계산기 */}
          <div className="pt-2">
            {!showTdeeCalc ? (
              <button
                type="button"
                onClick={handleCalculateTdee}
                disabled={!totalCals}
                className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-xs font-black transition-all flex items-center justify-center space-x-1 border border-indigo-100 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>🔥</span>
                <span>TDEE 계산하기</span>
              </button>
            ) : (
              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-800/50 relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="absolute top-0 right-0 p-3 opacity-10 text-6xl select-none">⚡</div>

                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                  <h4 className="text-xs font-black flex items-center space-x-1.5 text-indigo-200 uppercase tracking-widest">
                    <span>📊</span>
                    <span>TDEE 분석 결과</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleCalculateTdee}
                    className="text-[10px] font-bold text-indigo-300 hover:text-white transition-colors bg-white/10 px-2 py-1 rounded-lg"
                  >
                    새로고침 🔄
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs mb-4">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">기초대사량</span>
                    <span className="font-extrabold text-white">{bmr.toLocaleString()} kcal</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">활동칼로리</span>
                    <span className="font-extrabold text-emerald-400">{Number(activeCals || 0).toLocaleString()} kcal</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">현재 총 소모량</span>
                    <span className="font-extrabold text-indigo-300">{Number(totalCals || 0).toLocaleString()} kcal</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">남은 추가소모</span>
                    <span className="font-bold text-sky-450">+{Math.round(bmr * (getRemainingHours(date) / 24)).toLocaleString()} kcal</span>
                  </div>
                  <div className="flex justify-between items-center col-span-2 border-t border-white/5 pt-2 mt-1 text-[11px] text-slate-300">
                    <span className="font-medium text-slate-400">식사 효과 (TEF)</span>
                    <span className="font-bold text-orange-400">{tef?.toLocaleString()} kcal</span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-350 flex items-center space-x-1">
                      <span>🕒</span>
                      <span>남은 시간 추가 소모 계산법 ({getRemainingHours(date).toFixed(1)}시간)</span>
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium leading-normal">
                    자정까지 남은 {getRemainingHours(date).toFixed(1)}시간 동안 추가로 소비될 기초대사량({bmr.toLocaleString()} kcal × 비율)인 <strong>{Math.round(bmr * (getRemainingHours(date) / 24)).toLocaleString()} kcal</strong>를 더하였습니다.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-300">🔥 최종 예상 소모량 (TDEE)</span>
                  <span className="text-lg font-black text-amber-400 animate-pulse">{tdee?.toLocaleString()} kcal</span>
                </div>
                {tdee !== null && tef !== null && (
                  <>
                    <div className="mt-2 pt-2 border-t border-dashed border-white/5 flex justify-between items-center">
                      <span className="text-xs font-black text-slate-300">🥗 TEF 포함 최종 TDEE</span>
                      <span className="text-lg font-black text-emerald-400 animate-pulse">{(tdee + tef).toLocaleString()} kcal</span>
                    </div>
                    {(() => {
                      const tdeeWithTef = tdee + tef;
                      const intakeCalories = meals
                        .filter(m => m.date && String(m.date).split('T')[0] === date && m.status === MealStatus.ACTUAL)
                        .reduce((acc, cur) => acc + (Number(cur.kcal) || 0), 0);
                      const deficit = tdeeWithTef - intakeCalories;
                      return (
                        <div className="mt-2 pt-2 border-t border-dashed border-white/5 flex justify-between items-center">
                          <span className="text-xs font-black text-rose-300">📉 예상 결손 칼로리</span>
                          <span className="text-lg font-black text-rose-400">
                            {deficit.toLocaleString()} kcal
                          </span>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
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
                    onDelete(existingActivity.uuid);
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
