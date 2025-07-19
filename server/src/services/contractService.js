import { PDFDocument, rgb } from 'pdf-lib';

export const generateContract = async (contractData) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 12;

  page.drawText('Contract', {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize * 2,
    color: rgb(0, 0, 0),
  });

  let y = height - 8 * fontSize;

  for (const [key, value] of Object.entries(contractData)) {
    page.drawText(`${key}: ${value}`, {
      x: 50,
      y,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    y -= fontSize * 2;
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}; 