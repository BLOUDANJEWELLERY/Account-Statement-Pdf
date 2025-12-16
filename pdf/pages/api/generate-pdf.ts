// pages/api/generate-pdf.ts - Working version
import { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse request body
    const { shops } = req.body;
    
    // Validate input
    if (!shops || !Array.isArray(shops)) {
      return res.status(400).json({ error: "Shops array is required" });
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    
    // Add a page
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add title
    page.drawText("SHOPS BALANCE SHEET", {
      x: 50,
      y: height - 50,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0.5),
    });

    // Add company name
    page.drawText("Company Name Here", {
      x: 50,
      y: height - 80,
      size: 14,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Add generation date
    const today = new Date().toLocaleDateString();
    page.drawText(`Generated: ${today}`, {
      x: width - 200,
      y: height - 80,
      size: 12,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Add table headers
    const headers = ["No.", "Shop Name", "Balance"];
    const startY = height - 150;
    const rowHeight = 25;
    const colWidths = [50, 300, 150];

    // Draw header row
    let currentX = 50;
    headers.forEach((header, index) => {
      // Header background
      page.drawRectangle({
        x: currentX,
        y: startY,
        width: colWidths[index],
        height: rowHeight,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Header text
      page.drawText(header, {
        x: currentX + 10,
        y: startY + 7,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      currentX += colWidths[index];
    });

    // Draw shop rows
    shops.forEach((shop: string, index: number) => {
      const rowY = startY - (index + 1) * rowHeight;
      currentX = 50;

      // Row background (alternating colors)
      const isEven = index % 2 === 0;
      page.drawRectangle({
        x: currentX,
        y: rowY,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: rowHeight,
        color: isEven ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5,
      });

      // Row data
      const rowData = [
        (index + 1).toString(),
        shop,
        "0.00"
      ];

      // Draw each cell
      rowData.forEach((cell, cellIndex) => {
        page.drawText(cell, {
          x: currentX + 10,
          y: rowY + 7,
          size: 11,
          font,
          color: rgb(0, 0, 0),
        });

        // Draw vertical lines
        if (cellIndex < headers.length - 1) {
          page.drawLine({
            start: { x: currentX + colWidths[cellIndex], y: rowY },
            end: { x: currentX + colWidths[cellIndex], y: rowY + rowHeight },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
          });
        }

        currentX += colWidths[cellIndex];
      });
    });

    // Add footer
    const totalShops = shops.length;
    const totalY = startY - (totalShops + 1) * rowHeight;
    
    page.drawRectangle({
      x: 50,
      y: totalY - 5,
      width: colWidths.reduce((a, b) => a + b, 0),
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText(`Total Shops: ${totalShops}`, {
      x: 60,
      y: totalY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0.5),
    });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=shops-balance.pdf");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    
    // Send the PDF
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("Error generating PDF:", error);
    
    // Return detailed error in development
    res.status(500).json({ 
      error: "PDF generation failed",
      message: error instanceof Error ? error.message : "Unknown error",
      ...(process.env.NODE_ENV === 'development' && {
        stack: error instanceof Error ? error.stack : undefined
      })
    });
  }
}