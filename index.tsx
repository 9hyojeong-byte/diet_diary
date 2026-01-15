
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// [중요] 최우선 실행: 전역 process 객체 및 API_KEY 브릿지 설정
(function() {
  const g = globalThis as any;
  if (!g.process) {
    g.process = { env: {} };
  }
  
  // @ts-ignore - Vite 환경 변수 접근
  const vEnv = import.meta.env;
  if (vEnv) {
    // Vercel에서 설정한 VITE_API_KEY를 우선적으로 process.env.API_KEY에 할당
    const key = vEnv.VITE_API_KEY || vEnv.API_KEY;
    if (key) {
      g.process.env.API_KEY = key;
      console.log("Gemini API Key bridge initialized.");
    }
  }
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then(reg => console.log('SW registered successfully', reg.scope))
      .catch(err => console.log('SW registration failed', err));
  });
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
