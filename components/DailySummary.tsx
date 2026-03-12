
import React from 'react';
import { DailySummary } from '../types';
import { getTargetKcal } from '../utils';

interface Props {
  summary: DailySummary;
  selectedDate: string;
}

const DailySummaryView: React.FC<Props> = ({ summary, selectedDate }) => {
  const targetKcal = getTargetKcal(selectedDate);
  
  const getKSTToday = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[0];
  };

  const isToday = selectedDate === getKSTToday();
  
  const titleDate = isToday 
    ? "오늘" 
    : (() => {
        const [y, m, d] = selectedDate.split('-');
        return `${parseInt(m)}월 ${parseInt(d)}일`;
      })();

  const kcalProgress = Math.min((summary.actual.kcal / targetKcal) * 100, 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-gray-400 text-sm font-medium">{titleDate} 섭취 칼로리</h3>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-black text-indigo-600">
              {Math.round(summary.actual.kcal)}
              <span className="text-sm font-bold text-gray-400 ml-1">({Math.round(summary.planned.kcal)})</span>
            </p>
            <span className="text-lg font-normal text-gray-400">/ {targetKcal} kcal</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-500">{Math.round(kcalProgress)}%</p>
        </div>
      </div>

      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-indigo-500 h-full transition-all duration-500" 
          style={{ width: `${kcalProgress}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
        <NutrientBadge label="탄수화물" actual={summary.actual.carbs} total={summary.planned.carbs} color="bg-orange-100 text-orange-600" />
        <NutrientBadge label="단백질" actual={summary.actual.protein} total={summary.planned.protein} color="bg-emerald-100 text-emerald-600" />
        <NutrientBadge label="지방" actual={summary.actual.fat} total={summary.planned.fat} color="bg-blue-100 text-blue-600" />
      </div>
    </div>
  );
};

const NutrientBadge: React.FC<{ label: string, actual: number, total: number, color: string }> = ({ label, actual, total, color }) => (
  <div className="flex flex-col items-center">
    <span className="text-[10px] text-gray-400 mb-1">{label}</span>
    <div className={`${color} px-2 py-1.5 rounded-lg font-bold text-xs w-full text-center flex flex-col`}>
      <span>{Math.round(actual)}g</span>
      <span className="text-[9px] opacity-60 font-medium">({Math.round(total)}g)</span>
    </div>
  </div>
);

export default DailySummaryView;
