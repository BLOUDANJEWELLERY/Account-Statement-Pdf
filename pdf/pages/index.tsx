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

  /* ---------- CAPTURE ALL ERRORS ON SCREEN ---------- */
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

  /* ---------- LOAD PDFMAKE (CLIENT ONLY) ---------- */
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

        if (!defaultVfs || typeof defaultVfs !== "object") {
          log("❌ Default VFS missing or invalid");
          return;
        }

        log("✅ Default VFS loaded");

        /* ---------- MERGE CUSTOM ARABIC FONT ---------- */
        pdfMakeInstance.vfs = {
          ...defaultVfs,
          ...customVfs,
        };

        /* ---------- HARD ASSERT: FONT KEY ---------- */
        if (!pdfMakeInstance.vfs["Amiri-Regular.ttf"]) {
          log("❌ FONT KEY NOT FOUND IN VFS");
          log("Available VFS keys:");
          log(Object.keys(pdfMakeInstance.vfs));
          return;
        }

        log("✅ FONT KEY CONFIRMED IN VFS");

        /* ---------- iOS-SAFE FONT REGISTRATION ---------- */
        pdfMakeInstance.fonts = {
          Amiri: {
            normal: "Amiri-Regular.ttf",
            bold: "Amiri-Regular.ttf",
            italics: "Amiri-Regular.ttf",
            bolditalics: "Amiri-Regular.ttf",
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

  /* ---------- GENERATE PDF (SAFARI SAFE) ---------- */
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
          text: "تم إنشاؤه بنجاح على iPhone Safari بدون أي أخطاء.",
          fontSize: 14,
        },
      ],
    };

    try {
      log("📄 Creating PDF...");
      pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
        log("✅ Blob created");
        log(`📦 Blob size: ${blob.size} bytes`);

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
      log("❌ PDF generation exception");
      log(e);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h1>Arabic PDF — Final Working Page</h1>

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