import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BumdesConfig } from '../types';

const getHeaderStyle = () => ({
  font: { bold: true, sz: 14 },
  alignment: { horizontal: 'center', vertical: 'center' }
});

const getSubHeaderStyle = () => ({
  font: { bold: true, sz: 12 },
  alignment: { horizontal: 'center', vertical: 'center' }
});

const getNormalCenterStyle = () => ({
  font: { sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' }
});

const getTableHeaderStyle = () => ({
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "16A34A" } }, // Tailwind green-600
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: "000000" } },
    bottom: { style: 'thin', color: { rgb: "000000" } },
    left: { style: 'thin', color: { rgb: "000000" } },
    right: { style: 'thin', color: { rgb: "000000" } }
  }
});

const getDataStyle = (align: 'left' | 'center' | 'right' = 'left') => ({
  alignment: { horizontal: align, vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: "000000" } },
    bottom: { style: 'thin', color: { rgb: "000000" } },
    left: { style: 'thin', color: { rgb: "000000" } },
    right: { style: 'thin', color: { rgb: "000000" } }
  }
});

const getNumberStyle = () => ({
  alignment: { horizontal: 'right', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: "000000" } },
    bottom: { style: 'thin', color: { rgb: "000000" } },
    left: { style: 'thin', color: { rgb: "000000" } },
    right: { style: 'thin', color: { rgb: "000000" } }
  },
  numFmt: '#,##0'
});

const applyStylesToSheet = (ws: XLSX.WorkSheet, colCount: number, rowCount: number, config: BumdesConfig, title: string) => {
  // Merge header cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: colCount - 1 } },
  ];

  // Apply styles to headers
  ws[XLSX.utils.encode_cell({ r: 0, c: 0 })].s = getHeaderStyle();
  ws[XLSX.utils.encode_cell({ r: 1, c: 0 })].s = getSubHeaderStyle();
  ws[XLSX.utils.encode_cell({ r: 2, c: 0 })].s = getNormalCenterStyle();
  ws[XLSX.utils.encode_cell({ r: 3, c: 0 })].s = getNormalCenterStyle();

  // Apply styles to table headers (row 5, index 4)
  for (let c = 0; c < colCount; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 5, c });
    if (ws[cellRef]) ws[cellRef].s = getTableHeaderStyle();
  }

  // Apply styles to data rows (row 6 to rowCount - 1)
  for (let r = 6; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' }; // Create empty cell if undefined to apply borders
      }
      
      const val = ws[cellRef].v;
      if (typeof val === 'number') {
        ws[cellRef].s = getNumberStyle();
      } else if (typeof val === 'string' && !isNaN(Number(val.replace(/,/g, ''))) && val.trim() !== '') {
         // It might be a formatted number string, but let's just align right if it looks like a number
         ws[cellRef].s = getDataStyle('right');
      } else {
        ws[cellRef].s = getDataStyle('left');
      }
    }
  }

  // Footer styles
  const footerStartRow = rowCount + 1;
  const sigCol1 = colCount > 1 ? 1 : 0;
  const sigCol2 = colCount > 3 ? colCount - 2 : colCount - 1;

  const dateCell = XLSX.utils.encode_cell({ r: footerStartRow, c: sigCol2 });
  if (ws[dateCell]) ws[dateCell].s = { alignment: { horizontal: 'center' } };

  const mengetahuiCell = XLSX.utils.encode_cell({ r: footerStartRow + 1, c: sigCol1 });
  if (ws[mengetahuiCell]) ws[mengetahuiCell].s = { alignment: { horizontal: 'center' } };

  const dibuatCell = XLSX.utils.encode_cell({ r: footerStartRow + 1, c: sigCol2 });
  if (ws[dibuatCell]) ws[dibuatCell].s = { alignment: { horizontal: 'center' } };

  const direkturCell = XLSX.utils.encode_cell({ r: footerStartRow + 2, c: sigCol1 });
  if (ws[direkturCell]) ws[direkturCell].s = { alignment: { horizontal: 'center' } };

  const bendaharaCell = XLSX.utils.encode_cell({ r: footerStartRow + 2, c: sigCol2 });
  if (ws[bendaharaCell]) ws[bendaharaCell].s = { alignment: { horizontal: 'center' } };

  const namaDirekturCell = XLSX.utils.encode_cell({ r: footerStartRow + 6, c: sigCol1 });
  if (ws[namaDirekturCell]) ws[namaDirekturCell].s = { font: { bold: true, underline: true }, alignment: { horizontal: 'center' } };

  const namaBendaharaCell = XLSX.utils.encode_cell({ r: footerStartRow + 6, c: sigCol2 });
  if (ws[namaBendaharaCell]) ws[namaBendaharaCell].s = { font: { bold: true, underline: true }, alignment: { horizontal: 'center' } };

  const devCell = XLSX.utils.encode_cell({ r: footerStartRow + 8, c: 0 });
  if (ws[devCell]) ws[devCell].s = { font: { italic: true, sz: 8, color: { rgb: "888888" } } };
};

