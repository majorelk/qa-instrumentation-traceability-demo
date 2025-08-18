import { useState } from 'react';
import { fetchWithCorrelation } from './lib/fetch-wrapper';

function App() {
  const [status, setStatus] = useState<string>('');
  
  const handleTriggerError = async () => {
    setStatus('Triggering API error...');
    
    try {
      const response = await fetchWithCorrelation('/api/fail');
      setStatus(`Unexpected success: ${response.status}`);
    } catch (error) {
      setStatus(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Clear status after 3 seconds
    setTimeout(() => setStatus(''), 3000);
  };
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>QA Instrumentation Demo</h1>
      <p>This demo shows request correlation and telemetry emission on API errors.</p>
      
      <button 
        onClick={handleTriggerError}
        style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Trigger API Error
      </button>
      
      {status && (
        <p style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px' 
        }}>
          Status: {status}
        </p>
      )}
    </div>
  );
}

export default App;