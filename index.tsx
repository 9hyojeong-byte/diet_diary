
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * 런타임에 API 키를 확실하게 확보하기 위한 브릿지 로직입니다.
 * 빌드 도구가 process.env.API_KEY를 "undefined" 문자열로 치환하는 것을 방어합니다.
 */
(function setupRuntimeBridge() {
  const g = globalThis as any;
  
  // 1. process.env 구조 강제 생성
  if (!g.process) g.process = { env: {} };
  if (!g.process.env) g.process.env = {};
  
  // 유효성 체크 함수: undefined/null 문자열이 박히는 경우를 철저히 거름
  const isTrulyValid = (v: any) => 
    v && typeof v === 'string' && v !== 'undefined' && v !== 'null' && v.trim() !== '';

  // 2. 소스 탐색 (우선순위: window 직접 주입 > import.meta.env > process.env)
  // 대괄호 표기법['...']을 사용해야 번들러의 정적 분석(Static Analysis)을 피할 수 있습니다.
  let targetKey = 
    g['API_KEY'] || 
    g['VITE_API_KEY'] || 
    (g.window && (g.window['API_KEY'] || g.window['VITE_API_KEY']));

  if (!isTrulyValid(targetKey)) {
    // @ts-ignore (Vite 환경)
    const vEnv = import.meta.env || {};
    targetKey = vEnv['API_KEY'] || vEnv['VITE_API_KEY'];
  }

  if (!isTrulyValid(targetKey)) {
    // 마지막으로 process.env['API_KEY'] 확인 (정적 치환되지 않은 동적 접근)
    targetKey = g.process.env['API_KEY'];
  }

  // 3. 발견된 키를 모든 전역 위치에 강제 고정
  if (isTrulyValid(targetKey)) {
    g.process.env['API_KEY'] = targetKey;
    g.process.env.API_KEY = targetKey; // 정적 참조 대비
    g['API_KEY'] = targetKey;          // window 대비
    console.log("✅ Runtime Bridge: API_KEY successfully established.");
  } else {
    console.error("❌ Runtime Bridge: Critical! API_KEY not found in any scope.");
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
