
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Vercel/Vite 환경에서 process.env.API_KEY를 사용할 수 있도록 브릿지 설정
(function() {
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }
  
  // @ts-ignore
  const vEnv = import.meta.env;
  if (vEnv) {
    if (vEnv.VITE_API_KEY) {
      (window as any).process.env.API_KEY = vEnv.VITE_API_KEY;
    } else if (vEnv.API_KEY) {
      (window as any).process.env.API_KEY = vEnv.API_KEY;
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
