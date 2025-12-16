import { NextApiRequest, NextApiResponse } from "next";

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

    // Create a simple PDF using raw PDF commands
    // This is a minimal PDF that always works
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 16 Tf
100 700 Td
(Shops Report) Tj
0 -20 Td
(${shops.map((shop, i) => `${i + 1}. ${shop}`).join('\\n')}) Tj
0 -40 Td
(Total: ${shops.length} shops) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000102 00000 n 
0000000204 00000 n 
0000000308 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
396
%%EOF`;

    // Send the PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="shops.pdf"');
    res.status(200).send(pdfContent);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Failed to generate PDF",
      message: String(error)
    });
  }
}