
import React, { useState, useMemo } from 'react';
import { ActivityLog, MealRecord } from '../types';
import ActivityDetailModal from './ActivityDetailModal';
import { getTodayKST, formatDateToYYYYMMDD } from '../utils';

interface Props {
  activities: ActivityLog[];
  meals: MealRecord[];
  onNavigateToUpload: (date: string) => void;
}

const ActivityLogView: React.FC<Props> = ({ activities, meals, onNavigateToUpload }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  const activityMap = useMemo(() => {
    const map: Record<string, ActivityLog> = {};
    activities.forEach(a => {
      map[a.date] = a;
    });
    return map;
  }, [activities]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    const activity = activityMap[dateStr];
    if (activity) {
      setSelectedActivity(activity);
    } else {
      onNavigateToUpload(dateStr);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-black">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`text-center text-xs font-bold py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
              
              const dateStr = formatDateToYYYYMMDD(date);
              const hasActivity = !!activityMap[dateStr];
              const isToday = dateStr === getTodayKST();

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-2xl transition-all relative ${isToday ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'hover:bg-gray-50'}`}
                >
                  <span className={`text-sm font-bold ${date.getDay() === 0 ? 'text-red-500' : date.getDay() === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </span>
                  {hasActivity && (
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={() => onNavigateToUpload(getTodayKST())}
        className="fixed bottom-6 right-6 bg-white border-2 border-indigo-600 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-40 group"
      >
        <span className="text-2xl group-hover:animate-bounce">💪</span>
        {activityMap[getTodayKST()] && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 border-2 border-white rounded-full -translate-y-1/4 translate-x-1/4 animate-pulse"></span>
        )}
      </button>

      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          meals={meals}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
};

export default ActivityLogView;
