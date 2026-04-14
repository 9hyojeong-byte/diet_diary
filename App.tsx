
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MealRecord, Ingredient, MealType, MealStatus, HealthDiary } from './types';
import Calendar from './components/Calendar';
import DailySummaryView from './components/DailySummary';
import MealSection from './components/MealSection';
import MealInputForm from './components/MealInputForm';
import AIAdviceModal from './components/AIAdviceModal';
import Sidebar from './components/Sidebar';
import IngredientManagement from './components/IngredientManagement';
import Statistics from './components/Statistics';
import MemoList from './components/MemoList';
import ExitModal from './components/ExitModal';
import AdminLoginModal from './components/AdminLoginModal';
import DiaryModal from './components/DiaryModal';
import ActivityLogView from './components/ActivityLogView';
import ActivityUploadForm from './components/ActivityUploadForm';
import { getTargetKcal, getTargetProtein } from './utils';
import { 
  fetchInitialData, 
  saveMealToGAS, 
  updateMealInGAS, 
  saveIngredientToGAS, 
  updateIngredientInGAS,
  deleteIngredientFromGAS,
  updateIngredientBookmark,
  saveDiaryToGAS,
  saveActivityToGAS,
  updateActivityInGAS,
  deleteActivityFromGAS
} from './services/gasService';

import { ActivityLog } from './types';

const TRIAL_MESSAGE = "체험 모드 안내\n이 버전은 공개용 포트폴리오 버전입니다. 데이터의 보안과 무결성을 위해 기록 수정 기능이 제한되어 있습니다.";

const FOOD_EMOJIS = ['🥗', '🍎', '🥑', '🍗', '🍳', '🥛', '🍣', '🍱', '🥣', '🥦', '🍌', '🥪', '🥙', '🥗'];

