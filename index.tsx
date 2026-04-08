import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * 런타임 브릿지 로직을 더 안전하게 감싸서 실행합니다.
 */
(function setupRuntimeBridge() {
  try {
    const g = globalThis as any;
    if (!g) return;

    // 1. 전역 구조 안전하게 확보
    g.process = g.process || { env: {} };
    g.process.env = g.process.env || {};
    
    const isTrulyValid = (v: any) => 
      v && typeof v === 'string' && v !== 'undefined' && v !== 'null' && v.trim() !== '';

    // 2. 키 탐색
    let targetKey = 
      g['API_KEY'] || 
      g['VITE_API_KEY'] || 
      (g.window && (g.window['API_KEY'] || g.window['VITE_API_KEY']));

    if (!isTrulyValid(targetKey)) {
      const vEnv = (import.meta as any).env || {};
      targetKey = vEnv['API_KEY'] || vEnv['VITE_API_KEY'];
    }

    if (!isTrulyValid(targetKey)) {
      targetKey = g.process.env['API_KEY'] || g.process.env['VITE_API_KEY'];
    }

    // 3. 키 할당 (에러 방지를 위해 하나씩 체크)
    if (isTrulyValid(targetKey)) {
      g.process.env.API_KEY = targetKey; 
      g['API_KEY'] = targetKey;
      if (g.window) {
          g.window['API_KEY'] = targetKey;
          // window.process가 없을 때만 할당하여 충돌 방지
          if (!g.window.process) g.window.process = g.process;
      }
      console.log("✅ Runtime Bridge: API_KEY established.");
    }
  } catch (e) {
    // AI 스튜디오 프리뷰 환경에서 전역 객체 수정 제한 시 에러 방지
    console.warn("⚠️ Runtime Bridge encountered a sandbox restriction:", e);
  }
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 서비스 워커 등록 (프리뷰 에러 방지를 위해 계속 주석 처리 유지)
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then(reg => console.log('SW registered successfully', reg.scope))
      .catch(err => console.log('SW registration failed', err));
  });
}
*/

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);