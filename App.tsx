
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MealRecord, Ingredient, MealType } from './types';
import Calendar from './components/Calendar';
import DailySummaryView from './components/DailySummary';
import MealSection from './components/MealSection';
import MealInputForm from './components/MealInputForm';
import AIAdviceModal from './components/AIAdviceModal';
import { fetchInitialData, saveMealToGAS, saveIngredientToGAS } from './services/gasService';

const App: React.FC = () => {
  // 한국 시간 기준으로 오늘 날짜 (YYYY-MM-DD) 가져오기
  const getKSTDate = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getKSTDate());
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [prefilledType, setPrefilledType] = useState<MealType | null>(null);
  const [adviceModalOpen, setAdviceModalOpen] = useState(false);

  // Initial Load
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

  const handleAddMeal = useCallback((type: MealType) => {
    setPrefilledType(type);
    setIsInputOpen(true);
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 relative bg-gray-50">
      <header className="bg-indigo-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">효정님의 식단 일기</h1>
      </header>

      <main className="p-4 space-y-6">
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
              onAdd={() => handleAddMeal(type)}
            />
          ))}
        </div>

        <button 
          onClick={() => setAdviceModalOpen(true)}
          className="w-full mt-8 py-3 bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          ✨ AI 영양 추천 받기
        </button>
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
