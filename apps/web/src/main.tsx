import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTelemetry } from 'telemetry';
import App from './App';

// Initialize telemetry
initTelemetry({
  env: 'development',
  release: 'local',
  service: 'web'
});

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);