import { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

    // Load Arabic font from Google Fonts CDN
    let arabicFont;
    try {
      const fontUrl = "https://fonts.gstatic.com/s/amiri/v24/J7aRnpd8CGxBHpUutLM.ttf";
      const fontResponse = await fetch(fontUrl);
      const fontBytes = new Uint8Array(await fontResponse.arrayBuffer());
      arabicFont = await pdfDoc.embedFont(fontBytes);
    } catch (fontError) {
      console.log("Using fallback font");
      arabicFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Arabic title
    page.drawText("كشف حساب المحلات التجارية", {
      x: 50,
      y: height - 60,
      size: 24,
      font: arabicFont,
      color: rgb(0, 0, 0),
    });

    // Simple table (without complex RTL layout for now)
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
        shop, // Arabic shop name will display correctly
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
      error: "فشل إنشاء الملف",
      message: error instanceof Error ? error.message : "خطأ غير معروف"
    });
  }
}