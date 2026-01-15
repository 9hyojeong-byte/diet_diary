
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 1. 브라우저 환경에서 process.env 객체를 초기화하고 Vite 환경 변수를 주입합니다.
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

try {
  // Vite의 import.meta.env에 접근하여 process.env로 복사
  // @ts-ignore
  const viteEnv = import.meta.env;
  if (viteEnv) {
    Object.keys(viteEnv).forEach((key) => {
      // VITE_ 접두사를 제거한 키도 생성 (예: VITE_API_KEY -> API_KEY)
      const cleanKey = key.replace('VITE_', '');
      (window as any).process.env[key] = viteEnv[key];
      (window as any).process.env[cleanKey] = viteEnv[key];
    });
    
    // 가이드라인 준수를 위해 API_KEY가 명시적으로 없는 경우 VITE_API_KEY를 할당
    if (viteEnv.VITE_API_KEY && !(window as any).process.env.API_KEY) {
      (window as any).process.env.API_KEY = viteEnv.VITE_API_KEY;
    }
  }
} catch (e) {
  console.warn('Environment variable bridging failed:', e);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA 서비스 워커 등록 (Origin 불일치 에러 방지)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      const swUrl = new URL('/service-worker.js', window.location.href);
      if (swUrl.origin === window.location.origin) {
        navigator.serviceWorker.register('/service-worker.js').catch(err => {
          console.warn('Service worker registration failed: ', err.message);
        });
      }
    } catch (e) {
      console.error('SW registration error:', e);
    }
  });
}
