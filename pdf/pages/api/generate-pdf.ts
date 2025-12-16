import { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { shops } = req.body;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Logo
  const logoPath = path.join(process.cwd(), "public/logo.png");
  const logoBytes = fs.readFileSync(logoPath);
  const logoImage = await pdfDoc.embedPng(logoBytes);

  page.drawImage(logoImage, {
    x: width - 120,
    y: height - 100,
    width: 80,
    height: 80,
  });

  // Company Name
  page.drawText("اسم الشركة", {
    x: width / 2 - 50,
    y: height - 60,
    size: 18,
    font: boldFont,
  });

  // Table
  const headers = [
    "رقم",
    "مجوهرات",
    "ذهب ٩٩٩ لنا",
    "نقدي لنا",
    "ذهب ٩٩٩ لكم",
    "نقدي لكم",
  ];

  const startY = height - 150;
  const rowHeight = 30;
  const colWidths = [40, 120, 90, 90, 90, 90];

  let x = width - colWidths.reduce((a, b) => a + b, 0) - 30;

  // Header Row
  headers.forEach((text, i) => {
    page.drawRectangle({
      x,
      y: startY,
      width: colWidths[i],
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    page.drawText(text, {
      x: x + 5,
      y: startY + 10,
      size: 10,
      font: boldFont,
    });

    x += colWidths[i];
  });

  // Rows
  shops.forEach((shop: string, index: number) => {
    let rowX = width - colWidths.reduce((a, b) => a + b, 0) - 30;
    const y = startY - (index + 1) * rowHeight;

    const rowData = [String(index + 1), shop, "", "", "", ""];

    rowData.forEach((cell, i) => {
      page.drawRectangle({
        x: rowX,
        y,
        width: colWidths[i],
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      if (cell) {
        page.drawText(cell, {
          x: rowX + 5,
          y: y + 10,
          size: 10,
          font,
        });
      }

      rowX += colWidths[i];
    });
  });

  const pdfBytes = await pdfDoc.save();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=balances.pdf");
  res.setHeader("Cache-Control", "no-store");
  res.send(Buffer.from(pdfBytes));
}