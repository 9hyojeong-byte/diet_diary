
import React, { useState, useRef } from 'react';
import { getTargetKcal, getTargetProtein } from '../utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'main' | 'ingredients' | 'stats' | 'memos' | 'activity';
  onNavigate: (view: 'main' | 'ingredients' | 'stats' | 'memos' | 'activity') => void;
  isAdmin?: boolean;
  onLogout?: () => void;
  onOpenAdminLogin?: () => void;
  selectedDate?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onNavigate, isAdmin, onLogout, onOpenAdminLogin, selectedDate }) => {
  const [taps, setTaps] = useState(0);
  // Browser environment might not have NodeJS namespace, using ReturnType of setTimeout instead
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targetKcal = selectedDate ? getTargetKcal(selectedDate) : 1500;
  const targetProtein = selectedDate ? getTargetProtein(selectedDate) : 100;

  const handleEasterEgg = () => {
    setTaps(prev => {
      const next = prev + 1;
      if (next >= 10) {
        if (isAdmin) {
          onLogout?.();
        } else {
          onOpenAdminLogin?.();
        }
        onClose(); // 드로워 닫기
        return 0;
      }
      return next;
    });

    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => {
      setTaps(0);
    }, 2000); // 2초 동안 입력이 없으면 카운트 리셋
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[101] shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">메뉴</h2>
            <p className="text-xs opacity-70">어떤 기록을 원하세요?</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <MenuButton 
            active={currentView === 'main'} 
            onClick={() => { onNavigate('main'); onClose(); }}
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />}
            label="메인 식단 기록" 
          />
          <MenuButton 
            active={currentView === 'ingredients'} 
            onClick={() => { onNavigate('ingredients'); onClose(); }}
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
            label="식재료 관리" 
          />
          <MenuButton 
            active={currentView === 'stats'} 
            onClick={() => { onNavigate('stats'); onClose(); }}
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
            label="나의 통계" 
          />
          <MenuButton 
            active={currentView === 'activity'} 
            onClick={() => { onNavigate('activity'); onClose(); }}
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
            label="활동량 기록" 
          />
          {isAdmin && (
            <MenuButton 
              active={currentView === 'memos'} 
              onClick={() => { onNavigate('memos'); onClose(); }}
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
              label="메모 목록" 
            />
          )}
          
          <div className="pt-8 px-4 border-t mt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Support</p>
            <div className="space-y-4">
               <div className="text-sm text-gray-400 flex items-center space-x-2">
                 <span>⚙️ 설정 (준비중)</span>
               </div>
               {isAdmin && onLogout && (
                 <button 
                  onClick={() => { onLogout(); onClose(); }}
                  className="w-full text-left text-sm text-red-400 flex items-center space-x-2 font-bold"
                 >
                   <span>🔓 관리자 로그아웃</span>
                 </button>
               )}
            </div>
          </div>
        </nav>

        <div 
          onClick={handleEasterEgg}
          className={`absolute bottom-6 left-6 right-6 p-4 rounded-2xl transition-all active:scale-[0.97] select-none ${taps > 0 ? 'bg-indigo-100' : 'bg-indigo-50'}`}
        >
          <p className="text-xs font-bold text-indigo-600 mb-1">식단 목표</p>
          <p className="text-[10px] text-gray-500 italic">매일 {targetKcal}kcal • 단백질 {targetProtein}g</p>
          {taps > 0 && taps < 10 && (
            <div className="absolute top-1 right-2 text-[8px] font-black text-indigo-300 opacity-50">
              {taps}/10
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const MenuButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${active ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icon}
    </svg>
    <span>{label}</span>
  </button>
);

export default Sidebar;
