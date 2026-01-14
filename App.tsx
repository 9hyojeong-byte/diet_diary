
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MealRecord, Ingredient, MealType } from './types';
import Calendar from './components/Calendar';
import DailySummaryView from './components/DailySummary';
import MealSection from './components/MealSection';
import MealInputForm from './components/MealInputForm';
import AIAdviceModal from './components/AIAdviceModal';
import { fetchInitialData, saveMealToGAS, saveIngredientToGAS, updateMealInGAS, deleteMealFromGAS } from './services/gasService';

const App: React.FC = () => {
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
  const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);
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

  const handleAddMeal = useCallback((type: MealType) => {
    setPrefilledType(type);
    setEditingMeal(null);
    setIsInputOpen(true);
  }, []);

  const handleEditMeal = useCallback((meal: MealRecord) => {
    setEditingMeal(meal);
    setPrefilledType(meal.type);
    setIsInputOpen(true);
  }, []);

  const onSaveMeal = useCallback(async (newMeal: MealRecord) => {
    const isUpdate = !!editingMeal;
    
    if (isUpdate) {
      setMeals(prev => prev.map(m => m.uuid === newMeal.uuid ? { ...newMeal, pending: true } : m));
      const success = await updateMealInGAS(newMeal);
      if (success) setMeals(prev => prev.map(m => m.uuid === newMeal.uuid ? { ...m, pending: false } : m));
    } else {
      setMeals(prev => [...prev, { ...newMeal, pending: true }]);
      const success = await saveMealToGAS(newMeal);
      if (success) setMeals(prev => prev.map(m => m.uuid === newMeal.uuid ? { ...m, pending: false } : m));
    }
  }, [editingMeal]);

  const onSaveIngredient = useCallback(async (newIngredient: Ingredient) => {
    setIngredients(prev => [...prev, newIngredient]);
    try {
      await saveIngredientToGAS(newIngredient);
    } catch (error) {
      console.error("Failed to sync ingredient", error);
    }
  }, []);

  const onDeleteMeal = useCallback(async (uuid: string) => {
    if (!window.confirm("정말 이 식단 기록을 삭제하시겠습니까?")) return;
    setMeals(prev => prev.filter(m => m.uuid !== uuid));
    await deleteMealFromGAS(uuid);
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
      <header className="bg-indigo-600 text-white p-4 sticky top-0 z-20 shadow-md">
        <h1 className="text-xl font-bold">효정님의 식단 일기</h1>
      </header>

      <main className="p-4 space-y-6">
        <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} meals={meals} />
        <DailySummaryView summary={summary} selectedDate={selectedDate} />

        <div className="space-y-4">
          {[MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER].map(type => (
            <MealSection 
              key={type} 
              type={type} 
              meals={filteredMeals.filter(m => m.type === type)} 
              ingredients={ingredients}
              onAdd={() => handleAddMeal(type)}
              onEdit={handleEditMeal}
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
          onClose={() => { setIsInputOpen(false); setEditingMeal(null); }}
          selectedDate={selectedDate}
          prefilledType={prefilledType}
          editingMeal={editingMeal}
          ingredients={ingredients}
          onSave={onSaveMeal}
          onSaveIngredient={onSaveIngredient}
          onDelete={onDeleteMeal}
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
