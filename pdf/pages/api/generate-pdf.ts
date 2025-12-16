import { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers BEFORE piping
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="shops.pdf"');

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add Arabic content
    // PDFKit has built-in support for Unicode including Arabic
    doc.fontSize(25).text('كشف حساب المحلات التجارية', { align: 'right' });
    doc.moveDown();
    
    doc.fontSize(16).text('اسم الشركة: شركة المجوهرات المتحدة', { align: 'right' });
    doc.moveDown();
    
    doc.fontSize(12).text(`تاريخ: ${new Date().toLocaleDateString('ar-SA')}`, { align: 'right' });
    doc.moveDown(2);

    // Create table headers
    const headers = ['م', 'اسم المحل', 'ذهب ٩٩٩ لنا', 'نقدي لنا', 'ذهب ٩٩٩ لكم', 'نقدي لكم'];
    
    // Table position
    const startY = doc.y;
    const colWidths = [30, 120, 70, 70, 70, 70];
    const rowHeight = 25;

    // Draw table headers
    let x = 50;
    headers.forEach((header, i) => {
      doc.rect(x, startY, colWidths[i], rowHeight).stroke();
      doc.fontSize(10).text(header, x + 5, startY + 8, {
        width: colWidths[i] - 10,
        align: 'center'
      });
      x += colWidths[i];
    });

    // Draw shop rows
    let currentY = startY + rowHeight;
    
    shops.forEach((shop, index) => {
      x = 50;
      const rowData = [
        (index + 1).toString(),
        shop,
        '٠',
        '٠',
        '٠',
        '٠'
      ];

      // Draw row background (alternating colors)
      if (index % 2 === 0) {
        doc.rect(x, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
          .fillColor('#f5f5f5').fill();
      }

      // Draw cells
      rowData.forEach((cell, i) => {
        doc.rect(x, currentY, colWidths[i], rowHeight).stroke();
        doc.fillColor('black');
        doc.fontSize(10).text(cell, x + 5, currentY + 8, {
          width: colWidths[i] - 10,
          align: i === 1 ? 'right' : 'center' // Shop name right-aligned for Arabic
        });
        x += colWidths[i];
      });

      currentY += rowHeight;
      
      // Add new page if needed
      if (currentY > 750 && index < shops.length - 1) {
        doc.addPage();
        currentY = 50;
      }
    });

    // Add footer
    doc.fontSize(10).text(
      `إجمالي عدد المحلات: ${shops.length}`,
      50,
      currentY + 20,
      { align: 'right' }
    );

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}