export const exportToExcel = (
  data: any[], 
  columns: { header: string; key: string; width?: number }[], 
  filename: string, 
  sheetName: string,
  config: BumdesConfig,
  title: string
) => {
  const wb = XLSX.utils.book_new();
  
  // Create header rows
  const headerRows = [
    [config.namaBumdes.toUpperCase()],
    [title.toUpperCase()],
    [`${config.namaDesa}, Kec. ${config.kecamatan}, Kab. ${config.kabupaten}`],
    [`Periode: Bulan ${config.periodeBulanMulai} - ${config.periodeBulanSelesai} Tahun ${config.periodeTahun}`],
    [], // Empty row
  ];

  // Map data to array of arrays based on columns
  const dataRows = data.map(item => columns.map(col => item[col.key]));
  
  // Column headers
  const colHeaders = columns.map(col => col.header);

  // Combine all rows
  const wsData = [...headerRows, colHeaders, ...dataRows];

  // Add footer
  const colCount = columns.length;
  const sigCol1 = colCount > 1 ? 1 : 0;
  const sigCol2 = colCount > 3 ? colCount - 2 : colCount - 1;
  
  const createEmptyRow = () => Array(colCount).fill('');
  
  wsData.push(createEmptyRow());
  
  const dateRow = createEmptyRow();
  dateRow[sigCol2] = `Tempat/Tanggal: ${config.namaDesa}, ${new Date().toLocaleDateString('id-ID')}`;
  wsData.push(dateRow);
  
  const sigTitleRow = createEmptyRow();
  sigTitleRow[sigCol1] = 'Mengetahui,';
  sigTitleRow[sigCol2] = 'Dibuat oleh,';
  wsData.push(sigTitleRow);
  
  const sigRoleRow = createEmptyRow();
  sigRoleRow[sigCol1] = 'Direktur';
  sigRoleRow[sigCol2] = 'Bendahara';
  wsData.push(sigRoleRow);
  
  wsData.push(createEmptyRow());
  wsData.push(createEmptyRow());
  wsData.push(createEmptyRow());
  
  const sigNameRow = createEmptyRow();
  sigNameRow[sigCol1] = config.direktur;
  sigNameRow[sigCol2] = config.bendahara;
  wsData.push(sigNameRow);
  
  wsData.push(createEmptyRow());
  
  const devRow = createEmptyRow();
  devRow[0] = 'Dikembangkan oleh Imam Sahroni Darmawan';
  wsData.push(devRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

  // Apply styles
  applyStylesToSheet(ws, colCount, headerRows.length + 1 + dataRows.length, config, title);

  // Add sheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Sheet name max 31 chars

  // Save file
  XLSX.writeFile(wb, `${config.namaBumdes.replace(/\s+/g, '_')}_${filename}_${config.periodeTahun}.xlsx`);
};

export const exportConsolidatedExcel = (
  sheets: { data: any[]; columns: { header: string; key: string; width?: number }[]; sheetName: string; title: string }[],
  filename: string,
  config: BumdesConfig
) => {
  const wb = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const headerRows = [
      [config.namaBumdes.toUpperCase()],
      [sheet.title.toUpperCase()],
      [`${config.namaDesa}, Kec. ${config.kecamatan}, Kab. ${config.kabupaten}`],
      [`Periode: Bulan ${config.periodeBulanMulai} - ${config.periodeBulanSelesai} Tahun ${config.periodeTahun}`],
      [],
    ];

    const dataRows = sheet.data.map(item => sheet.columns.map(col => item[col.key]));
    const colHeaders = sheet.columns.map(col => col.header);
    const wsData = [...headerRows, colHeaders, ...dataRows];

    const colCount = sheet.columns.length;
    const sigCol1 = colCount > 1 ? 1 : 0;
    const sigCol2 = colCount > 3 ? colCount - 2 : colCount - 1;
    
    const createEmptyRow = () => Array(colCount).fill('');
    
    wsData.push(createEmptyRow());
    
    const dateRow = createEmptyRow();
    dateRow[sigCol2] = `Tempat/Tanggal: ${config.namaDesa}, ${new Date().toLocaleDateString('id-ID')}`;
    wsData.push(dateRow);
    
    const sigTitleRow = createEmptyRow();
    sigTitleRow[sigCol1] = 'Mengetahui,';
    sigTitleRow[sigCol2] = 'Dibuat oleh,';
    wsData.push(sigTitleRow);
    
    const sigRoleRow = createEmptyRow();
    sigRoleRow[sigCol1] = 'Direktur';
    sigRoleRow[sigCol2] = 'Bendahara';
    wsData.push(sigRoleRow);
    
    wsData.push(createEmptyRow());
    wsData.push(createEmptyRow());
    wsData.push(createEmptyRow());
    
    const sigNameRow = createEmptyRow();
    sigNameRow[sigCol1] = config.direktur;
    sigNameRow[sigCol2] = config.bendahara;
    wsData.push(sigNameRow);
    
    wsData.push(createEmptyRow());
    
    const devRow = createEmptyRow();
    devRow[0] = 'Dikembangkan oleh Imam Sahroni Darmawan';
    wsData.push(devRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = sheet.columns.map(col => ({ wch: col.width || 15 }));

    applyStylesToSheet(ws, colCount, headerRows.length + 1 + dataRows.length, config, sheet.title);

    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName.substring(0, 31));
  });

  XLSX.writeFile(wb, `${config.namaBumdes.replace(/\s+/g, '_')}_${filename}_${config.periodeTahun}.xlsx`);
};

