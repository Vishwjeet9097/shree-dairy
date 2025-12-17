
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { InvoiceData } from '../types';

// Helper to convert text to image using Canvas (for Hindi/Special Fonts)
const textToDataUrl = (text: string, fontSize: number, color: string): { dataUrl: string, width: number, height: number } => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dataUrl: '', width: 0, height: 0 };
    
    // Scale up for quality (2x retina)
    const scale = 3; 
    const font = `bold ${fontSize * scale}px "Hind", "Poppins", sans-serif`;
    ctx.font = font;
    
    const textMetrics = ctx.measureText(text);
    const width = textMetrics.width;
    const height = fontSize * scale * 1.5; // Line height approx

    canvas.width = width + 40; // Extra Padding
    canvas.height = height + 40;

    // Reset font after resize
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    // Draw centered
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    return {
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width / scale, // Return logical dimensions
        height: canvas.height / scale
    };
};

// Generate the PDF Object (Document)
export const createInvoicePDF = async (data: InvoiceData): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  
  // -- COLORS --
  const primaryColor = [132, 204, 22]; // Lime 500 (#84cc16)
  const darkColor = [17, 24, 39]; // Gray 900
  const grayColor = [107, 114, 128]; // Gray 500
  const lightBg = [249, 250, 251]; // Gray 50
  const redColor = [220, 38, 38]; // Red 600
  const watermarkColor = "#dc2626"; // Red Hex for Canvas

  // -- WATERMARK --
  const watermarkText = "श्री";
  const watermarkImg = textToDataUrl(watermarkText, 120, watermarkColor); 
  
  if (watermarkImg.dataUrl) {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.08 })); 
      const x = pageWidth / 2;
      const y = pageHeight / 2;
      doc.addImage(
          watermarkImg.dataUrl, 
          'PNG', 
          x - (watermarkImg.width / 2), 
          y - (watermarkImg.height / 2), 
          watermarkImg.width, 
          watermarkImg.height,
          undefined, 
          'FAST'
      );
      doc.restoreGraphicsState();
  }

  // -- HEADER BACKGROUND --
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // -- BRANDING LEFT --
  const brandText = data.businessDetails.businessNameHi || "श्री";
  const brandImg = textToDataUrl(brandText, 32, "#dc2626"); 

  let headerContentHeight = 25; // Base height reference

  if (brandImg.dataUrl) {
      let displayW = brandImg.width * 0.264583 * 1.5; 
      let displayH = brandImg.height * 0.264583 * 1.5;
      
      doc.addImage(brandImg.dataUrl, 'PNG', margin, 12, displayW, displayH);
      
      doc.setFontSize(10);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      const subTitleY = 12 + displayH - 2;
      doc.text(data.businessDetails.businessName || "Dairy Farm", margin, subTitleY);
      headerContentHeight = Math.max(headerContentHeight, subTitleY);
  } else {
      doc.setFontSize(26);
      doc.setTextColor(redColor[0], redColor[1], redColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text("SHREE", margin, 25);
  }

  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text("Fresh & Organic Milk Delivery", margin, headerContentHeight + 8);

  // -- INVOICE META RIGHT --
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("INVOICE #", pageWidth - margin, 20, { align: 'right' });
  
  doc.setFontSize(14);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(data.invoiceNumber, pageWidth - margin, 27, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text("Issued Date:", pageWidth - 45, 36, { align: 'right' });
  doc.text(data.date, pageWidth - margin, 36, { align: 'right' });
  
  doc.setTextColor(redColor[0], redColor[1], redColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text("Due Date:", pageWidth - 45, 42, { align: 'right' });
  doc.text(data.dueDate, pageWidth - margin, 42, { align: 'right' });

  // -- DYNAMIC ADDRESS SECTION --
  const startY = 70;
  const colWidth = (pageWidth / 2) - margin - 10;
  
  // 1. BILL TO (Left Column)
  let leftY = startY;
  
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text("BILL TO", margin, leftY);
  leftY += 8;
  
  doc.setFontSize(14);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(data.customer.name, margin, leftY);
  leftY += 7; // Spacing after Name
  
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont('helvetica', 'normal');
  
  if (data.customer.phone) {
    doc.text(`+91 ${data.customer.phone}`, margin, leftY);
    leftY += 5;
  }
  
  if (data.customer.address) {
    const splitAddress = doc.splitTextToSize(data.customer.address, colWidth);
    doc.text(splitAddress, margin, leftY);
    leftY += (splitAddress.length * 5);
  }

  // 2. FROM (Right Column)
  let rightY = startY;
  const rightColX = pageWidth / 2 + 10;
  
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text("FROM", rightColX, rightY);
  rightY += 8;
  
  doc.setFontSize(14);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(data.businessDetails.businessName || "Shree Dairy", rightColX, rightY);
  rightY += 7;
  
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont('helvetica', 'normal');
  
  doc.text(data.businessDetails.ownerName, rightColX, rightY);
  rightY += 5;

  const splitBusinessAddress = doc.splitTextToSize(data.businessDetails.address, colWidth);
  doc.text(splitBusinessAddress, rightColX, rightY);
  rightY += (splitBusinessAddress.length * 5);

  doc.text(`Ph: ${data.businessDetails.phone}`, rightColX, rightY);
  rightY += 5;

  // -- TABLE SECTION --
  // Determine where the table should start (below the lowest address column + padding)
  const tableStartY = Math.max(leftY, rightY) + 15;

  const tableData = data.items.map(item => [
    item.description,
    item.rate,
    item.qty,
    `INR ${item.total.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Rate', 'Qty', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
        fillColor: primaryColor, 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left',
        cellPadding: 6
    },
    styles: {
        fontSize: 10,
        cellPadding: 6,
        textColor: darkColor,
        lineColor: [229, 231, 235],
        lineWidth: 0.1
    },
    alternateRowStyles: {
        fillColor: [249, 250, 251]
    },
    columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold' }, 
        3: { halign: 'right', fontStyle: 'bold' } 
    }
  });

  // -- TOTALS SECTION --
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const rightMargin = pageWidth - margin;
  const labelX = rightMargin - 50;
  
  let currentY = finalY + 5;

  // Ensure we don't run off the page
  if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
  }

  const drawTotalRow = (label: string, value: string, isTotal: boolean = false, isDeduction: boolean = false) => {
      doc.setFontSize(10);
      if (isTotal) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFontSize(14);
      } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      }
      
      doc.text(label, labelX, currentY, { align: 'right' });
      
      if (isDeduction) doc.setTextColor(redColor[0], redColor[1], redColor[2]);
      else if (!isTotal) doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      doc.text(value, rightMargin, currentY, { align: 'right' });
      currentY += isTotal ? 12 : 8;
  };

  drawTotalRow("Current Bill:", `INR ${data.totals.subtotal.toFixed(2)}`);
  
  if (data.totals.previousDue > 0) {
      drawTotalRow("Previous Due:", `INR ${data.totals.previousDue.toFixed(2)}`);
  } else if (data.totals.previousDue < 0) {
      drawTotalRow("Advance:", `- INR ${Math.abs(data.totals.previousDue).toFixed(2)}`, false, true);
  }

  drawTotalRow("Paid:", `- INR ${data.totals.paid.toFixed(2)}`, false, true);
  
  doc.setDrawColor(229, 231, 235);
  doc.line(labelX - 10, currentY - 2, rightMargin, currentY - 2);
  currentY += 6;

  drawTotalRow("Total:", `INR ${data.totals.grandTotal.toFixed(2)}`, true);


  // -- FOOTER --
  const footerY = pageHeight - 20;
  
  doc.setFontSize(8);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text("PAYMENT INFO", margin, footerY - 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contact: ${data.businessDetails.phone}`, margin, footerY);
  
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text("Thank you!", pageWidth / 2, footerY, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text("Page 1 of 1", rightMargin, footerY, { align: 'right' });

  return doc;
};

// -- HELPERS --
export const saveInvoice = async (doc: jsPDF, filename: string): Promise<string> => {
    if (Capacitor.isNativePlatform()) {
        const base64 = doc.output('datauristring').split(',')[1];
        const result = await Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Documents,
        });
        return result.uri;
    } else {
        doc.save(filename);
        return '';
    }
};

export const shareInvoice = async (uri: string, title: string) => {
    await Share.share({
        title: title,
        url: uri,
        dialogTitle: 'Share Invoice'
    });
};
