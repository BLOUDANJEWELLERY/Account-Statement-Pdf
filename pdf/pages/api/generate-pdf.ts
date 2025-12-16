import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { shops } = req.body;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      direction: rtl;
      padding: 40px;
    }
    header {
      text-align: center;
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
      font-size: 14px;
      height: 35px;
    }
    th {
      font-weight: bold;
    }
  </style>
</head>
<body>

<header>
  <h2>اسم الشركة</h2>
</header>

<table>
  <thead>
    <tr>
      <th>رقم</th>
      <th>مجوهرات</th>
      <th>ذهب ٩٩٩ لنا</th>
      <th>نقدي لنا</th>
      <th>ذهب ٩٩٩ لكم</th>
      <th>نقدي لكم</th>
    </tr>
  </thead>
  <tbody>
    ${shops
      .map(
        (shop: string, i: number) => `
      <tr>
        <td>${i + 1}</td>
        <td>${shop}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `
      )
      .join("")}
  </tbody>
</table>

</body>
</html>
`;

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=balances.pdf"
  );
  res.setHeader("Cache-Control", "no-store");

  res.send(pdf);
}