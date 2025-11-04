import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a certificate of attendance PDF
 * @param {Object} certificateData - Certificate details
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateCertificate = async (certificateData) => {
  const {
    userName,
    workshopName,
    workshopDate,
    issueDate,
    certificateId
  } = certificateData;

  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: {
          top: 50,
          bottom: 50,
          left: 72,
          right: 72
        }
      });

      // Collect the PDF data in chunks
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Page dimensions (A4 landscape: 842 x 595)
      const pageWidth = 842;
      const pageHeight = 595;

      // Add decorative border
      doc.lineWidth(3);
      doc.strokeColor('#0070f3');
      doc.rect(30, 30, pageWidth - 60, pageHeight - 60).stroke();
      
      doc.lineWidth(1);
      doc.strokeColor('#3498db');
      doc.rect(40, 40, pageWidth - 80, pageHeight - 80).stroke();

      // Add header decoration
      doc.fillColor('#0070f3');
      doc.fontSize(16)
         .text('GUC AL-AHLY CLUB', 0, 70, { align: 'center' });

      // Certificate Title
      doc.fontSize(48)
         .fillColor('#2c3e50')
         .font('Helvetica-Bold')
         .text('Certificate of Attendance', 0, 130, { align: 'center' });

      // Subtitle
      doc.fontSize(14)
         .fillColor('#7f8c8d')
         .font('Helvetica')
         .text('This is to certify that', 0, 200, { align: 'center' });

      // Recipient Name
      doc.fontSize(36)
         .fillColor('#0070f3')
         .font('Helvetica-Bold')
         .text(userName, 0, 230, { align: 'center' });

      // Achievement text
      doc.fontSize(14)
         .fillColor('#7f8c8d')
         .font('Helvetica')
         .text('has successfully attended and completed', 0, 290, { align: 'center' });

      // Workshop Name
      doc.fontSize(24)
         .fillColor('#2c3e50')
         .font('Helvetica-Bold')
         .text(workshopName, 0, 320, { align: 'center', width: pageWidth });

      // Workshop Date
      doc.fontSize(12)
         .fillColor('#7f8c8d')
         .font('Helvetica')
         .text(`Workshop Date: ${workshopDate}`, 0, 370, { align: 'center' });

      // Certificate ID and Issue Date (footer area)
      const footerY = pageHeight - 120;
      
      doc.fontSize(10)
         .fillColor('#95a5a6')
         .font('Helvetica')
         .text(`Certificate ID: ${certificateId}`, 80, footerY, { align: 'left' });
      
      doc.fontSize(10)
         .text(`Issue Date: ${issueDate}`, 0, footerY, { align: 'right', width: pageWidth - 80 });

      // Signature line
      const signatureY = footerY + 30;
      doc.moveTo(pageWidth - 250, signatureY)
         .lineTo(pageWidth - 100, signatureY)
         .strokeColor('#2c3e50')
         .stroke();
      
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text('Authorized Signature', pageWidth - 250, signatureY + 5, { width: 150, align: 'center' });

      // Add decorative elements (corner accents)
      doc.fillColor('#0070f3');
      doc.circle(50, 50, 5).fill();
      doc.circle(pageWidth - 50, 50, 5).fill();
      doc.circle(50, pageHeight - 50, 5).fill();
      doc.circle(pageWidth - 50, pageHeight - 50, 5).fill();

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Format date for display on certificate
 * @param {Date} date 
 * @returns {string}
 */
export const formatCertificateDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
