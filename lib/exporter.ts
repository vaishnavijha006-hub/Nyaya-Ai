'use client';

import { toast } from 'sonner';

/**
 * Downloads a text string as a cleanly formatted A4 PDF file using dynamic imports for jsPDF.
 */
export async function downloadPDF(content: string, filename: string = 'RTI_Application.pdf') {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20; // 20mm margins
    const maxLineWidth = pageWidth - margin * 2;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);

    // Split text into lines that fit within margins
    const lines = doc.splitTextToSize(content, maxLineWidth);
    
    let y = 20; // Start at 20mm top margin
    const lineHeight = 6; // 6mm spacing

    lines.forEach((line: string) => {
      // Check if we need to insert a new page
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    doc.save(filename);
    toast.success('PDF download complete!');
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    toast.error('Could not download PDF. Falling back to plain text.');
    downloadTxtFallback(content, filename.replace('.pdf', '.txt'));
  }
}

/**
 * Downloads a text string as an editable DOCX (Microsoft Word) file using dynamic imports.
 */
export async function downloadDOCX(content: string, filename: string = 'RTI_Application.docx') {
  try {
    const { Document, Packer, Paragraph, TextRun } = await import('docx');
    const paragraphs = content.split('\n').map((line) => {
      return new Paragraph({
        children: [
          new TextRun({
            text: line,
            font: 'Calibri',
            size: 22, // 11pt
          }),
        ],
        spacing: {
          after: 120, // Space after paragraph
        },
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Word document download complete!');
  } catch (err) {
    console.error('Failed to generate DOCX:', err);
    toast.error('Could not download DOCX. Falling back to plain text.');
    downloadTxtFallback(content, filename.replace('.docx', '.txt'));
  }
}

function downloadTxtFallback(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
