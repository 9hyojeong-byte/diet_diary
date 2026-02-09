
import React, { useState, useMemo } from 'react';
import { MealRecord, HealthDiary } from '../types';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  meals: MealRecord[];
  diaries: HealthDiary[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate, meals, diaries }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const toLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [viewMonth, setViewMonth] = useState(parseLocalDate(selectedDate));

  const getKSTToday = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[0];
  };

  const todayStr = getKSTToday();
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  const mealDates = useMemo(() => {
    const dates = new Set<string>();
    meals.forEach(m => {
      if (m.date) dates.add(String(m.date).split('T')[0]);
    });
    return dates;
  }, [meals]);

  const diaryDates = useMemo(() => {
    const dates = new Set<string>();
    diaries.forEach(d => {
      if (d.date) dates.add(String(d.date).split('T')[0]);
    });
    return dates;
  }, [diaries]);

  const currentWeek = useMemo(() => {
    const curr = parseLocalDate(selectedDate);
    const day = curr.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(curr);
      d.setDate(curr.getDate() - diffToMonday + i);
      return toLocalDateString(d);
    });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayIdx = (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDayIdx);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return toLocalDateString(d);
    });
  }, [viewMonth]);

  const changeMonth = (offset: number) => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + offset, 1);
    setViewMonth(next);
  };

  const handleGoToday = () => {
    const today = getKSTToday();
    onSelectDate(today);
    setViewMonth(parseLocalDate(today));
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      <div className="flex justify-between items-center p-4 pb-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 group"
        >
          <span className="text-lg font-black text-gray-800">
            {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleGoToday}
            className="text-[10px] font-black px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
          >
            TODAY
          </button>
          
          {isExpanded && (
            <div className="flex space-x-1">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 px-4 text-center">
        {weekDays.map(d => (
          <span key={d} className="text-[10px] font-bold text-gray-300 py-1 uppercase">{d}</span>
        ))}
      </div>

      <div className={`px-4 pb-4 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-20 opacity-100'}`}>
        <div className="grid grid-cols-7 gap-1 mt-1">
          {(isExpanded ? monthDays : currentWeek).map((date) => {
            const d = parseLocalDate(date);
            const isSelected = date === selectedDate;
            const isToday = date === todayStr;
            const hasMeal = mealDates.has(date);
            const hasDiary = diaryDates.has(date);
            const isCurrentMonth = d.getMonth() === viewMonth.getMonth();
            const dayNum = d.getDate();

            return (
              <button
                key={date}
                onClick={() => {
                  onSelectDate(date);
                  if (!isExpanded) {
                    setViewMonth(parseLocalDate(date));
                  }
                }}
                className={`
                  relative flex flex-col items-center justify-center py-2 rounded-2xl transition-all h-12
                  ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105 z-10' : 'hover:bg-gray-50'}
                  ${!isSelected && isToday ? 'bg-indigo-50 text-indigo-600' : ''}
                  ${isExpanded && !isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                `}
              >
                <span className={`text-sm font-bold ${isSelected ? 'text-white' : isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                  {dayNum}
                </span>
                <div className="absolute bottom-1.5 flex space-x-0.5">
                  {hasMeal && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></span>
                  )}
                  {hasDiary && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-emerald-200' : 'bg-emerald-500'}`}></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
