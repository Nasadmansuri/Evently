import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './shared/context/AuthContext.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Manrope, sans-serif',
            fontSize: '13px',
            padding: '10px 14px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #E5E7EB',
            color: '#111827',
          },
          success: {
            iconTheme: { primary: '#16A34A', secondary: '#fff' },
            style: { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' },
          },
          error: {
            iconTheme: { primary: '#DC2626', secondary: '#fff' },
            style: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
          },
        }}
      />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);