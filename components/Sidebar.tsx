
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'main' | 'ingredients';
  onNavigate: (view: 'main' | 'ingredients') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onNavigate }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Drawer */}
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
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            label="메인 식단 기록" 
          />
          <MenuButton 
            active={currentView === 'ingredients'} 
            onClick={() => { onNavigate('ingredients'); onClose(); }}
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
            label="식재료 관리" 
          />
          
          <div className="pt-8 px-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Support</p>
            <div className="space-y-4">
               <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 flex items-center space-x-2">
                 <span>⚙️ 설정 (준비중)</span>
               </a>
               <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 flex items-center space-x-2">
                 <span>📊 통계 (준비중)</span>
               </a>
            </div>
          </div>
        </nav>

        <div className="absolute bottom-6 left-6 right-6 p-4 bg-indigo-50 rounded-2xl">
          <p className="text-xs font-bold text-indigo-600 mb-1">식단 목표</p>
          <p className="text-[10px] text-gray-500">매일 1500kcal • 단백질 100g</p>
          <div className="mt-2 w-full bg-indigo-200 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full w-[65%]" />
          </div>
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
