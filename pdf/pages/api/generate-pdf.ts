import { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

// Helper function to load font file
async function loadFont(fontPath: string): Promise<Uint8Array> {
  try {
    // Check if file exists
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Font file not found at: ${fontPath}`);
    }
    
    const fontBytes = fs.readFileSync(fontPath);
    return new Uint8Array(fontBytes);
  } catch (error) {
    console.error("Error loading font:", error);
    throw error;
  }
}

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
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Try to load Arabic font
    let arabicFont;
    try {
      // Path to Arabic font
      const fontPath = path.join(process.cwd(), "public", "fonts", "Amiri-Regular.ttf");
      const fontBytes = await loadFont(fontPath);
      arabicFont = await pdfDoc.embedFont(fontBytes);
    } catch (fontError) {
      console.log("Arabic font not found, using fallback font");
      // Fallback to standard font (won't display Arabic correctly)
      arabicFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // Load standard font for English text
    const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Title (in Arabic)
    page.drawText("كشف حسابات المحلات", {
      x: width / 2 - 100,
      y: height - 50,
      size: 24,
      font: arabicFont,
      color: rgb(0, 0, 0.5),
    });

    // Company Name (in Arabic)
    page.drawText("اسم الشركة", {
      x: 50,
      y: height - 50,
      size: 18,
      font: arabicFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Date (in Arabic)
    const hijriDate = getHijriDate(); // You'll need to implement this or use a library
    page.drawText(`التاريخ: ${hijriDate}`, {
      x: width - 200,
      y: height - 50,
      size: 12,
      font: arabicFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Table headers (in Arabic - right to left)
    const headers = [
      "النقدي لكم",
      "ذهب ٩٩٩ لكم", 
      "النقدي لنا",
      "ذهب ٩٩٩ لنا",
      "اسم المحل",
      "م"
    ];

    const startY = height - 120;
    const rowHeight = 30;
    const colWidths = [90, 90, 90, 90, 150, 40]; // Reversed for RTL

    // Draw table headers (from right to left)
    let currentX = width - 50; // Start from right
    
    headers.forEach((header, index) => {
      // Draw header cell
      page.drawRectangle({
        x: currentX - colWidths[index],
        y: startY,
        width: colWidths[index],
        height: rowHeight,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Draw header text (Arabic, right-aligned)
      const textWidth = colWidths[index] - 10; // Padding
      
      // For Arabic text, we need to position it to the right within the cell
      page.drawText(header, {
        x: currentX - colWidths[index] + 5, // Start from left with padding
        y: startY + 10,
        size: 12,
        font: arabicFont,
        color: rgb(0, 0, 0),
      });

      currentX -= colWidths[index];
    });

    // Draw shop rows
    shops.forEach((shop: string, index: number) => {
      const rowY = startY - (index + 1) * rowHeight;
      currentX = width - 50;

      // Row background (alternating colors)
      const isEvenRow = index % 2 === 0;
      page.drawRectangle({
        x: currentX - colWidths.reduce((a, b) => a + b, 0),
        y: rowY,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: rowHeight,
        color: isEvenRow ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
      });

      // Row data (reversed for RTL)
      const rowData = [
        "٠", // النقدي لكم
        "٠", // ذهب ٩٩٩ لكم
        "٠", // النقدي لنا
        "٠", // ذهب ٩٩٩ لنا
        shop, // اسم المحل
        (index + 1).toString() // م (number)
      ];

      // Draw each cell (from right to left)
      rowData.forEach((cell, cellIndex) => {
        // Choose font based on content
        const useArabicFont = /[\u0600-\u06FF]/.test(cell) || cellIndex === 4 || cellIndex === 5;
        const fontToUse = useArabicFont ? arabicFont : standardFont;

        // Draw cell text
        page.drawText(cell, {
          x: currentX - colWidths[cellIndex] + 5,
          y: rowY + 10,
          size: 11,
          font: fontToUse,
          color: rgb(0, 0, 0),
        });

        // Move left for next cell
        currentX -= colWidths[cellIndex];
      });
    });

    // Footer with totals
    const totalY = startY - (shops.length + 1) * rowHeight;
    
    page.drawText(`إجمالي المحلات: ${shops.length}`, {
      x: width - 200,
      y: totalY - 20,
      size: 14,
      font: arabicFont,
      color: rgb(0, 0, 0.5),
    });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=كشف-الحسابات.pdf");
    res.setHeader("Cache-Control", "no-store");
    
    // Send the PDF
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("Error generating PDF:", error);
    
    res.status(500).json({ 
      error: "فشل إنشاء ملف PDF",
      message: error instanceof Error ? error.message : "خطأ غير معروف",
    });
  }
}

// Simple function to get Hijri date (you might want to use a proper library)
function getHijriDate(): string {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'islamic',
    numberingSystem: 'arab'
  };
  
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', options).format(today);
  } catch (e) {
    return "١٤٤٥/٠٥/١٠"; // Fallback date
  }
}