const App: React.FC = () => {
  const getKSTDate = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[0];
  };

  const getKSTTime = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[1].slice(0, 5);
  };

  const getKSTFullTime = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().replace('T', ' ').slice(0, 19);
  };

  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('isAdmin') === 'true');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'ingredients' | 'stats' | 'memos' | 'activity'>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getKSTDate());
  
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [diaries, setDiaries] = useState<HealthDiary[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingEmoji, setLoadingEmoji] = useState('🥗');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [isActivityUploadOpen, setIsActivityUploadOpen] = useState(false);
  const [activityUploadDate, setActivityUploadDate] = useState<string>('');
  const [editMealTarget, setEditMealTarget] = useState<MealRecord | null>(null);
  const [prefilledType, setPrefilledType] = useState<MealType | null>(null);
  const [adviceModalOpen, setAdviceModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  // Toast handler
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    window.history.pushState({ noBackExitsApp: true }, '');
    const handlePopState = (event: PopStateEvent) => {
      if (isSidebarOpen) { setIsSidebarOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); return; }
      if (isInputOpen) { setIsInputOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); return; }
      if (isDiaryOpen) { setIsDiaryOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); return; }
      if (isActivityUploadOpen) { setIsActivityUploadOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); return; }
      if (adviceModalOpen) { setAdviceModalOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); return; }
      if (isAdminLoginOpen) { setIsAdminLoginOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); return; }
      setIsExitModalOpen(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSidebarOpen, isInputOpen, isDiaryOpen, adviceModalOpen, isAdminLoginOpen]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadingEmoji(FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)]);
      try {
        const data = await fetchInitialData();
        setMeals(data.meals || []);
        setIngredients(data.ingredients || []);
        setDiaries(data.diaries || []);
        setActivities(data.activities || []);
      } catch (error) {
        console.error("Failed to load data", error);
        showToast("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setTimeout(() => setIsLoading(false), 1200);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isAdmin && currentView === 'memos') {
      setCurrentView('main');
    }
  }, [isAdmin, currentView]);

  const filteredMeals = useMemo(() => meals.filter(m => String(m.date).startsWith(selectedDate) && m.status !== MealStatus.CANCELED), [meals, selectedDate]);
  const currentDiary = useMemo(() => diaries.find(d => d.date === selectedDate), [diaries, selectedDate]);
  const currentActivity = useMemo(() => activities.find(a => a.date === selectedDate), [activities, selectedDate]);

  const summary = useMemo(() => {
    const initial = { kcal: 0, carbs: 0, protein: 0, fat: 0 };
    const actual = filteredMeals.filter(m => m.status === MealStatus.ACTUAL).reduce((acc, cur) => ({
      kcal: acc.kcal + (Number(cur.kcal) || 0),
      carbs: acc.carbs + (Number(cur.carbs) || 0),
      protein: acc.protein + (Number(cur.protein) || 0),
      fat: acc.fat + (Number(cur.fat) || 0),
    }), { ...initial });
    const total = filteredMeals.reduce((acc, cur) => ({
      kcal: acc.kcal + (Number(cur.kcal) || 0),
      carbs: acc.carbs + (Number(cur.carbs) || 0),
      protein: acc.protein + (Number(cur.protein) || 0),
      fat: acc.fat + (Number(cur.fat) || 0),
    }), { ...initial });
    return { actual, planned: total };
  }, [filteredMeals]);

  const onSaveMeal = useCallback(async (newMeal: MealRecord, newIngredient?: Ingredient) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const prevMeals = [...meals];
    const prevIngredients = [...ingredients];
    const isUpdate = meals.some(m => String(m.uuid) === String(newMeal.uuid));
    setMeals(prev => isUpdate ? prev.map(m => String(m.uuid) === String(newMeal.uuid) ? { ...newMeal, pending: true } : m) : [...prev, { ...newMeal, pending: true }]);
    if (newIngredient) setIngredients(prev => [...prev, newIngredient]);
    try {
      if (newIngredient) await saveIngredientToGAS(newIngredient);
      const success = isUpdate ? await updateMealInGAS(newMeal) : await saveMealToGAS(newMeal);
      if (!success) throw new Error("Server storage failed");
      setMeals(prev => prev.map(m => String(m.uuid) === String(newMeal.uuid) ? { ...m, pending: false } : m));
    } catch (error) {
      setMeals(prevMeals);
      setIngredients(prevIngredients);
      showToast("저장에 실패했습니다. 다시 시도해 주세요.");
    }
  }, [meals, ingredients, isAdmin]);

  const handleSetMealStatus = useCallback(async (uuid: string, status: MealStatus) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const target = meals.find(m => String(m.uuid) === String(uuid));
    if (!target || target.status === status) return;
    const prevMeals = [...meals];
    
    // ACTUAL이면 현재 시각, PLANNED이면 23:59로 자동 설정
    const newTime = status === MealStatus.ACTUAL 
      ? getKSTTime() 
      : (status === MealStatus.PLANNED ? '23:59' : target.time);

    const updatedMeal: MealRecord = { ...target, status, time: newTime, pending: true };
    setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? updatedMeal : m));
    try {
      const success = await updateMealInGAS(updatedMeal);
      if (!success) throw new Error("Update failed");
      setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? { ...updatedMeal, pending: false } : m));
    } catch (err) {
      setMeals(prevMeals);
      showToast("상태 변경에 실패했습니다. 다시 시도해 주세요.");
    }
  }, [meals, isAdmin]);

  const onDeleteMeal = useCallback(async (uuid: string): Promise<boolean> => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return false; }
    const target = meals.find(m => String(m.uuid) === String(uuid));
    if (!target) return false;
    const prevMeals = [...meals];
    setMeals(p => p.map(m => String(m.uuid) === String(uuid) ? { ...m, status: MealStatus.CANCELED, pending: true } : m));
    try {
      const success = await updateMealInGAS({ ...target, status: MealStatus.CANCELED });
      if (success) {
        setMeals(p => p.map(m => String(m.uuid) === String(uuid) ? { ...m, pending: false } : m));
        return true;
      } else throw new Error("Delete failed");
    } catch (err) {
      setMeals(prevMeals);
      showToast("삭제에 실패했습니다. 다시 시도해 주세요.");
      return false;
    }
  }, [meals, isAdmin]);

  const getIngredientDisplayName = useCallback((meal: MealRecord) => {
    if (meal.ingredient_name) return meal.ingredient_name;
    if (!meal.ingredient_uuid) return '식재료 정보 없음';
    const targetUuid = String(meal.ingredient_uuid).trim();
    const found = ingredients.find(i => String(i.uuid).trim() === targetUuid);
    return found ? found.name : '알 수 없는 식재료';
  }, [ingredients]);

  const handleCopyTextToClipboard = useCallback((includePlanned: boolean = false) => {
    const mealsToCopy = filteredMeals.filter(m => 
      m.status === MealStatus.ACTUAL || (includePlanned && m.status === MealStatus.PLANNED)
    );
    
    if (mealsToCopy.length === 0) {
      alert(includePlanned ? "복사할 식단이 없습니다." : "섭취 완료된(ACTUAL) 식단이 없습니다.");
      return;
    }

    const typeOrder = [MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER];
    let text = `[${selectedDate} ${includePlanned ? '예정 ' : ''}식단 기록]\n\n`;

    typeOrder.forEach(type => {
      // 시간순 정렬 제거: 입력된 순서(배열 인덱스 순서) 유지
      const typeMeals = mealsToCopy.filter(m => m.type === type);

      if (typeMeals.length > 0) {
        text += `[${type}]\n`;
        typeMeals.forEach(m => {
          const name = getIngredientDisplayName(m);
          const statusText = (includePlanned && m.status === MealStatus.PLANNED) ? '(예정) ' : '';
          text += `${m.time} | ${statusText}${name} (${m.amount}g) - ${Math.round(m.kcal)}kcal (탄:${Math.round(m.carbs)}g, 단:${Math.round(m.protein)}g, 지:${Math.round(m.fat)}g)\n`;
        });
        text += `\n`;
      }
    });

    const summaryToUse = includePlanned ? summary.planned : summary.actual;
    text += `${includePlanned ? '총 섭취 예상' : '총 섭취'}: ${Math.round(summaryToUse.kcal)}kcal `;
    text += `영양합계: 탄 ${Math.round(summaryToUse.carbs)}g, 단 ${Math.round(summaryToUse.protein)}g, 지 ${Math.round(summaryToUse.fat)}g`;
    
    navigator.clipboard.writeText(text).then(() => {
      showToast("식단이 클립보드에 복사되었습니다! 📋");
    }).catch(err => {
      console.error("Clipboard copy failed", err);
      showToast("복사에 실패했습니다.");
    });
  }, [filteredMeals, selectedDate, summary, getIngredientDisplayName]);

  const onSaveDiary = useCallback(async (content: string) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const prevDiaries = [...diaries];
    const now = getKSTFullTime();
    const newDiary: HealthDiary = {
      uuid: currentDiary?.uuid || crypto.randomUUID(),
      date: selectedDate,
      content,
      updated_at: now,
      pending: true
    };
    setDiaries(prev => {
      const exists = prev.some(d => d.date === selectedDate);
      return exists ? prev.map(d => d.date === selectedDate ? newDiary : d) : [...prev, newDiary];
    });
    try {
      const success = await saveDiaryToGAS(newDiary);
      if (success) setDiaries(prev => prev.map(d => d.date === selectedDate ? { ...newDiary, pending: false } : d));
      else throw new Error("Diary storage failed");
    } catch (error) { 
      setDiaries(prevDiaries);
      showToast("일기 저장에 실패했습니다.");
    }
  }, [selectedDate, currentDiary, diaries, isAdmin]);

  const onSaveActivity = useCallback(async (activity: ActivityLog) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const prevActivities = [...activities];
    const isUpdate = activities.some(a => a.date === activity.date);
    
    setActivities(prev => {
      const exists = prev.some(a => a.date === activity.date);
      return exists ? prev.map(a => a.date === activity.date ? { ...activity, pending: true } : a) : [...prev, { ...activity, pending: true }];
    });
    setIsActivityUploadOpen(false);
    try {
      const success = isUpdate ? await updateActivityInGAS(activity) : await saveActivityToGAS(activity);
      if (success) {
        setActivities(prev => prev.map(a => a.date === activity.date ? { ...activity, pending: false } : a));
        showToast(isUpdate ? "활동 기록이 수정되었습니다! 💪" : "활동 기록이 저장되었습니다! 💪");
      } else throw new Error("Activity storage failed");
    } catch (error) {
      setActivities(prevActivities);
      showToast("활동 기록 저장에 실패했습니다.");
    }
  }, [activities, isAdmin]);

  const onDeleteActivity = useCallback(async (date: string) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const prevActivities = [...activities];
    setActivities(prev => prev.filter(a => a.date !== date));
    setIsActivityUploadOpen(false);
    try {
      const success = await deleteActivityFromGAS(date);
      if (!success) throw new Error("Activity deletion failed");
      showToast("활동 기록이 삭제되었습니다.");
    } catch (error) {
      setActivities(prevActivities);
      showToast("활동 기록 삭제에 실패했습니다.");
    }
  }, [activities, isAdmin]);

  const handleToggleBookmark = useCallback(async (uuid: string) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const target = ingredients.find(i => String(i.uuid) === String(uuid));
    if (!target) return;
    const prevIngredients = [...ingredients];
    const next = !target.is_bookmarked;
    setIngredients(prev => prev.map(i => String(i.uuid) === String(uuid) ? { ...i, is_bookmarked: next } : i));
    try { 
      const success = await updateIngredientBookmark(uuid, next); 
      if (!success) throw new Error("Bookmark failed");
    } catch (err) { 
      setIngredients(prevIngredients); 
      showToast("즐겨찾기 상태 변경에 실패했습니다.");
    }
  }, [ingredients, isAdmin]);

  const handleLogin = (s: boolean) => { if (s) { setIsAdmin(true); localStorage.setItem('isAdmin', 'true'); } };
  const handleLogout = () => { 
    if (confirm('관리자 모드를 해제하시겠습니까?')) { 
      setIsAdmin(false); 
      localStorage.removeItem('isAdmin'); 
      if (currentView === 'memos') setCurrentView('main');
    } 
  };

  return (
    <div className={`max-w-md mx-auto min-h-screen pb-24 relative bg-gray-50 shadow-2xl transition-all ${!isAdmin ? 'ring-4 ring-orange-200 ring-inset' : ''}`}>
      {isLoading && (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-6xl animate-bounce" style={{ display: 'inline-block' }}>{loadingEmoji}</span>
            </div>
            <div className="absolute -inset-2 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">데이터를 불러오는 중입니다...</h2>
          <p className="text-sm text-gray-400 font-medium">잠시만 기다려 주세요 ✨</p>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMessage}
        </div>
      )}

      {!isAdmin && <div className="bg-orange-500 text-white text-[10px] font-black text-center py-1 uppercase tracking-widest sticky top-0 z-[60]">체험 모드로 접속 중입니다</div>}
      
      <header className={`bg-indigo-600 text-white p-4 sticky ${!isAdmin ? 'top-6' : 'top-0'} z-50 shadow-lg flex items-center justify-between`}>
        <div className="flex items-center">
          {currentView === 'main' ? (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          ) : (
            <button onClick={() => { setCurrentView('main'); setIsActivityUploadOpen(false); }} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></button>
          )}
          <h1 className="ml-2 text-xl font-bold">
            {currentView === 'main' ? '쿠쿠님의 식단 기록' : 
             currentView === 'ingredients' ? '식재료 관리' : 
             currentView === 'memos' ? '메모 목록' : 
             currentView === 'activity' ? '활동량 기록' : '나의 통계'}
          </h1>
        </div>
        {isAdmin && <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full flex items-center space-x-1 transition-all active:scale-95 group"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse group-hover:bg-red-400"></div><span className="text-[10px] font-black tracking-widest group-hover:text-red-100">ADMIN</span></button>}
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentView={currentView} onNavigate={setCurrentView} isAdmin={isAdmin} onLogout={handleLogout} onOpenAdminLogin={() => setIsAdminLoginOpen(true)} selectedDate={selectedDate} />

      <main className="p-4">
        {currentView === 'main' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} meals={meals} diaries={diaries} activities={activities} />
            <DailySummaryView summary={summary} selectedDate={selectedDate} />

            <div className="space-y-4">
              {[MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER].map(type => (
                <MealSection key={type} type={type} meals={filteredMeals.filter(m => m.type === type)} ingredients={ingredients} isAdmin={isAdmin} onAdd={() => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setEditMealTarget(null); setPrefilledType(type); setIsInputOpen(true); }} onEdit={(m) => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setEditMealTarget(m); setIsInputOpen(true); }} onDelete={onDeleteMeal} onSetStatus={handleSetMealStatus} />
              ))}
            </div>

            <div className="pt-2 space-y-3">
              <button 
                onClick={() => {
                  if (!isAdmin && !currentDiary) {
                    alert(TRIAL_MESSAGE);
                    return;
                  }
                  setIsDiaryOpen(true);
                }} 
                className={`w-full py-4 rounded-2xl border-2 transition-all flex items-center justify-center space-x-2 font-black shadow-sm active:scale-[0.98] ${currentDiary ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-dashed border-gray-200 text-gray-400'}`}
              >
                <span className="text-xl">{currentDiary ? '📝' : '+'}</span>
                <span>{currentDiary ? '건강 일기 보기' : '오늘의 건강 일기 작성'}</span>
              </button>
              <div className="flex space-x-3">
                <button onClick={() => handleCopyTextToClipboard(false)} className="flex-1 py-4 bg-white border-2 border-indigo-500 text-indigo-600 font-black rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-1">
                  <span className="text-lg">📋</span>
                  <span className="text-sm">식단 복사</span>
                </button>
                <button onClick={() => handleCopyTextToClipboard(true)} className="flex-1 py-4 bg-indigo-50 border-2 border-indigo-400 text-indigo-700 font-black rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-1">
                  <span className="text-lg">📝</span>
                  <span className="text-sm">예상 포함 복사</span>
                </button>
              </div>
              <button onClick={() => setAdviceModalOpen(true)} className="w-full py-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center space-x-2"><span className="text-xl">✨</span><span>AI 영양 추천 받기</span></button>
            </div>
          </div>
        ) : currentView === 'ingredients' ? (
          <IngredientManagement ingredients={ingredients} isAdmin={isAdmin} onToggleBookmark={handleToggleBookmark} onAddIngredient={ing => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setIngredients(p => [...p, ing]); saveIngredientToGAS(ing); }} onUpdateIngredient={ing => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setIngredients(p => p.map(i => i.uuid === ing.uuid ? ing : i)); updateIngredientInGAS(ing); }} onDeleteIngredient={id => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setIngredients(p => p.filter(i => i.uuid !== id)); deleteIngredientFromGAS(id); }} trialMessage={TRIAL_MESSAGE} />
        ) : currentView === 'memos' ? (
          <MemoList isAdmin={isAdmin} trialMessage={TRIAL_MESSAGE} />
        ) : currentView === 'activity' ? (
          <ActivityLogView 
            activities={activities} 
            onNavigateToUpload={(date) => {
              setActivityUploadDate(date);
              setIsActivityUploadOpen(true);
            }} 
          />
        ) : (
          <Statistics meals={meals} onDateSelect={(d) => { setSelectedDate(d); setCurrentView('main'); }} />
        )}
      </main>

      {currentView === 'main' && !isActivityUploadOpen && (
        <button 
          onClick={() => {
            if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
            setActivityUploadDate(selectedDate);
            setIsActivityUploadOpen(true);
          }}
          className="fixed bottom-6 right-6 bg-white border-2 border-indigo-600 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-40 group"
        >
          <span className="text-2xl group-hover:animate-bounce">💪</span>
          {currentActivity && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 border-2 border-white rounded-full -translate-y-1/4 translate-x-1/4 animate-pulse"></span>
          )}
        </button>
      )}

      {isInputOpen && <MealInputForm isOpen={isInputOpen} onClose={() => { setIsInputOpen(false); setEditMealTarget(null); }} selectedDate={selectedDate} prefilledType={prefilledType} editTarget={editMealTarget} ingredients={ingredients} meals={meals} isAdmin={isAdmin} onSave={onSaveMeal} onDelete={onDeleteMeal} trialMessage={TRIAL_MESSAGE} />}
      {isActivityUploadOpen && (
        <ActivityUploadForm 
          isOpen={isActivityUploadOpen}
          initialDate={activityUploadDate} 
          existingActivity={activities.find(a => a.date === activityUploadDate)}
          onSave={onSaveActivity} 
          onDelete={onDeleteActivity}
          onCancel={() => setIsActivityUploadOpen(false)} 
        />
      )}
      {isDiaryOpen && <DiaryModal isOpen={isDiaryOpen} onClose={() => setIsDiaryOpen(false)} selectedDate={selectedDate} diary={currentDiary} onSave={onSaveDiary} isAdmin={isAdmin} />}
      {adviceModalOpen && <AIAdviceModal isOpen={adviceModalOpen} onClose={() => setAdviceModalOpen(false)} summary={summary} meals={filteredMeals} targetKcal={getTargetKcal(selectedDate)} targetProtein={getTargetProtein(selectedDate)} activity={currentActivity} />}
      {isAdminLoginOpen && <AdminLoginModal isOpen={isAdminLoginOpen} onClose={() => setIsAdminLoginOpen(false)} onLogin={handleLogin} />}
      {isExitModalOpen && <ExitModal isOpen={isExitModalOpen} onClose={() => { setIsExitModalOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); }} />}
    </div>
  );
};

export default App;
