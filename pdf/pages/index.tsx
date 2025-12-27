import { useEffect } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

export default function CreatePdfPage() {
  useEffect(() => {
    pdfMake.vfs = {
      ...pdfFonts.pdfMake.vfs,
      "Amiri-Regular.ttf": "/fonts/Amiri-Regular.ttf",
    };

    pdfMake.fonts = {
      Amiri: {
        normal: "Amiri-Regular.ttf",
      },
    };
  }, []);

  const generatePDF = () => {
    const docDefinition = {
      defaultStyle: {
        font: "Amiri",
        alignment: "right",
      },
      content: [
        {
          text: "هذا ملف PDF باللغة العربية",
          fontSize: 18,
          margin: [0, 0, 0, 10],
        },
        {
          text: "يتم إنشاء هذا الملف باستخدام Next.js و TypeScript.",
          fontSize: 14,
        },
      ],
    };

    pdfMake.createPdf(docDefinition).open();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Arabic PDF Generator</h1>
      <button
        onClick={generatePDF}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Create Arabic PDF
      </button>
    </div>
  );
}