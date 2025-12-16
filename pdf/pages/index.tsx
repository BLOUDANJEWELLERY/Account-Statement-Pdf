import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('مرحبا بالعالم');

  const generatePDF = async () => {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url); // opens PDF in new tab
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Arabic PDF Generator</h2>
      <textarea
        rows={5}
        style={{ width: '100%', padding: 10 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={generatePDF}
        style={{ marginTop: 10, padding: '10px 20px', cursor: 'pointer' }}
      >
        Generate PDF
      </button>
    </div>
  );
}