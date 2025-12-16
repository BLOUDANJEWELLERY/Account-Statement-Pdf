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
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Try to load logo if it exists
    try {
      // For Vercel/Netlify deployment, we need to fetch the logo from the public URL
      // In development, we can use the local URL
      const isDev = process.env.NODE_ENV === "development";
      const logoUrl = isDev 
        ? `http://${req.headers.host}/logo.png`
        : `https://${req.headers.host}/logo.png`;
      
      const response = await fetch(logoUrl);
      if (response.ok) {
        const logoBytes = await response.arrayBuffer();
        const logoImage = await pdfDoc.embedPng(logoBytes);
        
        page.drawImage(logoImage, {
          x: width - 120,
          y: height - 100,
          width: 80,
          height: 80,
        });
      }
    } catch (logoError) {
      console.log("Logo not loaded, continuing without it:", logoError);
      // Continue without logo if there's an error
    }

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
    res.setHeader("Content-Disposition", "attachment; filename=balances.pdf");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ 
      error: "Failed to generate PDF", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}