import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
      // Create PDF
      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Add Arabic title
      doc.setFontSize(20);
      doc.text("كشف حساب المحلات التجارية", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.text("اسم الشركة: شركة المجوهرات المتحدة", 105, 30, { align: "center" });
      doc.text(`تاريخ: ${new Date().toLocaleDateString('ar-SA')}`, 105, 37, { align: "center" });

      // Create table data
      const tableData = shops.map((shop, index) => [
        (index + 1).toString(),
        shop,
        "٠",
        "٠",
        "٠",
        "٠"
      ]);

      // Generate table
      autoTable(doc, {
        head: [["م", "اسم المحل", "ذهب ٩٩٩ لنا", "نقدي لنا", "ذهب ٩٩٩ لكم", "نقدي لكم"]],
        body: tableData,
        startY: 50,
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 5,
          halign: "center",
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 50 },
      });

      // Add footer
      const pageCount = (doc as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `الصفحة ${i} من ${pageCount} - إجمالي المحلات: ${shops.length}`,
          105,
          285,
          { align: "center" }
        );
      }

      // Save PDF
      doc.save("shops-balance.pdf");
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component remains the same...
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

      <button onClick={generatePdf} disabled={!shops.length || loading}>
        {loading ? "Generating..." : "Generate PDF"}
      </button>
      
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
    </main>
  );
}