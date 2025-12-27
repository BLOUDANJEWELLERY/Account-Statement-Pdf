import { useEffect } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

export default function Home() {
  useEffect(() => {
    // 👇 TypeScript fix (this is the key)
    const fonts = pdfFonts as any;

    pdfMake.vfs = fonts.pdfMake.vfs;

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
        { text: "هذا ملف PDF باللغة العربية", fontSize: 18 },
        { text: "يعمل بدون أخطاء في الإنتاج", fontSize: 14 },
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