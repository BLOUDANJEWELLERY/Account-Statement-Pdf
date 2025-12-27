import { useEffect, useState } from "react";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

export default function Home() {
  const [logs, setLogs] = useState<string[]>([]);
  const [pdfMake, setPdfMake] = useState<any>(null);

  const log = (msg: any) => {
    const text =
      typeof msg === "string" ? msg : JSON.stringify(msg, null, 2);
    setLogs((l) => [...l, `[${new Date().toISOString()}] ${text}`]);
  };

  // Capture EVERYTHING
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(...args);
      args.forEach(log);
    };

    console.error = (...args) => {
      originalError(...args);
      args.forEach((a) => log("❌ " + a));
    };

    window.onerror = (msg, src, line, col) => {
      log(`❌ window.onerror: ${msg} @ ${line}:${col}`);
      return false;
    };

    window.onunhandledrejection = (e) => {
      log("❌ Unhandled promise rejection:");
      log(e.reason);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  // Load pdfMake CLIENT ONLY
  useEffect(() => {
    log("🚀 useEffect started (client)");

    const load = async () => {
      try {
        log("📦 Importing pdfmake...");
        const pdfMakeModule = await import("pdfmake/build/pdfmake");
        log("📦 Importing vfs_fonts...");
        const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

        const pdfMakeInstance = pdfMakeModule.default;
        const pdfFonts = pdfFontsModule.default as any;

        if (!pdfFonts?.pdfMake?.vfs) {
          log("❌ pdfFonts.pdfMake.vfs NOT FOUND");
        } else {
          log("✅ vfs_fonts loaded");
        }

        pdfMakeInstance.vfs = pdfFonts.pdfMake.vfs;

        pdfMakeInstance.fonts = {
          Amiri: {
            normal: "Amiri-Regular.ttf",
          },
        };

        log("✅ pdfMake configured");
        setPdfMake(pdfMakeInstance);
      } catch (err) {
        log("❌ Error loading pdfMake");
        log(err);
      }
    };

    load();
  }, []);

  const generatePDF = () => {
    log("🖱 Button clicked");

    if (!pdfMake) {
      log("❌ pdfMake is NULL");
      return;
    }

    try {
      const docDefinition: TDocumentDefinitions = {
        defaultStyle: {
          font: "Amiri",
          alignment: "right",
        },
        content: [
          { text: "اختبار PDF عربي", fontSize: 18 },
          { text: "إذا رأيت هذا، فكل شيء يعمل", fontSize: 14 },
        ],
      };

      log("📄 Creating PDF...");

      pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
        log("✅ Blob created");
        log(`📦 Blob size: ${blob.size}`);

        const url = URL.createObjectURL(blob);
        log("🔗 Blob URL created");

        const a = document.createElement("a");
        a.href = url;
        a.download = "arabic-debug.pdf";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        log("⬇️ Download triggered");
      });
    } catch (err) {
      log("❌ Exception during PDF generation");
      log(err);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h1>Arabic PDF Debug Mode (iOS Safari)</h1>

      <button
        onClick={generatePDF}
        style={{
          padding: 12,
          marginBottom: 20,
          fontSize: 16,
        }}
      >
        Create Arabic PDF
      </button>

      <div
        style={{
          whiteSpace: "pre-wrap",
          background: "#000",
          color: "#0f0",
          padding: 12,
          height: "50vh",
          overflow: "auto",
          border: "2px solid red",
        }}
      >
        {logs.join("\n")}
      </div>
    </div>
  );
}