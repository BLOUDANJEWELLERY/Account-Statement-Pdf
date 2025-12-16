import type { NextApiRequest, NextApiResponse } from 'next';
import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

const fonts = {
  Amiri: {
    normal: 'public/fonts/Amiri-Regular.ttf',
    bold: 'public/fonts/Amiri-Regular.ttf',
    italics: 'public/fonts/Amiri-Regular.ttf',
    bolditalics: 'public/fonts/Amiri-Regular.ttf',
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const printer = new PdfPrinter(fonts);

  const { text } = req.body as { text: string }; // ensure TypeScript knows it's a string

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: text || 'مرحبا بالعالم', font: 'Amiri', alignment: 'right' },
    ],
    defaultStyle: {
      font: 'Amiri',
    },
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks: Uint8Array[] = [];

  pdfDoc.on('data', (chunk) => chunks.push(chunk));
  pdfDoc.on('end', () => {
    const result = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=arabic.pdf');
    res.send(result);
  });

  pdfDoc.end();
}