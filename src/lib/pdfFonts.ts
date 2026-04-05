import type jsPDF from "jspdf";

export const PDF_FONT_FAMILIES = {
  centuryGothic: "CenturyGothic",
  calibri: "Calibri",
} as const;

type PdfFontDefinition = {
  family: string;
  fileName: string;
  style: "normal" | "bold";
  url: string;
};

const PDF_FONT_DEFINITIONS: PdfFontDefinition[] = [
  {
    family: PDF_FONT_FAMILIES.centuryGothic,
    fileName: "century-gothic.ttf",
    style: "normal",
    url: "/fonts/century-gothic.ttf",
  },
  {
    family: PDF_FONT_FAMILIES.centuryGothic,
    fileName: "century-gothic-bold.ttf",
    style: "bold",
    url: "/fonts/century-gothic-bold.ttf",
  },
  {
    family: PDF_FONT_FAMILIES.calibri,
    fileName: "calibri.ttf",
    style: "normal",
    url: "/fonts/calibri.ttf",
  },
  {
    family: PDF_FONT_FAMILIES.calibri,
    fileName: "calibri-bold.ttf",
    style: "bold",
    url: "/fonts/calibri-bold.ttf",
  },
];

const fontBase64Cache = new Map<string, Promise<string>>();
const initializedPdfInstances = new WeakSet<jsPDF>();

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const loadFontAsBase64 = async (url: string) => {
  const cached = fontBase64Cache.get(url);
  if (cached) {
    return cached;
  }

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch font: ${url}`);
      }

      return arrayBufferToBase64(await response.arrayBuffer());
    });

  fontBase64Cache.set(url, request);
  return request;
};

export const ensurePdfFonts = async (pdf: jsPDF) => {
  if (initializedPdfInstances.has(pdf)) {
    return;
  }

  for (const font of PDF_FONT_DEFINITIONS) {
    const base64 = await loadFontAsBase64(font.url);
    pdf.addFileToVFS(font.fileName, base64);
    pdf.addFont(font.fileName, font.family, font.style);
  }

  initializedPdfInstances.add(pdf);
};
