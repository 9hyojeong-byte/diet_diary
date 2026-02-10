
import React, { useMemo, useRef } from 'react';
import { MealRecord, Ingredient, MealType, MealStatus } from '../types';

interface Props {
  type: MealType;
  meals: MealRecord[];
  ingredients: Ingredient[];
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (meal: MealRecord) => void;
  onDelete: (uuid: string) => Promise<boolean>;
  onSetStatus: (uuid: string, status: MealStatus) => void;
}

const MealSection: React.FC<Props> = ({ type, meals, ingredients, isAdmin, onAdd, onEdit, onDelete, onSetStatus }) => {
  const getIngredientDisplayName = (meal: MealRecord) => {
    if (meal.ingredient_name) return meal.ingredient_name;
    if (!meal.ingredient_uuid) return '식재료 정보 없음';
    const targetUuid = String(meal.ingredient_uuid).trim();
    const found = ingredients.find(i => String(i.uuid).trim() === targetUuid);
    return found ? found.name : '알 수 없는 식재료';
  };

  const totalProteinActual = useMemo(() => {
    return meals
      .filter(m => m.status === MealStatus.ACTUAL)
      .reduce((sum, meal) => sum + (Number(meal.protein) || 0), 0);
  }, [meals]);

  const totalProteinPlanned = useMemo(() => {
    return meals.reduce((sum, meal) => sum + (Number(meal.protein) || 0), 0);
  }, [meals]);

  // 시간을 기준으로 정렬된 식단 목록
  const sortedMeals = useMemo(() => {
    return [...meals].sort((a, b) => a.time.localeCompare(b.time));
  }, [meals]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center space-x-2">
          <h4 className="font-bold text-gray-700 flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${
              type === MealType.BREAKFAST ? 'bg-amber-400' :
              type === MealType.LUNCH ? 'bg-green-400' :
              type === MealType.SNACK ? 'bg-pink-400' : 'bg-indigo-400'
            }`} />
            {type}
          </h4>
          {meals.length > 0 && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              단백질 {Math.round(totalProteinActual)}g <span className="opacity-60">({Math.round(totalProteinPlanned)}g)</span>
            </span>
          )}
        </div>
        <button 
          onClick={onAdd}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {sortedMeals.length === 0 ? (
          <div className="bg-white/50 border border-dashed border-gray-200 p-4 rounded-xl text-center text-xs text-gray-400 italic">
            기록된 {type}이 없습니다.
          </div>
        ) : (
          sortedMeals.map(meal => (
            <SwipeableMealCard 
              key={meal.uuid} 
              meal={meal} 
              displayName={getIngredientDisplayName(meal)}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onSetStatus={onSetStatus}
            />
          ))
        )}
      </div>
    </div>
  );
};

const SwipeableMealCard: React.FC<{ 
  meal: MealRecord; 
  displayName: string;
  isAdmin: boolean;
  onEdit: (meal: MealRecord) => void;
  onSetStatus: (uuid: string, status: MealStatus) => void;
}> = ({ meal, displayName, isAdmin, onEdit, onSetStatus }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const bgActualRef = useRef<HTMLDivElement>(null);
  const bgPlannedRef = useRef<HTMLDivElement>(null);
  
  const startX = useRef(0);
  const currentDiff = useRef(0);
  const isDragging = useRef(false);
  const threshold = 80;

  const updateStyles = (diff: number) => {
    if (!cardRef.current) return;
    const dragX = diff * 0.6;
    cardRef.current.style.transform = `translate3d(${dragX}px, 0, 0)`;
    
    if (bgActualRef.current) {
      const opacity = Math.min(Math.max(dragX / 60, 0), 1);
      bgActualRef.current.style.opacity = opacity.toString();
    }
    if (bgPlannedRef.current) {
      const opacity = Math.min(Math.max(-dragX / 60, 0), 1);
      bgPlannedRef.current.style.opacity = opacity.toString();
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isAdmin) return;
    if (meal.pending) return;
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    if (cardRef.current) cardRef.current.style.transition = 'none';
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isAdmin || !isDragging.current) return;
    currentDiff.current = e.touches[0].clientX - startX.current;
    requestAnimationFrame(() => updateStyles(currentDiff.current));
  };

  const onTouchEnd = () => {
    if (!isAdmin || !isDragging.current) return;
    isDragging.current = false;
    const dragX = currentDiff.current * 0.6;
    
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      cardRef.current.style.transform = `translate3d(0, 0, 0)`;
    }
    if (bgActualRef.current) bgActualRef.current.style.opacity = '0';
    if (bgPlannedRef.current) bgPlannedRef.current.style.opacity = '0';

    if (dragX > threshold) onSetStatus(meal.uuid, MealStatus.ACTUAL);
    else if (dragX < -threshold) onSetStatus(meal.uuid, MealStatus.PLANNED);
    currentDiff.current = 0;
  };

  const isPlanned = meal.status === MealStatus.PLANNED;
  const isDirectEntry = meal.ingredient_uuid === 'direct-entry';

  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-100 touch-pan-y">
      <div className="absolute inset-0 flex items-center justify-between px-6 z-0 pointer-events-none">
        <div ref={bgActualRef} className="opacity-0 flex items-center space-x-2">
          <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          </div>
        </div>
        <div ref={bgPlannedRef} className="opacity-0 flex items-center space-x-2">
          <div className="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center text-white">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" /></svg>
          </div>
        </div>
      </div>

      <div 
        ref={cardRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => onEdit(meal)}
        className={`relative z-10 flex-1 p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 transition-all ${
          meal.pending ? 'opacity-50 grayscale border-gray-300 cursor-wait' : 
          isPlanned ? 'bg-gray-50 border-gray-300 border-dashed' : 'bg-white border-indigo-500 hover:border-indigo-600'
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 overflow-hidden">
            <p className={`font-bold text-sm truncate ${isPlanned ? 'text-gray-400 italic' : 'text-gray-800'}`}>
              {displayName}
            </p>
            {isDirectEntry && (
              <span className="shrink-0 text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter">임의입력</span>
            )}
            {isPlanned && (
              <span className="shrink-0 text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter">Planned</span>
            )}
          </div>
          <p className="text-xs text-gray-400 font-medium">{meal.amount}g • {meal.time}</p>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className={`font-black tracking-tight ${isPlanned ? 'text-gray-300' : 'text-indigo-600'}`}>
            {Math.round(meal.kcal)} <span className="text-[9px] font-bold ml-0.5">kcal</span>
          </p>
          <div className="flex items-center space-x-1 text-[9px] text-gray-400 justify-end font-bold">
            <span className={!isPlanned ? 'text-orange-500/80' : ''}>C {Math.round(meal.carbs || 0)}g</span>
            <span className="opacity-30 px-0.5">·</span>
            <span className={!isPlanned ? 'text-emerald-500/80' : ''}>P {Math.round(meal.protein || 0)}g</span>
            <span className="opacity-30 px-0.5">·</span>
            <span className={!isPlanned ? 'text-blue-500/80' : ''}>F {Math.round(meal.fat || 0)}g</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealSection;
