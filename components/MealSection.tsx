
import React, { useMemo, useState, useRef } from 'react';
import { MealRecord, Ingredient, MealType, MealStatus } from '../types';

interface Props {
  type: MealType;
  meals: MealRecord[];
  ingredients: Ingredient[];
  onAdd: () => void;
  onEdit: (meal: MealRecord) => void;
  onDelete: (uuid: string) => void;
  onSetStatus: (uuid: string, status: MealStatus) => void;
}

const MealSection: React.FC<Props> = ({ type, meals, ingredients, onAdd, onEdit, onDelete, onSetStatus }) => {
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
        {meals.length === 0 ? (
          <div className="bg-white/50 border border-dashed border-gray-200 p-4 rounded-xl text-center text-xs text-gray-400 italic">
            기록된 {type}이 없습니다.
          </div>
        ) : (
          meals.map(meal => (
            <SwipeableMealCard 
              key={meal.uuid} 
              meal={meal} 
              displayName={getIngredientDisplayName(meal)}
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
  onEdit: (meal: MealRecord) => void;
  onSetStatus: (uuid: string, status: MealStatus) => void;
}> = ({ meal, displayName, onEdit, onSetStatus }) => {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const isSwiping = useRef(false);
  const threshold = 100; // 스와이프 발동 기준

  const onTouchStart = (e: React.TouchEvent) => {
    if (meal.pending) return;
    startX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // 저항감 구현
    setOffsetX(diff * 0.6);
  };

  const onTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;

    if (offsetX > threshold) {
      // 오른쪽 스와이프 -> ACTUAL
      onSetStatus(meal.uuid, MealStatus.ACTUAL);
    } else if (offsetX < -threshold) {
      // 왼쪽 스와이프 -> PLANNED
      onSetStatus(meal.uuid, MealStatus.PLANNED);
    }
    
    setOffsetX(0);
  };

  const isPlanned = meal.status === MealStatus.PLANNED;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-100 group">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6 text-white font-black text-xs uppercase tracking-widest">
        <div className={`flex items-center space-x-2 transition-opacity ${offsetX > 20 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
             </svg>
          </div>
          <span className="text-green-600">실제 섭취</span>
        </div>
        <div className={`flex items-center space-x-2 transition-opacity ${offsetX < -20 ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-gray-500">예정 식단</span>
          <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
             </svg>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => onEdit(meal)}
        style={{ transform: `translateX(${offsetX}px)` }}
        className={`relative z-10 flex-1 text-left p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 transition-all duration-200 cursor-pointer ${
          meal.pending ? 'opacity-50 grayscale border-gray-300 cursor-wait' : 
          isPlanned ? 'bg-gray-50 border-gray-300 border-dashed' : 'bg-white border-indigo-500 hover:border-indigo-600'
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <p className={`font-bold text-sm ${isPlanned ? 'text-gray-400 italic' : 'text-gray-800'}`}>
              {displayName}
              {isPlanned && <span className="ml-2 text-[10px] bg-gray-200 text-gray-500 px-1.5 rounded-sm font-black not-italic uppercase tracking-tighter">Planned</span>}
            </p>
          </div>
          <p className="text-xs text-gray-400">{meal.amount}g • {meal.time}</p>
        </div>
        <div className="text-right">
          <p className={`font-black ${isPlanned ? 'text-gray-300' : 'text-indigo-600'}`}>{Math.round(meal.kcal)} <span className="text-[10px] font-bold opacity-50 ml-0.5">kcal</span></p>
          <div className="flex space-x-2 text-[10px] text-gray-400 justify-end font-medium">
            <span>P {Math.round(meal.protein || 0)}g</span>
            <span>C {Math.round(meal.carbs || 0)}g</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealSection;
