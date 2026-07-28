import process from "process";
import { Buffer } from "buffer";


import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { store } from './pages/redux/Store';
import { fetchBrand } from './pages/redux/BrandSlice';  
import { ToastContainer } from 'react-toastify';
window.process = process;
window.Buffer = Buffer;

 
store.dispatch(fetchBrand());

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    
    <Provider store={store}>
          <App />
       </Provider>
       <ToastContainer
      position="top-right"
      autoClose={2000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    
  </React.StrictMode>
);

 
reportWebVitals();