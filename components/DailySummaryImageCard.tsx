import React from 'react';
import { MealRecord, MealType, MealStatus, Ingredient } from '../types';

interface Props {
  date: string;
  meals: MealRecord[];
  ingredients: Ingredient[];
}

const MEAL_TYPES = [MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER];

const DOT_COLOR: Record<MealType, string> = {
  [MealType.BREAKFAST]: '#fbbf24',
  [MealType.LUNCH]: '#4ade80',
  [MealType.SNACK]: '#f472b6',
  [MealType.DINNER]: '#818cf8'
};

const DailySummaryImageCard = React.forwardRef<HTMLDivElement, Props>(({ date, meals, ingredients }, ref) => {
  const getIngredientDisplayName = (meal: MealRecord) => {
    const targetUuid = String(meal.ingredient_uuid || '').trim();
    if (targetUuid && targetUuid !== 'direct-entry') {
      const found = ingredients.find(i => String(i.uuid).trim() === targetUuid);
      if (found) return found.name;
    }
    if (meal.ingredient_name) return meal.ingredient_name;
    return '식재료 정보 없음';
  };

  const actualMeals = meals.filter(m => m.status === MealStatus.ACTUAL);
  const totalKcal = actualMeals.reduce((sum, m) => sum + (Number(m.kcal) || 0), 0);
  const totalProtein = actualMeals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);

  return (
    <div
      ref={ref}
      style={{
        width: 480,
        padding: 32,
        background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 55%)',
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif",
        color: '#1f2937'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', letterSpacing: 1 }}>쿠쿠님의 식단 기록</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{date}</div>
      </div>

      {MEAL_TYPES.map(type => {
        const typeMeals = actualMeals.filter(m => m.type === type);
        const kcal = typeMeals.reduce((sum, m) => sum + (Number(m.kcal) || 0), 0);
        const protein = typeMeals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
        return (
          <div
            key={type}
            style={{
              marginBottom: 16,
              background: '#ffffff',
              borderRadius: 20,
              padding: 18,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: 15 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: DOT_COLOR[type], marginRight: 8, display: 'inline-block' }} />
                {type}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                {Math.round(kcal)}kcal · 단백질 {Math.round(protein)}g
              </div>
            </div>
            {typeMeals.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '4px 0' }}>기록 없음</div>
            ) : (
              typeMeals.map(m => (
                <div
                  key={m.uuid}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    padding: '6px 0',
                    borderTop: '1px solid #f3f4f6'
                  }}
                >
                  <span style={{ color: '#374151' }}>{getIngredientDisplayName(m)} (수량:{m.amount})</span>
                  <span style={{ fontWeight: 700, color: '#4f46e5' }}>{Math.round(m.kcal)}kcal</span>
                </div>
              ))
            )}
          </div>
        );
      })}

      <div
        style={{
          marginTop: 20,
          background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
          borderRadius: 20,
          padding: 22,
          color: '#ffffff',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, letterSpacing: 1 }}>총 섭취</div>
        <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4 }}>{Math.round(totalKcal)} kcal</div>
        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, opacity: 0.9 }}>단백질 {Math.round(totalProtein)}g</div>
      </div>
    </div>
  );
});

export default DailySummaryImageCard;
