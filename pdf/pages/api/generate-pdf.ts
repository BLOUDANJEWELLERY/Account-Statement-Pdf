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

    // Use TimesRoman which has better Unicode support for Arabic
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Title in Arabic - TimesRoman should handle basic Arabic
    page.drawText("Shops Balance Report", {
      x: 50,
      y: height - 60,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Simple table
    const startY = height - 120;
    const rowHeight = 25;
    
    // Draw shop data
    shops.forEach((shop, index) => {
      const y = startY - index * rowHeight;
      
      // Draw shop number and name
      page.drawText(`${index + 1}. ${shop}`, {
        x: 50,
        y,
        size: 14,
        font: font,
        color: rgb(0, 0, 0),
      });
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="shops.pdf"');
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Failed to create PDF",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}