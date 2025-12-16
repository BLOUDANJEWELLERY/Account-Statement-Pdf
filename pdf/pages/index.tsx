import { useState } from "react";

export default function Home() {
  const [shopName, setShopName] = useState("");
  const [shops, setShops] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addShop = () => {
    if (!shopName.trim()) return;
    setShops([...shops, shopName.trim()]);
    setShopName("");
  };

  const generatePdf = async () => {
    if (!shops.length) return;

    setLoading(true);

    const res = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shops }),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "balances.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.URL.revokeObjectURL(url);
    setLoading(false);
  };

  return (
    <main style={{ padding: 30, maxWidth: 500 }}>
      <h2>إدارة المحلات</h2>

      <input
        value={shopName}
        onChange={(e) => setShopName(e.target.value)}
        placeholder="اسم المحل"
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <button onClick={addShop} style={{ width: "100%", marginBottom: 20 }}>
        إضافة
      </button>

      <ul>
        {shops.map((shop, i) => (
          <li key={i}>
            {i + 1}. {shop}
          </li>
        ))}
      </ul>

      <button
        onClick={generatePdf}
        disabled={loading || !shops.length}
        style={{ width: "100%", marginTop: 20 }}
      >
        {loading ? "جارٍ إنشاء الملف..." : "توليد PDF"}
      </button>
    </main>
  );
}