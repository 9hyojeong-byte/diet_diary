
import React from 'react';
import { ActivityLog } from '../types';

interface Props {
  activity: ActivityLog;
  onClose: () => void;
}

const ActivityDetailModal: React.FC<Props> = ({ activity, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">{activity.date} 활동 기록</h3>
            <p className="text-xs opacity-70 font-medium">오늘도 정말 고생 많으셨어요! ✨</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {activity.image_url && (
            <div className="rounded-2xl overflow-hidden border shadow-inner bg-gray-50">
              <img 
                src={activity.image_url} 
                alt="Activity" 
                className="w-full h-auto block"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-orange-50 p-4 rounded-2xl text-center border border-orange-100">
              <p className="text-[10px] font-bold text-orange-400 uppercase mb-1">걸음수</p>
              <p className="text-xl font-black text-orange-600">{activity.steps.toLocaleString()}</p>
              <p className="text-[10px] text-orange-400 font-medium">steps</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">활동 칼로리</p>
              <p className="text-xl font-black text-emerald-600">{activity.active_calories.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-400 font-medium">kcal</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl text-center border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">총 소모량</p>
              <p className="text-xl font-black text-indigo-600">{activity.total_calories.toLocaleString()}</p>
              <p className="text-[10px] text-indigo-400 font-medium">kcal</p>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all"
            >
              확인 완료!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal;
