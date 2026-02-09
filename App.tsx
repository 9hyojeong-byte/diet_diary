
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
import ExitModal from './components/ExitModal';
import AdminLoginModal from './components/AdminLoginModal';
import DiaryModal from './components/DiaryModal';
import { 
  fetchInitialData, 
  saveMealToGAS, 
  updateMealInGAS, 
  saveIngredientToGAS, 
  updateIngredientInGAS,
  deleteIngredientFromGAS,
  updateIngredientBookmark,
  saveDiaryToGAS
} from './services/gasService';

const TRIAL_MESSAGE = "체험 모드 안내\n이 버전은 공개용 포트폴리오 버전입니다. 데이터의 보안과 무결성을 위해 기록 수정 기능이 제한되어 있습니다.";

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
  const [currentView, setCurrentView] = useState<'main' | 'ingredients' | 'stats'>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getKSTDate());
  
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [diaries, setDiaries] = useState<HealthDiary[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [editMealTarget, setEditMealTarget] = useState<MealRecord | null>(null);
  const [prefilledType, setPrefilledType] = useState<MealType | null>(null);
  const [adviceModalOpen, setAdviceModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  useEffect(() => {
    window.history.pushState({ noBackExitsApp: true }, '');
    const handlePopState = (event: PopStateEvent) => {
      if (isSidebarOpen) { setIsSidebarOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); return; }
      if (isInputOpen) { setIsInputOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); return; }
      if (isDiaryOpen) { setIsDiaryOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); return; }
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
      try {
        const data = await fetchInitialData();
        setMeals(data.meals || []);
        setIngredients(data.ingredients || []);
        setDiaries(data.diaries || []);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredMeals = useMemo(() => meals.filter(m => String(m.date).startsWith(selectedDate) && m.status !== MealStatus.CANCELED), [meals, selectedDate]);
  const currentDiary = useMemo(() => diaries.find(d => d.date === selectedDate), [diaries, selectedDate]);

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
    const isUpdate = meals.some(m => String(m.uuid) === String(newMeal.uuid));
    setMeals(prev => isUpdate ? prev.map(m => String(m.uuid) === String(newMeal.uuid) ? { ...newMeal, pending: true } : m) : [...prev, { ...newMeal, pending: true }]);
    if (newIngredient) { setIngredients(prev => [...prev, newIngredient]); saveIngredientToGAS(newIngredient); }
    try {
      isUpdate ? await updateMealInGAS(newMeal) : await saveMealToGAS(newMeal);
      setMeals(prev => prev.map(m => String(m.uuid) === String(newMeal.uuid) ? { ...m, pending: false } : m));
    } catch (error) { console.error("Meal save/update failed", error); }
  }, [meals, isAdmin]);

  const onSaveDiary = useCallback(async (content: string) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const now = getKSTFullTime();
    const newDiary: HealthDiary = {
      uuid: currentDiary?.uuid || crypto.randomUUID(),
      date: selectedDate,
      content,
      updated_at: now,
      pending: true
    };
    
    // Optimistic Update
    setDiaries(prev => {
      const exists = prev.some(d => d.date === selectedDate);
      return exists ? prev.map(d => d.date === selectedDate ? newDiary : d) : [...prev, newDiary];
    });

    try {
      const success = await saveDiaryToGAS(newDiary);
      if (success) setDiaries(prev => prev.map(d => d.date === selectedDate ? { ...newDiary, pending: false } : d));
    } catch (error) { console.error("Diary save failed", error); }
  }, [selectedDate, currentDiary, isAdmin]);

  const handleSetMealStatus = useCallback(async (uuid: string, status: MealStatus) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const target = meals.find(m => String(m.uuid) === String(uuid));
    if (!target || target.status === status) return;
    const updatedMeal: MealRecord = { ...target, status, time: status === MealStatus.ACTUAL ? getKSTTime() : target.time, pending: true };
    setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? updatedMeal : m));
    try {
      const success = await updateMealInGAS(updatedMeal);
      if (success) setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? { ...updatedMeal, pending: false } : m));
    } catch (err) { setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? { ...target, pending: false } : m)); }
  }, [meals, isAdmin]);

  const onDeleteMeal = useCallback(async (uuid: string): Promise<boolean> => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return false; }
    const target = meals.find(m => String(m.uuid) === String(uuid));
    if (!target) return false;
    const prev = [...meals];
    setMeals(p => p.map(m => String(m.uuid) === String(uuid) ? { ...m, status: MealStatus.CANCELED, pending: true } : m));
    try {
      const success = await updateMealInGAS({ ...target, status: MealStatus.CANCELED });
      if (success) { setMeals(p => p.map(m => String(m.uuid) === String(uuid) ? { ...m, pending: false } : m)); return true; }
      else { setMeals(prev); return false; }
    } catch (err) { setMeals(prev); return false; }
  }, [meals, isAdmin]);

  const handleToggleBookmark = useCallback(async (uuid: string) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const target = ingredients.find(i => String(i.uuid) === String(uuid));
    if (!target) return;
    const next = !target.is_bookmarked;
    setIngredients(prev => prev.map(i => String(i.uuid) === String(uuid) ? { ...i, is_bookmarked: next } : i));
    try { await updateIngredientBookmark(uuid, next); } catch (err) { setIngredients(prev => prev.map(i => String(i.uuid) === String(uuid) ? { ...i, is_bookmarked: !next } : i)); }
  }, [ingredients, isAdmin]);

  const handleLogin = (s: boolean) => { if (s) { setIsAdmin(true); localStorage.setItem('isAdmin', 'true'); } };
  const handleLogout = () => { if (confirm('관리자 모드를 해제하시겠습니까?')) { setIsAdmin(false); localStorage.removeItem('isAdmin'); } };

  return (
    <div className={`max-w-md mx-auto min-h-screen pb-24 relative bg-gray-50 shadow-2xl transition-all ${!isAdmin ? 'ring-4 ring-orange-200 ring-inset' : ''}`}>
      {!isAdmin && <div className="bg-orange-500 text-white text-[10px] font-black text-center py-1 uppercase tracking-widest sticky top-0 z-[60]">체험 모드로 접속 중입니다</div>}
      <header className={`bg-indigo-600 text-white p-4 sticky ${!isAdmin ? 'top-6' : 'top-0'} z-50 shadow-lg flex items-center justify-between`}>
        <div className="flex items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <h1 className="ml-2 text-xl font-bold">{currentView === 'main' ? '쿠쿠님의 식단 기록' : currentView === 'ingredients' ? '식재료 관리' : '나의 통계'}</h1>
        </div>
        {isAdmin && <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full flex items-center space-x-1 transition-all active:scale-95 group"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse group-hover:bg-red-400"></div><span className="text-[10px] font-black tracking-widest group-hover:text-red-100">ADMIN</span></button>}
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentView={currentView} onNavigate={setCurrentView} isAdmin={isAdmin} onLogout={handleLogout} onOpenAdminLogin={() => setIsAdminLoginOpen(true)} />

      <main className="p-4">
        {currentView === 'main' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} meals={meals} diaries={diaries} />
            <DailySummaryView summary={summary} selectedDate={selectedDate} />

            <button 
              onClick={() => setIsDiaryOpen(true)}
              className={`w-full py-4 rounded-2xl border-2 transition-all flex items-center justify-center space-x-2 font-black shadow-sm active:scale-[0.98] ${
                currentDiary 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                  : 'bg-white border-dashed border-gray-200 text-gray-400'
              }`}
            >
              <span className="text-xl">{currentDiary ? '📝' : '+'}</span>
              <span>{currentDiary ? '건강 일기 보기' : '건강 일기 작성하기'}</span>
            </button>

            <div className="space-y-4">
              {[MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER].map(type => (
                <MealSection key={type} type={type} meals={filteredMeals.filter(m => m.type === type)} ingredients={ingredients} isAdmin={isAdmin} onAdd={() => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setEditMealTarget(null); setPrefilledType(type); setIsInputOpen(true); }} onEdit={(m) => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setEditMealTarget(m); setIsInputOpen(true); }} onDelete={onDeleteMeal} onSetStatus={handleSetMealStatus} />
              ))}
            </div>

            <div className="pt-2 space-y-3">
              <button onClick={() => setAdviceModalOpen(true)} className="w-full py-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center space-x-2"><span className="text-xl">✨</span><span>AI 영양 추천 받기</span></button>
            </div>
          </div>
        ) : currentView === 'ingredients' ? (
          <IngredientManagement ingredients={ingredients} isAdmin={isAdmin} onToggleBookmark={handleToggleBookmark} onAddIngredient={ing => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setIngredients(p => [...p, ing]); saveIngredientToGAS(ing); }} onUpdateIngredient={ing => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setIngredients(p => p.map(i => i.uuid === ing.uuid ? ing : i)); updateIngredientInGAS(ing); }} onDeleteIngredient={id => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setIngredients(p => p.filter(i => i.uuid !== id)); deleteIngredientFromGAS(id); }} trialMessage={TRIAL_MESSAGE} />
        ) : (
          <Statistics meals={meals} onDateSelect={(d) => { setSelectedDate(d); setCurrentView('main'); }} />
        )}
      </main>

      {!isAdmin && <button onClick={() => setIsAdminLoginOpen(true)} className="fixed bottom-6 right-6 w-12 h-12 bg-white text-indigo-600 rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 border-2 border-indigo-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></button>}

      {isInputOpen && <MealInputForm isOpen={isInputOpen} onClose={() => { setIsInputOpen(false); setEditMealTarget(null); }} selectedDate={selectedDate} prefilledType={prefilledType} editTarget={editMealTarget} ingredients={ingredients} meals={meals} isAdmin={isAdmin} onSave={onSaveMeal} onDelete={onDeleteMeal} trialMessage={TRIAL_MESSAGE} />}
      {isDiaryOpen && <DiaryModal isOpen={isDiaryOpen} onClose={() => setIsDiaryOpen(false)} selectedDate={selectedDate} diary={currentDiary} onSave={onSaveDiary} isAdmin={isAdmin} />}
      {adviceModalOpen && <AIAdviceModal isOpen={adviceModalOpen} onClose={() => setAdviceModalOpen(false)} currentKcal={summary.actual.kcal} currentProtein={summary.actual.protein} />}
      {isAdminLoginOpen && <AdminLoginModal isOpen={isAdminLoginOpen} onClose={() => setIsAdminLoginOpen(false)} onLogin={handleLogin} />}
      {isExitModalOpen && <ExitModal isOpen={isExitModalOpen} onClose={() => { setIsExitModalOpen(false); window.history.pushState({ noBackExitsApp: true }, ''); }} />}
    </div>
  );
};

export default App;
