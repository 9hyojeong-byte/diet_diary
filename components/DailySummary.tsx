
import React, { useState } from 'react';
import { DailySummary, NutrientTargets } from '../types';

interface Props {
  summary: DailySummary;
  selectedDate: string;
  targets: NutrientTargets;
  onUpdateTargets: (targets: NutrientTargets) => void;
  isAdmin: boolean;
}

const DailySummaryView: React.FC<Props> = ({ summary, selectedDate, targets, onUpdateTargets, isAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<NutrientTargets>(targets);

  const getKSTToday = () => {
    const now = new Date();
    const kstValue = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kstValue.toISOString().split('T')[0];
  };

  const isToday = selectedDate === getKSTToday();
  
  const titleDate = isToday 
    ? "오늘" 
    : (() => {
        const [y, m, d] = selectedDate.split('-');
        return `${parseInt(m)}월 ${parseInt(d)}일`;
      })();

  const kcalProgress = Math.min((summary.actual.kcal / targets.kcal) * 100, 100);

  const handleSave = () => {
    onUpdateTargets(editValues);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/30 p-6 space-y-5 border border-indigo-50/50">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-gray-400 text-xs font-black uppercase tracking-wider">{titleDate} 섭취 칼로리</h3>
            {isAdmin && !isEditing && (
              <button 
                onClick={() => { setEditValues(targets); setIsEditing(true); }}
                className="p-1 text-gray-300 hover:text-indigo-500 transition-colors"
                title="목표 수정"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-4xl font-black text-gray-900 tracking-tight">
              {Math.round(summary.actual.kcal)}
              <span className="text-sm font-bold text-gray-300 ml-2">({Math.round(summary.planned.kcal)})</span>
            </p>
            {isEditing ? (
              <div className="flex items-center space-x-1">
                <input 
                  type="number" 
                  value={editValues.kcal}
                  onChange={e => setEditValues({ ...editValues, kcal: Number(e.target.value) })}
                  className="w-16 px-1 py-0.5 border-b-2 border-indigo-500 focus:outline-none font-bold text-indigo-600 bg-indigo-50/50 rounded-t-md"
                />
                <span className="text-xs font-bold text-gray-400">kcal</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-300">/ {targets.kcal} kcal</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-1 shadow-sm ${kcalProgress > 100 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
            {kcalProgress > 100 ? 'Warning' : 'Good Progress'}
          </div>
          <p className="text-2xl font-black text-indigo-600">{Math.round(kcalProgress)}%</p>
        </div>
      </div>

      <div className="relative w-full bg-gray-100 h-3 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-700 ease-out rounded-full ${kcalProgress > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
          style={{ width: `${kcalProgress}%` }}
        />
        {summary.planned.kcal > summary.actual.kcal && (
          <div 
            className="absolute top-0 bottom-0 bg-indigo-300/30 transition-all duration-700 ease-out"
            style={{ 
              left: `${kcalProgress}%`, 
              width: `${Math.min(((summary.planned.kcal - summary.actual.kcal) / targets.kcal) * 100, 100 - kcalProgress)}%` 
            }}
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2">
        <NutrientBadge 
          label="탄수화물" 
          value={summary.actual.carbs} 
          planned={summary.planned.carbs}
          target={targets.carbs} 
          color="indigo"
          isEditing={isEditing}
          editValue={editValues.carbs}
          onEditChange={v => setEditValues({ ...editValues, carbs: v })}
        />
        <NutrientBadge 
          label="단백질" 
          value={summary.actual.protein} 
          planned={summary.planned.protein}
          target={targets.protein} 
          color="emerald"
          isEditing={isEditing}
          editValue={editValues.protein}
          onEditChange={v => setEditValues({ ...editValues, protein: v })}
        />
        <NutrientBadge 
          label="지방" 
          value={summary.actual.fat} 
          planned={summary.planned.fat}
          target={targets.fat} 
          color="orange"
          isEditing={isEditing}
          editValue={editValues.fat}
          onEditChange={v => setEditValues({ ...editValues, fat: v })}
        />
      </div>

      {isEditing && (
        <div className="flex space-x-2 pt-2">
          <button 
            onClick={handleSave}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all"
          >
            저장하기
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
};

interface BadgeProps {
  label: string;
  value: number;
  planned: number;
  target: number;
  color: 'indigo' | 'emerald' | 'orange';
  isEditing: boolean;
  editValue: number;
  onEditChange: (v: number) => void;
}

const NutrientBadge: React.FC<BadgeProps> = ({ 
  label, value, planned, target, color, isEditing, editValue, onEditChange 
}) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: 'bg-indigo-400' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-400' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', dot: 'bg-orange-400' }
  };

  const style = colorMap[color];

  return (
    <div className={`p-3 rounded-2xl border transition-all ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400">{label}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></div>
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-baseline space-x-1">
          <span className={`text-lg font-black ${style.text}`}>{Math.round(value)}</span>
          <span className="text-[10px] font-bold text-gray-400">g</span>
          <span className="text-[9px] font-medium text-gray-300 ml-1">({Math.round(planned)}g)</span>
        </div>
        
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-black/5">
          <div />
          {isEditing ? (
            <div className="flex items-center">
              <span className="text-[8px] mr-0.5 text-gray-300">목표</span>
              <input 
                type="number"
                value={editValue}
                onChange={e => onEditChange(Number(e.target.value))}
                className="w-10 text-[10px] font-black bg-white/50 border-b border-indigo-400 focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-0.5">
              <span className="text-[8px] text-gray-300 group-hover:text-gray-400">target</span>
              <span className="text-[10px] font-black text-gray-500">{target}g</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailySummaryView;
