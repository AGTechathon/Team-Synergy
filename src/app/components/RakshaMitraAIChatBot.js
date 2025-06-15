"use client";

import { useState } from 'react';

export default function RakshaMitraAIChatBot() {
  const [error, setError] = useState('');

  return (
    <div className="w-full max-w-4xl mx-auto">
      <section 
        id="chatbot" 
        style={{ 
          padding: '20px', 
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
        }}
      >
        <center>
          <h2 style={{ 
            color: '#ffffff', 
            marginBottom: '20px',
            fontSize: '1.8rem',
            fontWeight: '600',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🤖 RakshaMitra AI ChatBot
          </h2>
        </center>
        <iframe
          src="https://www.ChatStream.org/embed"
          frameBorder="0"
          style={{
            width: '100%',
            height: '450px',
            display: 'block',
            margin: 'auto',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            background: '#ffffff'
          }}
        ></iframe>
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          💬 Ask me about disaster preparedness, emergency procedures, or weather analysis
        </div>
      </section>

      {error && (
        <div className="text-red-100 bg-red-500 bg-opacity-20 border border-red-300 rounded-lg p-3 text-center mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
