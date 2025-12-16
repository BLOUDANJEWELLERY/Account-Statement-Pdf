import type { NextApiRequest, NextApiResponse } from 'next';
import PdfPrinter from 'pdfmake';

const fonts = {
  // Make sure you have an Arabic font file in public/fonts
  Cairo: {
    normal: 'public/fonts/Cairo-Regular.ttf',
    bold: 'public/fonts/Cairo-Bold.ttf',
    italics: 'public/fonts/Cairo-Regular.ttf',
    bolditalics: 'public/fonts/Cairo-Bold.ttf',
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const printer = new PdfPrinter(fonts);

  const { text } = req.body; // receive Arabic text from frontend

  const docDefinition = {
    content: [
      { text: text || 'مرحبا بالعالم', font: 'Cairo', alignment: 'right' }, // RTL
    ],
    defaultStyle: {
      font: 'Cairo',
    },
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  let chunks: Uint8Array[] = [];

  pdfDoc.on('data', (chunk) => chunks.push(chunk));
  pdfDoc.on('end', () => {
    const result = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=arabic.pdf');
    res.send(result);
  });

  pdfDoc.end();
}