
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MealRecord, Ingredient, MealType } from './types';
import Calendar from './components/Calendar';
import DailySummaryView from './components/DailySummary';
import MealSection from './components/MealSection';
import MealInputForm from './components/MealInputForm';
import AIAdviceModal from './components/AIAdviceModal';
import Sidebar from './components/Sidebar';
import IngredientManagement from './components/IngredientManagement';
import { fetchInitialData, saveMealToGAS, saveIngredientToGAS, updateIngredientBookmark } from './services/gasService';

const App: React.FC = () => {
  const getKSTDate = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[0];
  };

  const [currentView, setCurrentView] = useState<'main' | 'ingredients'>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getKSTDate());
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [prefilledType, setPrefilledType] = useState<MealType | null>(null);
  const [adviceModalOpen, setAdviceModalOpen] = useState(false);

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
    return meals.filter(m => String(m.date).startsWith(selectedDate));
  }, [meals, selectedDate]);

  const summary = useMemo(() => {
    return filteredMeals.reduce((acc, cur) => ({
      kcal: acc.kcal + (Number(cur.kcal) || 0),
      carbs: acc.carbs + (Number(cur.carbs) || 0),
      protein: acc.protein + (Number(cur.protein) || 0),
      fat: acc.fat + (Number(cur.fat) || 0),
    }), { kcal: 0, carbs: 0, protein: 0, fat: 0 });
  }, [filteredMeals]);

  const onSaveMeal = useCallback(async (newMeal: MealRecord, newIngredient?: Ingredient) => {
    const optimisticMeal = { ...newMeal, pending: true };
    setMeals(prev => [...prev, optimisticMeal]);
    
    if (newIngredient) {
      setIngredients(prev => [...prev, newIngredient]);
      saveIngredientToGAS(newIngredient).catch(err => console.error("Sync ingredient failed", err));
    }

    try {
      const success = await saveMealToGAS(newMeal);
      if (success) {
        setMeals(prev => prev.map(m => m.uuid === newMeal.uuid ? { ...m, pending: false } : m));
      }
    } catch (error) {
      console.error("Sync meal failed", error);
    }
  }, []);

  const handleToggleBookmark = useCallback(async (uuid: string) => {
    const target = ingredients.find(i => i.uuid === uuid);
    if (!target) return;

    const nextState = !target.is_bookmarked;
    // Optimistic UI Update
    setIngredients(prev => prev.map(i => i.uuid === uuid ? { ...i, is_bookmarked: nextState } : i));

    try {
      await updateIngredientBookmark(uuid, nextState);
    } catch (err) {
      console.error("Bookmark toggle failed", err);
      // Revert if failed
      setIngredients(prev => prev.map(i => i.uuid === uuid ? { ...i, is_bookmarked: !nextState } : i));
    }
  }, [ingredients]);

  const handleAddIngredient = useCallback((ing: Ingredient) => {
    setIngredients(prev => [...prev, ing]);
    saveIngredientToGAS(ing).catch(err => console.error("Sync ingredient failed", err));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium tracking-tight">당신의 완벽한 식단을 준비중이에요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 relative bg-gray-50">
      <header className="bg-indigo-600 text-white p-4 sticky top-0 z-10 shadow-lg flex items-center">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="ml-2 text-xl font-bold">
          {currentView === 'main' ? '효정님의 식단 기록' : '식재료 관리'}
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
                    setPrefilledType(type);
                    setIsInputOpen(true);
                  }}
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
        ) : (
          <IngredientManagement 
            ingredients={ingredients}
            onToggleBookmark={handleToggleBookmark}
            onAddIngredient={handleAddIngredient}
          />
        )}
      </main>

      {isInputOpen && (
        <MealInputForm 
          isOpen={isInputOpen}
          onClose={() => setIsInputOpen(false)}
          selectedDate={selectedDate}
          prefilledType={prefilledType}
          ingredients={ingredients}
          onSave={onSaveMeal}
        />
      )}

      {adviceModalOpen && (
        <AIAdviceModal 
          isOpen={adviceModalOpen}
          onClose={() => setAdviceModalOpen(false)}
          currentKcal={summary.kcal}
          currentProtein={summary.protein}
        />
      )}
    </div>
  );
};

export default App;
