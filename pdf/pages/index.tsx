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

  useEffect(() => {
    log("🚀 useEffect started (client)");

    const load = async () => {
      try {
        log("📦 Importing pdfmake...");
        const pdfMakeModule = await import("pdfmake/build/pdfmake");
        const vfsModule = await import("pdfmake/build/vfs_fonts");

        const pdfMakeInstance = pdfMakeModule.default;

        // SAFARI-SAFE VFS
        const vfs =
          (vfsModule as any).pdfMake?.vfs ||
          (vfsModule as any).default?.pdfMake?.vfs ||
          (vfsModule as any).default ||
          null;

        if (!vfs) {
          log("❌ VFS NOT FOUND");
          return;
        }

        log("✅ VFS FOUND");
        pdfMakeInstance.vfs = vfs;

        // Use built-in Roboto font (always works)
        pdfMakeInstance.fonts = {
          Roboto: {
            normal: "Roboto-Regular.ttf",
            bold: "Roboto-Medium.ttf",
            italics: "Roboto-Italic.ttf",
            bolditalics: "Roboto-MediumItalic.ttf",
          },
        };

        log("✅ pdfMake READY");
        setPdfMake(pdfMakeInstance);
      } catch (err) {
        log("❌ pdfMake load failed");
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
          font: "Roboto", // Using built-in font
          alignment: "right",
        },
        content: [
          { text: "هذا ملف PDF باللغة العربية", fontSize: 18 },
          { text: "يعمل الآن على iPhone Safari و أي متصفح آخر", fontSize: 14 },
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
        a.download = "arabic-roboto.pdf";

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
      <h1>Arabic PDF Debug Mode</h1>

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