
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// 전역 process 객체 및 API_KEY 브릿지 설정
(function() {
  const g = globalThis as any;
  if (!g.process) {
    g.process = { env: {} };
  }
  
  const isValid = (val: any) => val && val !== "undefined" && val !== "null";

  // 1. 기존 값 확인
  let key = g.process.env.API_KEY;
  
  // 2. 만약 기존 값이 유효하지 않으면 다른 출처 확인 (Vite import.meta.env)
  if (!isValid(key)) {
    // @ts-ignore
    const vEnv = import.meta.env || {};
    key = vEnv.API_KEY || vEnv.VITE_API_KEY;
  }

  // 3. 여전히 유효하지 않으면 window/global 객체에서 직접 확인 (런타임 주입 대비)
  if (!isValid(key)) {
    key = g.API_KEY || g.VITE_API_KEY || g.window?.API_KEY;
  }

  // 최종적으로 유효한 키가 있다면 할당
  if (isValid(key)) {
    g.process.env.API_KEY = key;
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
