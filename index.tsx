import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Если вы создали пустой файл index.css, оставьте импорт. 
// Если нет - закомментируйте строку ниже.
// import './index.css'; 

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
