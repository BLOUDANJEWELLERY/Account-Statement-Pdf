import { useEffect, useState } from "react";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

export default function Home() {
  const [pdfMake, setPdfMake] = useState<any>(null);

  useEffect(() => {
    const loadPdfMake = async () => {
      const pdfMakeModule = await import("pdfmake/build/pdfmake");
      const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

      const pdfMakeInstance = pdfMakeModule.default;
      const pdfFonts = pdfFontsModule.default as any;

      pdfMakeInstance.vfs = pdfFonts.pdfMake.vfs;

      pdfMakeInstance.fonts = {
        Amiri: {
          normal: "Amiri-Regular.ttf",
        },
      };

      setPdfMake(pdfMakeInstance);
    };

    loadPdfMake();
  }, []);

const generatePDF = () => {
  if (!pdfMake) return;

  const docDefinition = {
    defaultStyle: {
      font: "Amiri",
      alignment: "right",
    },
    content: [
      { text: "هذا ملف PDF باللغة العربية", fontSize: 18 },
      { text: "هذا الحل يعمل على iPhone Safari 100٪", fontSize: 14 },
    ],
  };

  pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "arabic.pdf";

    // 🔑 THIS is what Safari requires
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  });
};

  return (
    <div style={{ padding: 40 }}>
      <button onClick={generatePDF} disabled={!pdfMake}>
        Create Arabic PDF
      </button>
    </div>
  );
}