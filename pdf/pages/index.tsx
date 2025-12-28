"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { customVfs } from "../lib/customVfs";

export default function ArabicPdfPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${msg}`]);

useEffect(() => {
  (async () => {
    try {
      log("📦 Importing pdfmake...");
      const pdfMakeModule = await import("pdfmake/build/pdfmake");
      const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

      const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;

      // ⚠️ Force VFS using 'any' cast
      const vfs: any = pdfFontsModule;
      if (!vfs || !vfs.default) throw new Error("VFS missing");

      log("📦 Importing default vfs...");

      pdfMake.vfs = {
        ...(vfs.default || {}),
        ...customVfs,
      };

      pdfMake.fonts = {
        Amiri: {
          normal: "Amiri-Regular.ttf",
          bold: "Amiri-Regular.ttf",
          italics: "Amiri-Regular.ttf",
          bolditalics: "Amiri-Regular.ttf",
        },
      };

      (window as any).pdfMake = pdfMake;
      log("✅ pdfMake READY with Amiri");
    } catch (err: any) {
      log("❌ INIT ERROR: " + err.message);
      log("💡 Hint: pdfmake ESM changed exports, force 'any' on vfsModule");
    }
  })();
}, []);

const createPdf = () => {
  try {
    log("🖱 Button clicked");
    log("📄 Creating PDF...");

    const pdfMake: any = (window as any).pdfMake;
    if (!pdfMake) throw new Error("pdfMake missing");

    // Force VFS check
    if (!pdfMake.vfs || !pdfMake.vfs["Amiri-Regular.ttf"]) {
      throw new Error("Amiri font missing in VFS");
    }

    // Force fonts registration
    pdfMake.fonts = {
      Amiri: {
        normal: "Amiri-Regular.ttf",
        bold: "Amiri-Regular.ttf",
        italics: "Amiri-Regular.ttf",
        bolditalics: "Amiri-Regular.ttf",
      },
    };

    const docDefinition = {
      defaultStyle: {
        font: "Amiri",
        alignment: "right",
      },
      content: [
        { text: "السلام عليكم ورحمة الله وبركاته", fontSize: 18 },
        {
          text: "هذا ملف PDF باللغة العربية يعمل على Safari iPhone.",
          margin: [0, 20, 0, 0],
        },
      ],
    };

    // iOS-safe PDF download
    pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
      if (!blob) throw new Error("Blob generation failed");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "arabic.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      log("⬇️ PDF download triggered (iOS-safe)");
    });
  } catch (err: any) {
    log("❌ PDF ERROR: " + err.message);
  }
};

  return (
    <>
      <Head>
        <title>Arabic PDF Debug</title>
      </Head>

      <main style={{ padding: 20 }}>
        <h1>Arabic PDF Generator</h1>

        <button
          onClick={createPdf}
          style={{
            padding: "12px 20px",
            fontSize: 16,
            background: "#000",
            color: "#fff",
            borderRadius: 6,
          }}
        >
          Create Arabic PDF
        </button>

        <pre
          style={{
            marginTop: 20,
            background: "#111",
            color: "#0f0",
            padding: 12,
            maxHeight: 300,
            overflow: "auto",
            fontSize: 12,
          }}
        >
          {logs.join("\n")}
        </pre>
      </main>
    </>
  );
}