
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
import { 
  fetchInitialData, 
  saveMealToGAS, 
  updateMealInGAS, 
  saveIngredientToGAS, 
  updateIngredientInGAS,
  deleteIngredientFromGAS,
  updateIngredientBookmark 
} from './services/gasService';

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
      setIsExitModalOpen(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSidebarOpen, isInputOpen, adviceModalOpen]);

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
  }, [meals]);

  const handleSetMealStatus = useCallback(async (uuid: string, status: MealStatus) => {
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
  }, [meals]);

  const onDeleteMeal = useCallback(async (uuid: string): Promise<boolean> => {
    const target = meals.find(m => String(m.uuid) === String(uuid));
    if (!target) return false;
    const previousMeals = [...meals];
    
    // UI 낙관적 업데이트: 상태를 CANCELED로 변경 (filteredMeals에서 즉시 사라짐)
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
  }, [meals]);

  const handleToggleBookmark = useCallback(async (uuid: string) => {
    const target = ingredients.find(i => String(i.uuid) === String(uuid));
    if (!target) return;
    const nextState = !target.is_bookmarked;
    setIngredients(prev => prev.map(i => String(i.uuid) === String(uuid) ? { ...i, is_bookmarked: nextState } : i));
    try {
      await updateIngredientBookmark(uuid, nextState);
    } catch (err) {
      setIngredients(prev => prev.map(i => String(i.uuid) === String(uuid) ? { ...i, is_bookmarked: !nextState } : i));
    }
  }, [ingredients]);

  const handleAddIngredient = useCallback((ing: Ingredient) => {
    setIngredients(prev => [...prev, ing]);
    saveIngredientToGAS(ing);
  }, []);

  const handleUpdateIngredient = useCallback(async (ing: Ingredient) => {
    setIngredients(prev => prev.map(i => String(i.uuid) === String(ing.uuid) ? ing : i));
    try {
      await updateIngredientInGAS(ing);
    } catch (err) {
      console.error("Update ingredient failed", err);
    }
  }, []);

  const handleDeleteIngredient = useCallback(async (uuid: string) => {
    const previous = [...ingredients];
    setIngredients(prev => prev.filter(i => String(i.uuid) !== String(uuid)));
    try {
      const success = await deleteIngredientFromGAS(uuid);
      if (!success) setIngredients(previous);
    } catch (err) {
      setIngredients(previous);
    }
  }, [ingredients]);

  const handleOpenQuickInput = () => {
    setEditMealTarget(null);
    setPrefilledType(null);
    setSelectedDate(getKSTDate());
    setIsInputOpen(true);
  };

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
    <div className="max-w-md mx-auto min-h-screen pb-24 relative bg-gray-50 shadow-2xl">
      <header className="bg-indigo-600 text-white p-4 sticky top-0 z-50 shadow-lg flex items-center">
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
      </header>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onNavigate={setCurrentView}
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
                  onAdd={() => {
                    setEditMealTarget(null);
                    setPrefilledType(type);
                    setIsInputOpen(true);
                  }}
                  onEdit={(meal) => {
                    setEditMealTarget(meal);
                    setIsInputOpen(true);
                  }}
                  onDelete={onDeleteMeal}
                  onSetStatus={handleSetMealStatus}
                />
              ))}
            </div>

            <button 
              onClick={() => setAdviceModalOpen(true)}
              className="w-full mt-8 py-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <span className="text-xl">✨</span>
              <span>AI 영양 추천 받기</span>
            </button>
          </div>
        ) : currentView === 'ingredients' ? (
          <IngredientManagement 
            ingredients={ingredients}
            onToggleBookmark={handleToggleBookmark}
            onAddIngredient={handleAddIngredient}
            onUpdateIngredient={handleUpdateIngredient}
            onDeleteIngredient={handleDeleteIngredient}
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

      {currentView === 'main' && (
        <button 
          onClick={handleOpenQuickInput}
          className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 hover:scale-105 transition-all animate-in zoom-in slide-in-from-bottom-10 duration-500"
          aria-label="식단 추가"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
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
          onSave={onSaveMeal}
          onDelete={onDeleteMeal}
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
