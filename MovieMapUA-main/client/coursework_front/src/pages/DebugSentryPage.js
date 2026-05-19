import React from 'react';

export default function DebugSentryPage() {
  const triggerError = () => {
    throw new Error('Test Sentry frontend error');
  };

  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1>Sentry Verification</h1>
      <p>Click the button below to trigger a test error.</p>
      <button
        onClick={triggerError}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          background: 'crimson',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Throw test error
      </button>
    </div>
  );
}
