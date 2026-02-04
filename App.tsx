
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MealRecord, Ingredient, MealType, MealStatus } from './types';
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
import { 
  fetchInitialData, 
  saveMealToGAS, 
  updateMealInGAS, 
  saveIngredientToGAS, 
  updateIngredientInGAS,
  deleteIngredientFromGAS,
  updateIngredientBookmark 
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

  // 관리자 상태 관리
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  const [currentView, setCurrentView] = useState<'main' | 'ingredients' | 'stats'>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getKSTDate());
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [editMealTarget, setEditMealTarget] = useState<MealRecord | null>(null);
  const [prefilledType, setPrefilledType] = useState<MealType | null>(null);
  const [adviceModalOpen, setAdviceModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  useEffect(() => {
    window.history.pushState({ noBackExitsApp: true }, '');
    const handlePopState = (event: PopStateEvent) => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        window.history.pushState({ noBackExitsApp: true }, '');
        return;
      }
      if (isInputOpen) {
        setIsInputOpen(false);
        window.history.pushState({ noBackExitsApp: true }, '');
        return;
      }
      if (adviceModalOpen) {
        setAdviceModalOpen(false);
        window.history.pushState({ noBackExitsApp: true }, '');
        return;
      }
      if (isAdminLoginOpen) {
        setIsAdminLoginOpen(false);
        window.history.pushState({ noBackExitsApp: true }, '');
        return;
      }
      setIsExitModalOpen(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSidebarOpen, isInputOpen, adviceModalOpen, isAdminLoginOpen]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchInitialData();
        setMeals(data.meals || []);
        setIngredients(data.ingredients || []);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredMeals = useMemo(() => {
    return meals.filter(m => 
      String(m.date).startsWith(selectedDate) && 
      m.status !== MealStatus.CANCELED
    );
  }, [meals, selectedDate]);

  const summary = useMemo(() => {
    const initial = { kcal: 0, carbs: 0, protein: 0, fat: 0 };
    
    const actual = filteredMeals
      .filter(m => m.status === MealStatus.ACTUAL)
      .reduce((acc, cur) => ({
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
    if (!isAdmin) {
      alert(TRIAL_MESSAGE);
      return;
    }
    const isUpdate = meals.some(m => String(m.uuid) === String(newMeal.uuid));
    if (isUpdate) {
      setMeals(prev => prev.map(m => String(m.uuid) === String(newMeal.uuid) ? { ...newMeal, pending: true } : m));
    } else {
      setMeals(prev => [...prev, { ...newMeal, pending: true }]);
    }
    if (newIngredient) {
      setIngredients(prev => [...prev, newIngredient]);
      saveIngredientToGAS(newIngredient);
    }
    try {
      const success = isUpdate ? await updateMealInGAS(newMeal) : await saveMealToGAS(newMeal);
      if (success) {
        setMeals(prev => prev.map(m => String(m.uuid) === String(newMeal.uuid) ? { ...m, pending: false } : m));
      }
    } catch (error) {
      console.error("Meal save/update failed", error);
    }
  }, [meals, isAdmin]);

  const handleSetMealStatus = useCallback(async (uuid: string, status: MealStatus) => {
    if (!isAdmin) {
      alert(TRIAL_MESSAGE);
      return;
    }
    const target = meals.find(m => String(m.uuid) === String(uuid));
    if (!target || target.status === status) return;
    const updatedMeal: MealRecord = { 
      ...target, 
      status,
      time: status === MealStatus.ACTUAL ? getKSTTime() : target.time,
      pending: true 
    };
    setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? updatedMeal : m));
    try {
      const success = await updateMealInGAS(updatedMeal);
      if (success) {
        setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? { ...updatedMeal, pending: false } : m));
      }
    } catch (err) {
      setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? { ...target, pending: false } : m));
    }
  }, [meals, isAdmin]);

  const onDeleteMeal = useCallback(async (uuid: string): Promise<boolean> => {
    if (!isAdmin) {
      alert(TRIAL_MESSAGE);
      return false;
    }
    const target = meals.find(m => String(m.uuid) === String(uuid));
    if (!target) return false;
    const previousMeals = [...meals];
    
    setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? { ...m, status: MealStatus.CANCELED, pending: true } : m));
    
    try {
      const success = await updateMealInGAS({ ...target, status: MealStatus.CANCELED });
      if (success) {
        setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? { ...m, pending: false } : m));
        return true;
      } else {
        setMeals(previousMeals);
        return false;
      }
    } catch (err) {
      setMeals(previousMeals);
      return false;
    }
  }, [meals, isAdmin]);

  const handleToggleBookmark = useCallback(async (uuid: string) => {
    if (!isAdmin) {
      alert(TRIAL_MESSAGE);
      return;
    }
    const target = ingredients.find(i => String(i.uuid) === String(uuid));
    if (!target) return;
    const nextState = !target.is_bookmarked;
    setIngredients(prev => prev.map(i => String(i.uuid) === String(uuid) ? { ...i, is_bookmarked: nextState } : i));
    try {
      await updateIngredientBookmark(uuid, nextState);
    } catch (err) {
      setIngredients(prev => prev.map(i => String(i.uuid) === String(uuid) ? { ...i, is_bookmarked: !nextState } : i));
    }
  }, [ingredients, isAdmin]);

  const handleAddIngredient = useCallback((ing: Ingredient) => {
    if (!isAdmin) {
      alert(TRIAL_MESSAGE);
      return;
    }
    setIngredients(prev => [...prev, ing]);
    saveIngredientToGAS(ing);
  }, [isAdmin]);

  const handleUpdateIngredient = useCallback(async (ing: Ingredient) => {
    if (!isAdmin) {
      alert(TRIAL_MESSAGE);
      return;
    }
    setIngredients(prev => prev.map(i => String(i.uuid) === String(ing.uuid) ? ing : i));
    try {
      await updateIngredientInGAS(ing);
    } catch (err) {
      console.error("Update ingredient failed", err);
    }
  }, [isAdmin]);

  const handleDeleteIngredient = useCallback(async (uuid: string) => {
    if (!isAdmin) {
      alert(TRIAL_MESSAGE);
      return;
    }
    const previous = [...ingredients];
    setIngredients(prev => prev.filter(i => String(i.uuid) !== String(uuid)));
    try {
      const success = await deleteIngredientFromGAS(uuid);
      if (!success) setIngredients(previous);
    } catch (err) {
      setIngredients(previous);
    }
  }, [ingredients, isAdmin]);

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  const handleCopyDiet = useCallback(() => {
    const actualMeals = filteredMeals
      .filter(m => m.status === MealStatus.ACTUAL)
      .sort((a, b) => {
        const padTime = (t: string) => {
          if (!t.includes(':')) return t;
          const [h, m] = t.split(':');
          return `${h.padStart(2, '0')}:${m}`;
        };
        return padTime(a.time).localeCompare(padTime(b.time));
      });

    if (actualMeals.length === 0) {
      alert("오늘 완료된 식단 기록이 없습니다.");
      return;
    }

    let text = `[${selectedDate} 식단 기록]\n\n`;
    actualMeals.forEach((meal, idx) => {
      text += `${idx + 1}. ${meal.type} (${meal.time})\n`;
      text += `- 메뉴: ${meal.ingredient_name || '식재료 정보 없음'}\n`;
      text += `- 열량: ${Math.round(meal.kcal)} kcal\n`;
      text += `- 탄수화물: ${Math.round(meal.carbs)}g\n`;
      text += `- 단백질: ${Math.round(meal.protein)}g\n`;
      text += `- 지방: ${Math.round(meal.fat)}g\n\n`;
    });

    text += `총 섭취: ${Math.round(summary.actual.kcal)} kcal\n`;
    text += `(탄 ${Math.round(summary.actual.carbs)}g, 단 ${Math.round(summary.actual.protein)}g, 지 ${Math.round(summary.actual.fat)}g)`;

    navigator.clipboard.writeText(text).then(() => {
      alert("식단 기록이 클립보드에 복사되었습니다! 📋");
    }).catch(err => {
      console.error("Copy failed", err);
      alert("복사에 실패했습니다.");
    });
  }, [filteredMeals, selectedDate, summary]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium tracking-tight">당신의 기록을 불러오고 있어요</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto min-h-screen pb-24 relative bg-gray-50 shadow-2xl transition-all ${!isAdmin ? 'ring-4 ring-orange-200 ring-inset' : ''}`}>
      {!isAdmin && (
        <div className="bg-orange-500 text-white text-[10px] font-black text-center py-1 uppercase tracking-widest sticky top-0 z-[60]">
          체험 모드로 접속 중입니다
        </div>
      )}
      <header className={`bg-indigo-600 text-white p-4 sticky ${!isAdmin ? 'top-6' : 'top-0'} z-50 shadow-lg flex items-center justify-between`}>
        <div className="flex items-center">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="ml-2 text-xl font-bold">
            {currentView === 'main' ? '쿠쿠님의 식단 기록' : currentView === 'ingredients' ? '식재료 관리' : '나의 통계'}
          </h1>
        </div>
        {isAdmin && (
          <div className="bg-white/20 px-3 py-1 rounded-full flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black tracking-widest">ADMIN</span>
          </div>
        )}
      </header>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onNavigate={setCurrentView}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      <main className="p-4">
        {currentView === 'main' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Calendar 
              selectedDate={selectedDate} 
              onSelectDate={setSelectedDate} 
              meals={meals}
            />
            
            <DailySummaryView summary={summary} selectedDate={selectedDate} />

            <div className="space-y-4">
              {[MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER].map(type => (
                <MealSection 
                  key={type} 
                  type={type} 
                  meals={filteredMeals.filter(m => m.type === type)} 
                  ingredients={ingredients}
                  isAdmin={isAdmin}
                  onAdd={() => {
                    if (!isAdmin) {
                      alert(TRIAL_MESSAGE);
                      return;
                    }
                    setEditMealTarget(null);
                    setPrefilledType(type);
                    setIsInputOpen(true);
                  }}
                  onEdit={(meal) => {
                    if (!isAdmin) {
                      alert(TRIAL_MESSAGE);
                      return;
                    }
                    setEditMealTarget(meal);
                    setIsInputOpen(true);
                  }}
                  onDelete={onDeleteMeal}
                  onSetStatus={handleSetMealStatus}
                />
              ))}
            </div>

            <div className="pt-2 space-y-3">
              <button 
                onClick={() => setAdviceModalOpen(true)}
                className="w-full py-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <span className="text-xl">✨</span>
                <span>AI 영양 추천 받기</span>
              </button>
              
              <button 
                onClick={handleCopyDiet}
                className="w-full py-4 bg-white text-indigo-600 border-2 border-indigo-50 font-black rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <span className="text-xl">📋</span>
                <span>식단 복사하기</span>
              </button>
            </div>
          </div>
        ) : currentView === 'ingredients' ? (
          <IngredientManagement 
            ingredients={ingredients}
            isAdmin={isAdmin}
            onToggleBookmark={handleToggleBookmark}
            onAddIngredient={handleAddIngredient}
            onUpdateIngredient={handleUpdateIngredient}
            onDeleteIngredient={handleDeleteIngredient}
            trialMessage={TRIAL_MESSAGE}
          />
        ) : (
          <Statistics 
            meals={meals} 
            onDateSelect={(date) => {
              setSelectedDate(date);
              setCurrentView('main');
            }} 
          />
        )}
      </main>

      {/* 관리자 로그인 버튼 (FAB) */}
      {!isAdmin && (
        <button 
          onClick={() => setIsAdminLoginOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-white text-indigo-600 rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 border-2 border-indigo-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      )}

      {isInputOpen && (
        <MealInputForm 
          isOpen={isInputOpen}
          onClose={() => {
            setIsInputOpen(false);
            setEditMealTarget(null);
          }}
          selectedDate={selectedDate}
          prefilledType={prefilledType}
          editTarget={editMealTarget}
          ingredients={ingredients}
          meals={meals}
          isAdmin={isAdmin}
          onSave={onSaveMeal}
          onDelete={onDeleteMeal}
          trialMessage={TRIAL_MESSAGE}
        />
      )}

      {adviceModalOpen && (
        <AIAdviceModal 
          isOpen={adviceModalOpen}
          onClose={() => setAdviceModalOpen(false)}
          currentKcal={summary.actual.kcal}
          currentProtein={summary.actual.protein}
        />
      )}

      {isAdminLoginOpen && (
        <AdminLoginModal 
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onLogin={handleLogin}
        />
      )}

      {isExitModalOpen && (
        <ExitModal 
          isOpen={isExitModalOpen}
          onClose={() => {
            setIsExitModalOpen(false);
            window.history.pushState({ noBackExitsApp: true }, '');
          }}
        />
      )}
    </div>
  );
};

export default App;
