import { useEffect } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

export default function Home() {
  useEffect(() => {
    const fonts = pdfFonts as any;
    pdfMake.vfs = fonts.pdfMake.vfs;

    pdfMake.fonts = {
      Amiri: {
        normal: "Amiri-Regular.ttf",
      },
    };
  }, []);

  const generatePDF = () => {
    const docDefinition: TDocumentDefinitions = {
      defaultStyle: {
        font: "Amiri",
        alignment: "right",
      },
      content: [
        {
          text: "هذا ملف PDF باللغة العربية",
          fontSize: 18,
        },
        {
          text: "تم إنشاؤه بدون أخطاء TypeScript",
          fontSize: 14,
        },
      ],
    };

    pdfMake.createPdf(docDefinition).open();
  };

  return (
    <div style={{ padding: 40 }}>
      <button onClick={generatePDF}>
        Create Arabic PDF
      </button>
    </div>
  );
}