export const exportToPDF = (
  data: any[], 
  columns: { header: string; dataKey: string }[], 
  filename: string, 
  title: string,
  config: BumdesConfig,
  orientation: 'portrait' | 'landscape' = 'portrait'
) => {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(config.namaBumdes.toUpperCase(), pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.namaDesa}, Kec. ${config.kecamatan}, Kab. ${config.kabupaten}`, pageWidth / 2, 28, { align: 'center' });
  
  doc.setFont('helvetica', 'italic');
  doc.text(`Periode: Bulan ${config.periodeBulanMulai} - ${config.periodeBulanSelesai} Tahun ${config.periodeTahun}`, pageWidth / 2, 33, { align: 'center' });
  
  // Line
  doc.setLineWidth(0.5);
  doc.line(15, 36, pageWidth - 15, 36);

  // Table
  autoTable(doc, {
    startY: 40,
    head: [columns.map(col => col.header)],
    body: data.map(item => columns.map(col => item[col.dataKey])),
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: 40, right: 15, bottom: 30, left: 15 },
    didDrawPage: function (data) {
      // Footer
      const str = `Halaman ${(doc as any).internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      const pageHeight = doc.internal.pageSize.height;
      doc.setLineWidth(0.1);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      
      doc.text(`${config.namaBumdes} - ${title}`, 15, pageHeight - 10);
      doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text('Dikembangkan oleh Imam Sahroni Darmawan', 15, pageHeight - 5);
      doc.setTextColor(0);
    }
  });

  // Signatures on last page
  const finalY = (doc as any).lastAutoTable.finalY || 40;
  
  if (finalY + 40 > doc.internal.pageSize.height - 30) {
    doc.addPage();
  }
  
  const sigY = finalY + 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Mengetahui,', 40, sigY, { align: 'center' });
  doc.text('Direktur', 40, sigY + 5, { align: 'center' });
  doc.text(config.direktur, 40, sigY + 25, { align: 'center' });
  
  doc.text(`${config.namaDesa}, ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 40, sigY - 5, { align: 'center' });
  doc.text('Dibuat oleh,', pageWidth - 40, sigY, { align: 'center' });
  doc.text('Bendahara', pageWidth - 40, sigY + 5, { align: 'center' });
  doc.text(config.bendahara, pageWidth - 40, sigY + 25, { align: 'center' });

  doc.save(`${config.namaBumdes.replace(/\s+/g, '_')}_${filename}_${config.periodeTahun}.pdf`);
};
