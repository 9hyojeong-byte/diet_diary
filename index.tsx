
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * 런타임에 API 키를 확실하게 확보하기 위한 브릿지 로직입니다.
 * 빌드 도구가 process.env.API_KEY를 "undefined" 문자열로 치환하는 것을 방어합니다.
 */
(function setupRuntimeBridge() {
  const g = globalThis as any;
  
  // 1. 전역 구조 보장
  if (!g.process) g.process = { env: {} };
  if (!g.process.env) g.process.env = {};
  
  const isTrulyValid = (v: any) => 
    v && typeof v === 'string' && v !== 'undefined' && v !== 'null' && v.trim() !== '';

  // 2. 소스 탐색 (우선순위: window > import.meta.env > process.env)
  // 대괄호['...']를 사용해야 빌드 도구가 소스 코드를 강제로 바꾸지 않습니다.
  let targetKey = 
    g['API_KEY'] || 
    g['VITE_API_KEY'] || 
    (g.window && (g.window['API_KEY'] || g.window['VITE_API_KEY']));

  if (!isTrulyValid(targetKey)) {
    // @ts-ignore (Vite 환경)
    const vEnv = (import.meta as any).env || {};
    targetKey = vEnv['API_KEY'] || vEnv['VITE_API_KEY'];
  }

  if (!isTrulyValid(targetKey)) {
    // 빌드 타임에 치환되지 않도록 동적으로 접근
    targetKey = g.process.env['API_KEY'] || g.process.env['VITE_API_KEY'];
  }

  // 3. 발견된 키를 모든 전역 위치에 고정 (특히 SDK가 참조할 만한 곳)
  if (isTrulyValid(targetKey)) {
    g.process.env['API_KEY'] = targetKey;
    g.process.env.API_KEY = targetKey; 
    g['API_KEY'] = targetKey;
    // 간혹 SDK가 내부적으로 참조할 수 있는 다른 경로도 보장
    if (!g.window.process) g.window.process = g.process;
    console.log("✅ Runtime Bridge: API_KEY established via dynamic lookup.");
  } else {
    console.error("❌ Runtime Bridge: API_KEY not found. Check Vercel Environment Variables.");
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
