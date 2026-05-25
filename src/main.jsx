import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <ThemeProvider>
      <AuthProvider>
        <AccessibilityProvider>
          <App />
        </AccessibilityProvider>
      </AuthProvider>
    </ThemeProvider>
  </>
);