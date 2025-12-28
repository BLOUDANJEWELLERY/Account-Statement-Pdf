import { useState, ChangeEvent } from "react";
import Head from "next/head";

export default function TtfToPdfMakeVFS() {
  const [vfsObject, setVfsObject] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".ttf")) {
      alert("Please upload a TTF file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];

      // pdfMake VFS format: { "FontName.ttf": "<base64>" }
      const fontName = file.name;
      const vfs = {
        [fontName]: base64,
      };

      setVfsObject(JSON.stringify(vfs, null, 2));
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(vfsObject);
    alert("VFS object copied to clipboard!");
  };

  return (
    <>
      <Head>
        <title>TTF to pdfMake VFS</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-4">TTF to pdfMake VFS Converter</h1>
        <input type="file" accept=".ttf" onChange={handleFileChange} className="mb-4" />
        {vfsObject && (
          <div className="w-full max-w-xl bg-white p-4 rounded shadow">
            <textarea
              readOnly
              value={vfsObject}
              rows={10}
              className="w-full border p-2 rounded mb-2"
            />
            <button
              onClick={handleCopy}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Copy VFS
            </button>
          </div>
        )}
      </div>
    </>
  );
}