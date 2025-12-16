import { NextApiRequest, NextApiResponse } from "next";
import chromium from 'chrome-aws-lambda';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let browser = null;
  
  try {
    const { shops } = req.body;

    if (!shops || !Array.isArray(shops)) {
      return res.status(400).json({ error: "Invalid shops data" });
    }

    // Launch browser
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Create HTML content with Arabic support
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
          
          body {
            font-family: 'Noto Sans Arabic', sans-serif;
            padding: 40px;
            direction: rtl;
            text-align: right;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .title {
            font-size: 28px;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          
          .company-name {
            font-size: 20px;
            color: #7f8c8d;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
          }
          
          th {
            background-color: #f8f9fa;
            padding: 15px;
            text-align: center;
            border: 1px solid #dee2e6;
            font-weight: bold;
          }
          
          td {
            padding: 12px;
            text-align: center;
            border: 1px solid #dee2e6;
          }
          
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #7f8c8d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">كشف حساب المحلات التجارية</h1>
          <div class="company-name">اسم الشركة: شركة المجوهرات المتحدة</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>م</th>
              <th>اسم المحل</th>
              <th>ذهب ٩٩٩ لنا</th>
              <th>نقدي لنا</th>
              <th>ذهب ٩٩٩ لكم</th>
              <th>نقدي لكم</th>
            </tr>
          </thead>
          <tbody>
            ${shops.map((shop, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${shop}</td>
                <td>٠</td>
                <td>٠</td>
                <td>٠</td>
                <td>٠</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</p>
          <p>عدد المحلات: ${shops.length}</p>
        </div>
      </body>
      </html>
    `;

    // Set HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    // Close browser
    await browser.close();

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="shops.pdf"');
    res.status(200).send(pdf);

  } catch (error) {
    console.error('Error:', error);
    if (browser) await browser.close();
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}