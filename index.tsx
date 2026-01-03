import React from 'react';
import ReactDOM from 'react-dom/client';
import vkBridge from '@vkontakte/vk-bridge';
import App from './App';

// 1. Инициализируем VK Bridge сразу при загрузке
// isEmbedded() позволяет понять, находимся ли мы внутри приложения ВК
if (vkBridge.isEmbedded()) {
  vkBridge.send('VKWebAppInit')
    .then((data) => {
      if (data.result) {
        console.log('VK Bridge initialized');
      }
    })
    .catch((error) => {
      console.error('VK Bridge error:', error);
    });
} else {
  console.log('Running outside of VK (APK/Web mode)');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 2. Рендерим приложение
// Мы не оборачиваем его в дополнительные условия, 
// так как всю логику переключений мы уже вынесли внутрь App.tsx
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
