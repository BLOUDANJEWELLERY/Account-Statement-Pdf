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

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size in points
    const { width, height } = page.getSize();

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Title
    page.drawText("Shops Balance Sheet", {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Company Name (in Arabic)
    page.drawText("اسم الشركة", {
      x: width - 150,
      y: height - 50,
      size: 18,
      font: boldFont,
    });

    // Table Configuration
    const headers = [
      "No.",
      "Shop Name",
      "999 Gold (Us)",
      "Cash (Us)",
      "999 Gold (You)",
      "Cash (You)",
    ];

    const startY = height - 120;
    const rowHeight = 25;
    const colWidths = [40, 150, 100, 100, 100, 100];

    // Draw table headers
    let x = 50;
    headers.forEach((header, index) => {
      // Header cell background
      page.drawRectangle({
        x,
        y: startY,
        width: colWidths[index],
        height: rowHeight,
        color: rgb(0.9, 0.9, 0.9), // Light gray background
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Header text
      page.drawText(header, {
        x: x + 5,
        y: startY + 7,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      x += colWidths[index];
    });

    // Draw shop rows
    shops.forEach((shop, index) => {
      const y = startY - (index + 1) * rowHeight;
      let rowX = 50;

      // Row data
      const rowData = [
        (index + 1).toString(),
        shop,
        "0",
        "0",
        "0",
        "0"
      ];

      // Draw each cell in the row
      rowData.forEach((cell, cellIndex) => {
        // Cell background (alternating colors)
        const isEvenRow = index % 2 === 0;
        page.drawRectangle({
          x: rowX,
          y,
          width: colWidths[cellIndex],
          height: rowHeight,
          color: isEvenRow ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95),
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        });

        // Cell text
        page.drawText(cell, {
          x: rowX + 5,
          y: y + 7,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });

        rowX += colWidths[cellIndex];
      });
    });

    // Footer with generation date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    page.drawText(`Generated on: ${date}`, {
      x: 50,
      y: 50,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Page number
    page.drawText("Page 1 of 1", {
      x: width - 100,
      y: 50,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=shops_balance.pdf");
    res.setHeader("Cache-Control", "no-store");
    
    // Send the PDF
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("Error generating PDF:", error);
    
    // Send a more detailed error response
    res.status(500).json({ 
      error: "Failed to generate PDF", 
      details: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}