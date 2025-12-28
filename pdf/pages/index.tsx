import { useEffect, useState } from "react";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { customVfs } from "../lib/customVfs";

export default function Home() {
  const [pdfMake, setPdfMake] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: any) => {
    const text =
      typeof msg === "string" ? msg : JSON.stringify(msg, null, 2);
    setLogs((l) => [...l, `[${new Date().toISOString()}] ${text}`]);
  };

  // Capture all errors visibly (Safari-safe)
  useEffect(() => {
    const origLog = console.log;
    const origErr = console.error;

    console.log = (...a) => {
      origLog(...a);
      a.forEach(log);
    };
    console.error = (...a) => {
      origErr(...a);
      a.forEach((x) => log("❌ " + x));
    };

    window.onerror = (msg, src, line, col) => {
      log(`❌ window.onerror: ${msg} @ ${line}:${col}`);
      return false;
    };

    window.onunhandledrejection = (e) => {
      log("❌ Unhandled rejection:");
      log(e.reason);
    };

    return () => {
      console.log = origLog;
      console.error = origErr;
    };
  }, []);

  // Load pdfMake ONLY on client
  useEffect(() => {
    const load = async () => {
      try {
        log("📦 Importing pdfmake...");
        const pdfMakeModule = await import("pdfmake/build/pdfmake");

        log("📦 Importing default vfs...");
        const vfsFontsModule = await import("pdfmake/build/vfs_fonts");

        const pdfMakeInstance = pdfMakeModule.default;

        const defaultVfs =
          (vfsFontsModule as any).pdfMake?.vfs ||
          (vfsFontsModule as any).default?.pdfMake?.vfs ||
          (vfsFontsModule as any).default ||
          {};

        if (!defaultVfs) {
          log("❌ Default VFS not found");
          return;
        }

        log("✅ Default VFS loaded");

        // 🔑 Merge Arabic font into VFS
        pdfMakeInstance.vfs = {
          ...defaultVfs,
          ...customVfs,
        };

        pdfMakeInstance.fonts = {
          Amiri: {
            normal: "Amiri-Regular.ttf",
          },
        };

        setPdfMake(pdfMakeInstance);
        log("✅ pdfMake READY with Amiri");
      } catch (e) {
        log("❌ pdfMake load failed");
        log(e);
      }
    };

    load();
  }, []);

  const generatePDF = () => {
    log("🖱 Button clicked");

    if (!pdfMake) {
      log("❌ pdfMake not ready");
      return;
    }

    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      defaultStyle: {
        font: "Amiri",
        alignment: "right",
      },
      content: [
        {
          text: "هذا ملف PDF باللغة العربية",
          fontSize: 20,
          margin: [0, 0, 0, 12],
        },
        {
          text: "يعمل على iPhone Safari و Netlify بدون أي مشاكل.",
          fontSize: 14,
        },
      ],
    };

    try {
      log("📄 Creating PDF...");
      pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
        log("✅ Blob created");
        log(`📦 Size: ${blob.size} bytes`);

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "arabic.pdf";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        log("⬇️ Download triggered");
      });
    } catch (e) {
      log("❌ PDF generation failed");
      log(e);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h1>Arabic PDF — Final Debug Page</h1>

      <button
        onClick={generatePDF}
        style={{
          padding: 12,
          fontSize: 16,
          marginBottom: 20,
        }}
      >
        Create Arabic PDF
      </button>

      <div
        style={{
          background: "#000",
          color: "#0f0",
          padding: 12,
          height: "50vh",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          border: "2px solid red",
        }}
      >
        {logs.join("\n")}
      </div>
    </div>
  );
}