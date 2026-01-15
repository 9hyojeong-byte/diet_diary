
import React, { useMemo } from 'react';
import { MealRecord, Ingredient, MealType } from '../types';

interface Props {
  type: MealType;
  meals: MealRecord[];
  ingredients: Ingredient[];
  onAdd: () => void;
  onEdit: (meal: MealRecord) => void;
  onDelete: (uuid: string) => void;
}

const MealSection: React.FC<Props> = ({ type, meals, ingredients, onAdd, onEdit, onDelete }) => {
  const getIngredientDisplayName = (meal: MealRecord) => {
    // 1. 식단 기록 자체에 저장된 이름이 있으면 그것을 사용 (일회성 식단 대응)
    if (meal.ingredient_name) return meal.ingredient_name;
    
    // 2. 없으면 UUID로 식재료 목록에서 찾기
    if (!meal.ingredient_uuid) return '식재료 정보 없음';
    const targetUuid = String(meal.ingredient_uuid).trim();
    const found = ingredients.find(i => String(i.uuid).trim() === targetUuid);
    return found ? found.name : '알 수 없는 식재료';
  };

  const totalProtein = useMemo(() => {
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
              단백질 {Math.round(totalProtein)}g
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
            <button 
              key={meal.uuid} 
              onClick={() => onEdit(meal)}
              className={`w-full text-left bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 group active:scale-[0.98] transition-all ${meal.pending ? 'opacity-50 grayscale border-gray-300 cursor-wait' : 'border-indigo-500 hover:border-indigo-600'}`}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="font-bold text-sm text-gray-800">{getIngredientDisplayName(meal)}</p>
                </div>
                <p className="text-xs text-gray-500">{meal.amount}g • {meal.time}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600">{Math.round(meal.kcal)} kcal</p>
                <div className="flex space-x-2 text-[10px] text-gray-400 justify-end">
                  <span>탄 {Math.round(meal.carbs || 0)}</span>
                  <span>단 {Math.round(meal.protein || 0)}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default MealSection;
