
import React, { useMemo } from 'react';
import { MealRecord, Ingredient, MealType } from '../types';

interface Props {
  type: MealType;
  meals: MealRecord[];
  ingredients: Ingredient[];
  onAdd: () => void;
}

const MealSection: React.FC<Props> = ({ type, meals, ingredients, onAdd }) => {
  /**
   * 식재료 UUID를 통해 이름을 찾습니다.
   * 데이터 타입이 다르거나 공백이 있을 경우를 대비해 엄격하게 처리합니다.
   */
  const getIngredientName = (uuid: any) => {
    if (!uuid) return '식재료 정보 없음';
    if (!ingredients || ingredients.length === 0) return '로딩 중...';
    
    const targetUuid = String(uuid).trim();
    const found = ingredients.find(i => String(i.uuid).trim() === targetUuid);
    
    return found ? found.name : '알 수 없는 식재료';
  };

  /**
   * 현재 섹션의 단백질 총합을 계산합니다.
   */
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
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
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
            <div key={meal.uuid} className={`bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 ${meal.pending ? 'opacity-50 grayscale border-gray-300' : 'border-indigo-500'}`}>
              <div>
                <p className="font-bold text-sm text-gray-800">{getIngredientName(meal.ingredient_uuid)}</p>
                <p className="text-xs text-gray-500">{meal.amount}g • {meal.time}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600">{Math.round(meal.kcal)} kcal</p>
                <div className="flex space-x-2 text-[10px] text-gray-400">
                  <span>탄 {Math.round(meal.carbs || 0)}</span>
                  <span>단 {Math.round(meal.protein || 0)}</span>
                  <span>지 {Math.round(meal.fat || 0)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MealSection;
