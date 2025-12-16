import { useState } from "react";

export default function Home() {
  const [shops, setShops] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addShop = () => {
    if (!input.trim()) return;
    setShops([...shops, input.trim()]);
    setInput("");
  };

  const removeShop = (index: number) => {
    setShops(shops.filter((_, i) => i !== index));
  };

  const testSimplePdf = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(["Starting test..."]);
    
    try {
      // First, test if the endpoint exists
      setDebugInfo(prev => [...prev, "Testing API endpoint..."]);
      
      const testRes = await fetch("/api/test");
      if (!testRes.ok) {
        throw new Error(`API test failed: ${testRes.status} ${testRes.statusText}`);
      }
      setDebugInfo(prev => [...prev, "✓ API endpoint works"]);
      
      // Now test the PDF generation
      setDebugInfo(prev => [...prev, "Requesting PDF..."]);
      
      const startTime = Date.now();
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ shops: ["Test Shop 1", "Test Shop 2"] }),
      });
      const endTime = Date.now();
      
      setDebugInfo(prev => [...prev, `Response time: ${endTime - startTime}ms`]);
      setDebugInfo(prev => [...prev, `Status: ${res.status} ${res.statusText}`]);
      
      if (!res.ok) {
        let errorText = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorText = errorData.error || errorData.message || errorText;
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorText);
      }
      
      setDebugInfo(prev => [...prev, "✓ PDF response received"]);
      
      const blob = await res.blob();
      setDebugInfo(prev => [...prev, `✓ Blob created: ${blob.size} bytes`]);
      
      if (blob.size === 0) {
        throw new Error("PDF file is empty (0 bytes)");
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "test.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setDebugInfo(prev => [...prev, "✓ PDF downloaded successfully!"]);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate PDF";
      setError(errorMessage);
      setDebugInfo(prev => [...prev, `✗ Error: ${errorMessage}`]);
      console.error("Error details:", err);
    } finally {
      setLoading(false);
    }
  };

  const testActualPdf = async () => {
    if (!shops.length) {
      alert("Please add some shops first");
      return;
    }
    
    setLoading(true);
    setError(null);
    setDebugInfo(["Starting actual PDF generation..."]);
    
    try {
      setDebugInfo(prev => [...prev, "Sending request with shops:", ...shops]);
      
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shops }),
      });

      setDebugInfo(prev => [...prev, `Status: ${res.status} ${res.statusText}`]);

      if (!res.ok) {
        let errorText = await res.text();
        try {
          const errorData = JSON.parse(errorText);
          errorText = errorData.error || errorData.message || errorText;
        } catch {
          // Not JSON, use as-is
        }
        throw new Error(errorText.substring(0, 200)); // Limit length
      }

      const blob = await res.blob();
      setDebugInfo(prev => [...prev, `Blob size: ${blob.size} bytes`]);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shops_balance.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setDebugInfo(prev => [...prev, "✓ Success!"]);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed";
      setError(errorMessage);
      setDebugInfo(prev => [...prev, `✗ Error: ${errorMessage}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ 
      padding: 20, 
      maxWidth: 600, 
      margin: "0 auto",
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <h1 style={{ textAlign: 'center' }}>PDF Generator Test</h1>
      
      <div style={{ marginBottom: 30 }}>
        <h3>Add Shops (Optional for Test):</h3>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Shop name"
            style={{ 
              flex: 1,
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 5
            }}
            onKeyPress={(e) => e.key === "Enter" && addShop()}
          />
          <button 
            onClick={addShop}
            style={{ 
              padding: "10px 20px",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer"
            }}
          >
            Add
          </button>
        </div>
        
        {shops.length > 0 && (
          <div>
            <h4>Shops List:</h4>
            <ul style={{ paddingLeft: 20 }}>
              {shops.map((shop, index) => (
                <li key={index} style={{ marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
                  {shop}
                  <button 
                    onClick={() => removeShop(index)}
                    style={{ 
                      padding: "2px 8px",
                      fontSize: 12,
                      backgroundColor: "#ff4444",
                      color: "white",
                      border: "none",
                      borderRadius: 3
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        gap: 15,
        marginBottom: 30
      }}>
        <button 
          onClick={testSimplePdf}
          disabled={loading}
          style={{ 
            padding: 15,
            backgroundColor: loading ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Testing..." : "Test Simple PDF (No libraries)"}
        </button>
        
        <button 
          onClick={testActualPdf}
          disabled={loading || !shops.length}
          style={{ 
            padding: 15,
            backgroundColor: !shops.length ? "#ccc" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            cursor: !shops.length ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Generating..." : "Generate Actual PDF"}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: 15,
          backgroundColor: "#ffebee",
          border: "1px solid #ffcdd2",
          borderRadius: 5,
          color: "#c62828",
          marginBottom: 20
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {debugInfo.length > 0 && (
        <div style={{ 
          padding: 15,
          backgroundColor: "#e3f2fd",
          border: "1px solid #bbdefb",
          borderRadius: 5,
          fontSize: 14
        }}>
          <strong>Debug Info:</strong>
          <div style={{ marginTop: 10 }}>
            {debugInfo.map((info, index) => (
              <div key={index} style={{ marginBottom: 5 }}>{info}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 30, fontSize: 14, color: "#666" }}>
        <h4>Debug Steps:</h4>
        <ol style={{ paddingLeft: 20 }}>
          <li>First, click "Test Simple PDF" - this should always work</li>
          <li>If it fails, your API route isn't working at all</li>
          <li>Add some shops and try "Generate Actual PDF"</li>
          <li>Check the debug info above for clues</li>
        </ol>
      </div>
    </main>
  );
}