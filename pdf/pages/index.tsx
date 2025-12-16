import { useState } from "react";

export default function Home() {
  const [shops, setShops] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addShop = () => {
    if (!input.trim()) return;
    setShops([...shops, input.trim()]);
    setInput("");
  };

  const removeShop = (index: number) => {
    setShops(shops.filter((_, i) => i !== index));
  };

  const generatePdf = async () => {
    if (!shops.length) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shops }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "shops_balance.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <h1>Shops Balance Sheet</h1>
      
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter shop name"
            style={{ 
              padding: "8px 12px", 
              border: "1px solid #ccc", 
              borderRadius: 4,
              flex: 1 
            }}
            onKeyPress={(e) => e.key === "Enter" && addShop()}
          />
          <button 
            onClick={addShop}
            style={{ 
              padding: "8px 16px", 
              backgroundColor: "#0070f3", 
              color: "white", 
              border: "none", 
              borderRadius: 4,
              cursor: "pointer" 
            }}
          >
            Add Shop
          </button>
        </div>

        {shops.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {shops.map((shop, index) => (
              <li 
                key={index} 
                style={{ 
                  padding: "10px", 
                  marginBottom: 5, 
                  border: "1px solid #eee",
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>{index + 1}. {shop}</span>
                <button 
                  onClick={() => removeShop(index)}
                  style={{ 
                    padding: "4px 8px", 
                    backgroundColor: "#ff4444", 
                    color: "white", 
                    border: "none", 
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            No shops added yet. Add some shops to generate a PDF.
          </p>
        )}
      </div>

      <div>
        <button 
          onClick={generatePdf} 
          disabled={!shops.length || loading}
          style={{ 
            padding: "12px 24px", 
            backgroundColor: !shops.length || loading ? "#ccc" : "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: 4,
            cursor: !shops.length || loading ? "not-allowed" : "pointer",
            fontSize: 16
          }}
        >
          {loading ? "Generating PDF..." : "Generate PDF"}
        </button>
      </div>

      {error && (
        <div style={{ 
          marginTop: 20, 
          padding: 10, 
          backgroundColor: "#ffe6e6", 
          border: "1px solid #ff4444",
          borderRadius: 4,
          color: "#cc0000"
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ marginTop: 30, fontSize: 14, color: "#666" }}>
        <p>Make sure you have a logo.png file in your public folder.</p>
        <p>Supported image formats for logo: PNG or JPEG</p>
      </div>
    </main>
  );
}