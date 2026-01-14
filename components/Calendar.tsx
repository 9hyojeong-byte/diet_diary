
import React, { useState, useMemo } from 'react';
import { MealRecord } from '../types';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  meals: MealRecord[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate, meals }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));

  const getKSTToday = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[0];
  };

  const todayStr = getKSTToday();

  // 요일 헤더 (월~일)
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  // 식단 데이터가 있는 날짜들을 Set으로 관리 (빠른 조회를 위해)
  const mealDates = useMemo(() => {
    const dates = new Set<string>();
    meals.forEach(m => {
      if (m.date) dates.add(m.date.split('T')[0]);
    });
    return dates;
  }, [meals]);

  // 선택된 날짜가 포함된 주의 월요일~일요일 구하기
  const currentWeek = useMemo(() => {
    const curr = new Date(selectedDate);
    const day = curr.getDay(); // 0(일) ~ 6(토)
    // 월요일 시작으로 변환 (월:0, ..., 일:6)
    const diff = curr.getDate() - (day === 0 ? 6 : day - 1);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(curr);
      d.setDate(diff + i);
      return d.toISOString().split('T')[0];
    });
  }, [selectedDate]);

  // 전체 달력용 날짜 계산 (월요일 시작 기준)
  const monthDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    
    // 해당 월의 1일
    const firstDay = new Date(year, month, 1);
    // 1일의 요일 (월요일 시작을 위해 보정: 월0...일6)
    const firstDayIdx = (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1);
    
    // 달력의 시작 날짜 (이전 달 날짜 포함)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDayIdx);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [viewMonth]);

  const changeMonth = (offset: number) => {
    const next = new Date(viewMonth);
    next.setMonth(next.getMonth() + offset);
    setViewMonth(next);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      {/* Header */}
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

      {/* 요일 라벨 */}
      <div className="grid grid-cols-7 gap-1 px-4 text-center">
        {weekDays.map(d => (
          <span key={d} className="text-[10px] font-bold text-gray-300 py-1 uppercase">{d}</span>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className={`px-4 pb-4 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-20 opacity-100'}`}>
        <div className="grid grid-cols-7 gap-1 mt-1">
          {(isExpanded ? monthDays : currentWeek).map((date) => {
            const d = new Date(date);
            const isSelected = date === selectedDate;
            const isToday = date === todayStr;
            const hasMeal = mealDates.has(date);
            const isCurrentMonth = d.getMonth() === viewMonth.getMonth();
            const dayNum = d.getDate();

            return (
              <button
                key={date}
                onClick={() => {
                  onSelectDate(date);
                  setViewMonth(new Date(date));
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
                {hasMeal && (
                  <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
