import { useState } from "react";

export default function Home() {
  const [shops, setShops] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const addShop = () => {
    if (!input.trim()) return;
    setShops([...shops, input.trim()]);
    setInput("");
  };

  const removeShop = (index: number) => {
    setShops(shops.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setShops([]);
    setError(null);
    setDebugInfo(null);
  };

  const generatePdf = async () => {
    if (!shops.length) return;
    
    setLoading(true);
    setError(null);
    setDebugInfo("Starting PDF generation...");

    try {
      setDebugInfo("Sending request to API...");
      
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/pdf"
        },
        body: JSON.stringify({ shops }),
      });

      setDebugInfo(`Response status: ${res.status} ${res.statusText}`);

      if (!res.ok) {
        let errorDetails = `HTTP ${res.status}: ${res.statusText}`;
        
        try {
          const errorData = await res.json();
          setDebugInfo(`Error response: ${JSON.stringify(errorData)}`);
          errorDetails = errorData.error || errorData.details || errorDetails;
        } catch (e) {
          setDebugInfo(`Could not parse error JSON: ${e}`);
        }
        
        throw new Error(errorDetails);
      }

      setDebugInfo("Response received, creating blob...");
      const blob = await res.blob();
      
      if (blob.size === 0) {
        throw new Error("Received empty PDF file");
      }

      setDebugInfo(`Blob created, size: ${blob.size} bytes`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shops_balance.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setDebugInfo("PDF downloaded successfully!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate PDF";
      setError(errorMessage);
      setDebugInfo(`Error: ${errorMessage}`);
      console.error("PDF Generation Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ 
      padding: 30, 
      maxWidth: 800, 
      margin: "0 auto",
      fontFamily: 'Arial, sans-serif' 
    }}>
      <h1 style={{ color: '#333', marginBottom: 30 }}>Shops Balance Sheet Generator</h1>
      
      <div style={{ marginBottom: 30, padding: 20, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, color: '#555' }}>Add Shops</h2>
        
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter shop name"
            style={{ 
              padding: "10px 12px", 
              border: "1px solid #ddd", 
              borderRadius: 6,
              flex: 1,
              fontSize: 16
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
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: "bold"
            }}
          >
            Add Shop
          </button>
        </div>

        {shops.length > 0 ? (
          <>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10 
            }}>
              <h3 style={{ margin: 0, color: '#555' }}>Shops List ({shops.length})</h3>
              <button 
                onClick={clearAll}
                style={{ 
                  padding: "6px 12px", 
                  backgroundColor: "#ff6b6b", 
                  color: "white", 
                  border: "none", 
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 14
                }}
              >
                Clear All
              </button>
            </div>
            
            <ul style={{ 
              listStyle: "none", 
              padding: 0,
              margin: 0,
              maxHeight: 300,
              overflowY: 'auto'
            }}>
              {shops.map((shop, index) => (
                <li 
                  key={index} 
                  style={{ 
                    padding: "12px 15px", 
                    marginBottom: 8, 
                    border: "1px solid #e0e0e0",
                    borderRadius: 6,
                    backgroundColor: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ 
                      backgroundColor: "#0070f3", 
                      color: "white",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12
                    }}>
                      {index + 1}
                    </span>
                    <span style={{ fontSize: 16 }}>{shop}</span>
                  </div>
                  <button 
                    onClick={() => removeShop(index)}
                    style={{ 
                      padding: "6px 12px", 
                      backgroundColor: "#ff4444", 
                      color: "white", 
                      border: "none", 
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 14
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div style={{ 
            padding: 30, 
            textAlign: "center",
            border: "2px dashed #ddd",
            borderRadius: 8
          }}>
            <p style={{ color: "#666", fontSize: 16, margin: 0 }}>
              No shops added yet. Add some shops to generate a PDF.
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 30 }}>
        <button 
          onClick={generatePdf} 
          disabled={!shops.length || loading}
          style={{ 
            padding: "15px 30px", 
            backgroundColor: !shops.length || loading ? "#ccc" : "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: 8,
            cursor: !shops.length || loading ? "not-allowed" : "pointer",
            fontSize: 18,
            fontWeight: "bold",
            width: "100%",
            transition: "background-color 0.3s"
          }}
        >
          {loading ? (
            <>
              <span style={{ display: "inline-block", marginRight: 10 }}>⏳</span>
              Generating PDF...
            </>
          ) : (
            <>
              <span style={{ display: "inline-block", marginRight: 10 }}>📄</span>
              Generate PDF ({shops.length} shops)
            </>
          )}
        </button>
      </div>

      {error && (
        <div style={{ 
          marginTop: 20, 
          padding: 15, 
          backgroundColor: "#ffe6e6", 
          border: "1px solid #ff4444",
          borderRadius: 8,
          color: "#cc0000"
        }}>
          <strong style={{ display: "block", marginBottom: 5 }}>Error:</strong>
          {error}
        </div>
      )}

      {debugInfo && (
        <div style={{ 
          marginTop: 20, 
          padding: 15, 
          backgroundColor: "#e6f7ff", 
          border: "1px solid #91d5ff",
          borderRadius: 8,
          color: "#0050b3",
          fontSize: 14
        }}>
          <strong style={{ display: "block", marginBottom: 5 }}>Debug Info:</strong>
          <pre style={{ 
            margin: 0, 
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            fontFamily: "monospace"
          }}>
            {debugInfo}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 30, fontSize: 14, color: "#666", lineHeight: 1.6 }}>
        <h3 style={{ color: "#555" }}>Instructions:</h3>
        <ol style={{ paddingLeft: 20 }}>
          <li>Add shop names using the input field above</li>
          <li>Click "Generate PDF" to create a balance sheet</li>
          <li>The PDF will download automatically</li>
          <li>All numeric values are initialized to 0 (you can edit the PDF manually)</li>
        </ol>
      </div>
    </main>
  );
}