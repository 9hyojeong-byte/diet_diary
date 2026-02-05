
import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (success: boolean) => void;
}

const AdminLoginModal: React.FC<Props> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 환경 변수에서 암호를 가져오거나, 프리뷰용 기본 암호 '1234'를 허용합니다.
    const envPassword = (import.meta as any).env?.VITE_ADMIN_PASSWORD || (process.env as any).VITE_ADMIN_PASSWORD;
    const isSuccess = password === envPassword || password === '1234';
    
    if (isSuccess) {
      onLogin(true);
      onClose();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-800">관리자 로그인</h3>
            <p className="text-xs text-gray-400 font-medium">기능 활성화를 위해 암호를 입력하세요.</p>
          </div>

          <div className="space-y-2">
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={`w-full p-4 bg-gray-50 rounded-2xl border-2 text-center font-bold outline-none transition-all ${
                error ? 'border-red-400 animate-shake' : 'border-transparent focus:border-indigo-500'
              }`}
            />
            {error && <p className="text-[10px] text-red-500 text-center font-bold">암호가 일치하지 않습니다.</p>}
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginModal;
