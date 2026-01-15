
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // scope를 './'로 지정하여 현재 디렉토리 내의 모든 요청을 제어하도록 함
    navigator.serviceWorker.register('./sw.js', { scope: './' })
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
