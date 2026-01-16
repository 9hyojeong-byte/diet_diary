
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ExitModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleExit = () => {
    // 브라우저 탭 종료 시도
    window.close();
    // 윈도우 close가 작동하지 않는 일반 브라우저 환경을 위한 안내
    setTimeout(() => {
      alert('브라우저 보안 정책상 직접 종료가 어려울 수 있습니다. 브라우저 탭을 직접 닫아주세요.');
      onClose();
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-3xl">
            👋
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-800">앱을 종료할까요?</h3>
            <p className="text-sm text-gray-400 font-medium">오늘의 기록은 모두 안전하게 저장되었습니다.</p>
          </div>
        </div>
        
        <div className="flex border-t border-gray-50">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button 
            onClick={handleExit}
            className="flex-1 py-4 text-red-500 font-black hover:bg-red-50 transition-colors border-l border-gray-50"
          >
            종료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitModal;
