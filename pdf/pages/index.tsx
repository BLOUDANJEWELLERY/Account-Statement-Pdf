import { useState } from "react";

export default function Home() {
  const [shops, setShops] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addShop = () => {
    if (!input.trim()) return;
    setShops([...shops, input.trim()]);
    setInput("");
  };

const generatePdf = async () => {
  const res = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shops }),
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "balances.pdf"; // IMPORTANT
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  window.URL.revokeObjectURL(url);
};

  return (
    <main style={{ padding: 30 }}>
      <h2>Shops List</h2>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Shop name"
      />
      <button onClick={addShop}>Add</button>

      <ul>
        {shops.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <button onClick={generatePdf} disabled={!shops.length}>
        Generate PDF
      </button>
    </main>
  );
}