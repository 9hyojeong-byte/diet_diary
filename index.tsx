
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 브라우저 환경에서 process.env.API_KEY 참조 시 런타임 에러 방지
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
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

// PWA 서비스 워커 등록 (프리뷰 환경의 Origin 불일치 에러 해결)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      const swUrl = new URL('/service-worker.js', window.location.href);
      // 현재 도메인과 서비스 워커의 도메인이 일치할 때만 등록 시도
      if (swUrl.origin === window.location.origin) {
        navigator.serviceWorker.register('/service-worker.js').catch(err => {
          console.warn('Service worker registration failed: ', err.message);
        });
      } else {
        console.log('Service worker registration skipped: Cross-origin restriction in preview mode.');
      }
    } catch (e) {
      console.error('SW registration error:', e);
    }
  });
}
