
import React, { useMemo, useState } from 'react';
import { MealRecord, MealStatus } from '../types';

interface StatisticsProps {
  meals: MealRecord[];
  onDateSelect?: (date: string) => void;
}

type DisplayFilter = 'all' | 'protein' | 'kcal';

const Statistics: React.FC<StatisticsProps> = ({ meals, onDateSelect }) => {
  const [filter, setFilter] = useState<DisplayFilter>('all');
  
  const TARGET_KCAL = 1500;
  const TARGET_PROTEIN = 100;
  const KCAL_THRESHOLD = 0.2; // 20%

  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  // 실제 섭취 데이터만 필터링 (CANCELED 및 PLANNED 제외)
  const actualMeals = useMemo(() => {
    return meals.filter(m => m.status === MealStatus.ACTUAL);
  }, [meals]);

  const dailyAggregates = useMemo(() => {
    const agg: Record<string, { kcal: number; protein: number; count: number }> = {};
    actualMeals.forEach(m => {
      const date = m.date.split('T')[0];
      if (!agg[date]) agg[date] = { kcal: 0, protein: 0, count: 0 };
      agg[date].kcal += Number(m.kcal) || 0;
      agg[date].protein += Number(m.protein) || 0;
      agg[date].count += 1;
    });
    return agg;
  }, [actualMeals]);

  const monthGrids = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const firstDay = new Date(year, month, 1);
      const firstDayIdx = (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1);
      const lastDay = new Date(year, month + 1, 0).getDate();
      const dates = [];
      for (let p = 0; p < firstDayIdx; p++) dates.push(null);
      for (let day = 1; day <= lastDay; day++) {
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      }
      months.push({ year, month: month + 1, dates });
    }
    return months;
  }, []);

  const getStats = (date: string) => {
    const data = dailyAggregates[date];
    if (!data) return null;
    const isProteinSuccess = data.protein >= TARGET_PROTEIN;
    const isKcalSuccess = 
      data.kcal >= TARGET_KCAL * (1 - KCAL_THRESHOLD) && 
      data.kcal <= TARGET_KCAL * (1 + KCAL_THRESHOLD);
    return { isProteinSuccess, isKcalSuccess, ...data };
  };

  const perfectDaysCount = useMemo(() => {
    return Object.values(dailyAggregates).filter((d: any) => {
      const isProteinSuccess = d.protein >= TARGET_PROTEIN;
      const isKcalSuccess = d.kcal >= TARGET_KCAL * (1 - KCAL_THRESHOLD) && d.kcal <= TARGET_KCAL * (1 + KCAL_THRESHOLD);
      return isProteinSuccess && isKcalSuccess;
    }).length;
  }, [dailyAggregates]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-10">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-100">
        <h3 className="text-sm font-bold opacity-80 mb-1">나의 실제 달성 기록</h3>
        <p className="text-4xl font-black mb-4">{perfectDaysCount} <span className="text-xl font-normal opacity-60 italic">Perfect Days</span></p>
        <div className="flex space-x-4 pt-4 border-t border-white/10 text-sm">
          <p>총 {actualMeals.length}회 섭취</p>
          <p>{Object.keys(dailyAggregates).length}일 기록됨</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {['all', 'protein', 'kcal'].map((f) => (
            <button key={f} onClick={() => setFilter(f as DisplayFilter)} className={`flex-1 py-2 text-xs rounded-xl transition-all font-bold ${filter === f ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>{f === 'all' ? '모두' : f === 'protein' ? '단백질' : '칼로리'}</button>
          ))}
        </div>

        <div className="space-y-8">
          {monthGrids.map(m => (
            <div key={`${m.year}-${m.month}`} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
              <h5 className="text-sm font-black text-gray-800 mb-4">{m.year}년 {m.month}월</h5>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(wd => <span key={wd} className="text-center text-[10px] font-bold text-gray-300 uppercase">{wd}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {m.dates.map((date, idx) => {
                  if (!date) return <div key={`pad-${idx}`} className="aspect-square" />;
                  const stat = getStats(date);
                  const day = parseInt(date.split('-')[2]);
                  return (
                    <div key={date} onClick={() => onDateSelect && onDateSelect(date)} className={`relative aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 ${stat ? 'bg-gray-50/50' : ''}`}>
                      <span className={`text-[11px] font-bold ${stat ? 'text-gray-900' : 'text-gray-300'}`}>{day}</span>
                      {stat && (
                        <div className="flex space-x-0.5 mt-0.5">
                          {(filter === 'all' || filter === 'protein') && <div className={`w-1.5 h-1.5 rounded-full ${stat.isProteinSuccess ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                          {(filter === 'all' || filter === 'kcal') && <div className={`w-1.5 h-1.5 rounded-full ${stat.isKcalSuccess ? 'bg-indigo-500' : 'bg-gray-200'}`} />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
