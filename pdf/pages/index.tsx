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
        const vfsModule = await import("pdfmake/build/vfs_fonts");

        const pdfMake: any =
          (pdfMakeModule as any).default || pdfMakeModule;

        // 🔥 TYPE OVERRIDE (THIS IS THE FIX)
        const defaultVfs = (vfsModule as any).pdfMake?.vfs;
        if (!defaultVfs) throw new Error("Default VFS missing");

        log("📦 Importing default vfs...");

        pdfMake.vfs = {
          ...defaultVfs,
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

        if (!pdfMake.vfs["Amiri-Regular.ttf"]) {
          throw new Error("Amiri font NOT found in VFS");
        }

        // Safari global lock
        (window as any).pdfMake = pdfMake;

        log("✅ pdfMake READY with Amiri");
      } catch (err: any) {
        log("❌ INIT ERROR: " + err.message);
      }
    })();
  }, []);

  const createPdf = () => {
    try {
      log("🖱 Button clicked");
      log("📄 Creating PDF...");

      const pdfMake = (window as any).pdfMake;
      if (!pdfMake) throw new Error("pdfMake missing");

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

      pdfMake.createPdf(docDefinition).open();
      log("✅ PDF OPENED");
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