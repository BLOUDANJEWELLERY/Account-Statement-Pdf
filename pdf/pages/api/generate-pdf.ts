import { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { shops } = req.body;

    if (!shops || !Array.isArray(shops)) {
      return res.status(400).json({ error: "Invalid shops data" });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    // Load Arabic font from local file
    let arabicFont;
    try {
      // Read the font file from public directory
      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf');
      const fontBytes = fs.readFileSync(fontPath);
      arabicFont = await pdfDoc.embedFont(fontBytes);
    } catch (fontError) {
      console.error("Failed to load Arabic font:", fontError);
      // Fallback to TimesRoman which has better Unicode support
      arabicFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    }

    const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Title
    page.drawText("كشف حساب المحلات التجارية", {
      x: 50,
      y: height - 60,
      size: 24,
      font: arabicFont,
      color: rgb(0, 0, 0),
    });

    // Simple table
    const headers = ["م", "اسم المحل", "التاريخ", "المبلغ"];
    const colWidths = [40, 200, 150, 100];
    const startY = height - 150;
    const rowHeight = 25;

    // Draw headers
    let x = 50;
    headers.forEach((header, i) => {
      page.drawRectangle({
        x,
        y: startY,
        width: colWidths[i],
        height: rowHeight,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      page.drawText(header, {
        x: x + 5,
        y: startY + 7,
        size: 12,
        font: arabicFont,
      });

      x += colWidths[i];
    });

    // Draw shop data
    shops.forEach((shop, index) => {
      const y = startY - (index + 1) * rowHeight;
      let rowX = 50;

      const rowData = [
        (index + 1).toString(),
        shop,
        new Date().toLocaleDateString('ar-SA'),
        "٠ دينار"
      ];

      rowData.forEach((cell, i) => {
        page.drawRectangle({
          x: rowX,
          y,
          width: colWidths[i],
          height: rowHeight,
          color: index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95),
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        });

        // Use Arabic font for all cells
        page.drawText(cell, {
          x: rowX + 5,
          y: y + 7,
          size: 11,
          font: arabicFont,
          color: rgb(0, 0, 0),
        });

        rowX += colWidths[i];
      });
    });

    // Footer
    page.drawText(`عدد المحلات: ${shops.length}`, {
      x: 50,
      y: 50,
      size: 14,
      font: arabicFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="shops.pdf"');
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Failed to create file",
      message: error instanceof Error ? error.message : "Unknown error",
      // Include more details for debugging
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}