import { jsPDF } from 'jspdf';
import { formatCOP } from '@/app/admin/components/shared';

interface QuoteTotals {
  subtotalFabricacion: number;
  ganancia: number;
  total: number;
}

async function fetchImageDataUrl(
  imageUrl: string,
  format: 'PNG' | 'JPEG' = 'JPEG',
): Promise<{ dataUrl: string; width: number; height: number; format: 'PNG' | 'JPEG' } | null> {
  try {
    return await new Promise<{ dataUrl: string; width: number; height: number; format: 'PNG' | 'JPEG' }>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No se puede acceder al canvas.'));
        ctx.drawImage(img, 0, 0);
        const dataUrl = format === 'PNG' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
        resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight, format });
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
      img.src = imageUrl;
    });
  } catch {
    return null;
  }
}

function formatQuoteDate(isoDate?: string) {
  if (!isoDate) return 'N/A';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'N/A';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Genera el PDF de una cotización y abre WhatsApp con el mensaje al cliente.
 * Si el cliente no tiene un teléfono válido, lanza un Error con el mensaje a
 * mostrar (el caller lo atrapa y lo pasa a su propio setError) en vez de
 * manejar el estado de error acá — esta función no conoce React.
 */
export async function generateQuotePdfAndOpenWhatsApp(selectedQuote: any, totals: QuoteTotals): Promise<void> {
  const cliente = selectedQuote.cliente || {};
  const clienteNombre = cliente.nombre || 'Cliente';
  const clienteCedula = cliente.cedula || 'No disponible';
  const clienteTelefono = String(cliente.telefono || '').replace(/[^0-9]/g, '');

  if (!clienteTelefono) {
    throw new Error('El teléfono del cliente no es válido para WhatsApp. Verifica el número en la cotización.');
  }

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const drawField = (
    x: number,
    yPos: number,
    label: string,
    value: string,
    opts: { size?: number } = {},
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(opts.size || 10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x, yPos + 13);
  };

  const drawImageFit = (dataUrl: string, format: 'PNG' | 'JPEG', natW: number, natH: number, boxX: number, boxY: number, boxW: number, boxH: number) => {
    const scale = Math.min(boxW / natW, boxH / natH);
    const w = natW * scale;
    const h = natH * scale;
    doc.addImage(dataUrl, format, boxX + (boxW - w) / 2, boxY + (boxH - h) / 2, w, h);
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 50) {
      doc.addPage();
      y = 40;
    }
  };

  // ── Encabezado ──────────────────────────────────────────
  const headerH = 90;
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 0, pageWidth, headerH, 'F');

  let logoW = 0;
  const logoData = await fetchImageDataUrl('/logo.png', 'PNG');
  if (logoData) {
    const logoBox = 46;
    const scale = Math.min(logoBox / logoData.width, logoBox / logoData.height);
    logoW = logoData.width * scale;
    const logoH = logoData.height * scale;
    doc.addImage(logoData.dataUrl, 'PNG', margin, (headerH - logoH) / 2, logoW, logoH);
  }

  const titleX = margin + (logoW > 0 ? logoW + 14 : 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('RepliCars3D', titleX, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(224, 250, 255);
  doc.text('Cotización de fabricación 3D', titleX, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('COTIZACIÓN', pageWidth - margin, 50, { align: 'right' });

  y = headerH + 26;

  // ── Tarjeta de datos del cliente ─────────────────────────
  const infoBoxH = 118;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, y, contentWidth, infoBoxH, 6, 6, 'FD');

  const col1 = margin + 18;
  const col2 = margin + contentWidth / 2 + 10;
  let fy = y + 24;
  drawField(col1, fy, 'Referencia', selectedQuote.id);
  drawField(col2, fy, 'Fecha', formatQuoteDate(selectedQuote.Fecha || selectedQuote.creadoEn || ''));
  fy += 32;
  drawField(col1, fy, 'Cédula', clienteCedula);
  drawField(col2, fy, 'Teléfono', selectedQuote.cliente?.telefono || 'No disponible');
  fy += 32;
  drawField(col1, fy, 'Email', selectedQuote.cliente?.email || 'No disponible');

  y += infoBoxH + 24;

  // ── Resumen ───────────────────────────────────────────────
  const totalPersonalizacion = selectedQuote.productos?.reduce(
    (acc: number, p: any) => acc + (p.precioPersonalizacion || p.Precio_Personalizacion || 0),
    0,
  ) || 0;
  const totalEmpaque = selectedQuote.productos?.reduce(
    (acc: number, p: any) => acc + (p.precioEmpaque || p.Precio_Empaque || 0),
    0,
  ) || 0;

  doc.setFillColor(14, 165, 233);
  doc.rect(margin, y, contentWidth, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('RESUMEN DE LA COTIZACIÓN', margin + 12, y + 16);
  y += 24;

  const summaryBodyH = 118;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, summaryBodyH, 'FD');

  fy = y + 24;
  drawField(col1, fy, 'Subtotal fabricación', formatCOP(totals.subtotalFabricacion));
  drawField(col2, fy, 'Personalización', formatCOP(totalPersonalizacion));
  fy += 32;
  drawField(col1, fy, 'Empaque', formatCOP(totalEmpaque));
  fy += 34;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.line(margin + 18, fy, margin + contentWidth - 18, fy);
  fy += 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL COTIZACIÓN', col1, fy - 4);
  doc.setFontSize(17);
  doc.setTextColor(6, 182, 212);
  doc.text(formatCOP(totals.total), margin + contentWidth - 18, fy, { align: 'right' });

  y += summaryBodyH + 26;

  // ── Productos ─────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Productos cotizados', margin, y);
  y += 16;

  const IMG_BOX = 80;
  const CARD_PAD = 16;
  const imageFields = ['imagenFrontal', 'imagenLateral', 'imagenTrasera', 'imagenDiagonal', 'imagenUrl'];

  for (let idx = 0; idx < selectedQuote.productos.length; idx++) {
    const p = selectedQuote.productos[idx];
    const nombreProducto = p.nombre || p.descripcionLineal || `Producto ${idx + 1}`;
    const precioUnitario = p.precioUnitario || 0;
    const precioPintura = p.precioPintura || p.Precio_Pintura || 0;
    const precioPersonalizacion = p.precioPersonalizacion || p.Precio_Personalizacion || 0;
    const precioEmpaque = p.precioEmpaque || p.Precio_Empaque || 0;
    const unidades = p.unidades || 0;
    const totalProducto = p.precioTotal || 0;

    const productImageUrl = imageFields.reduce<string | undefined>((url, f) => url || p[f], undefined);
    const productImageData = productImageUrl ? await fetchImageDataUrl(productImageUrl) : null;
    const hasImg = !!productImageData;

    const textX = margin + CARD_PAD + (hasImg ? IMG_BOX + 16 : 0);
    const textW = contentWidth - CARD_PAD * 2 - (hasImg ? IMG_BOX + 16 : 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const nameLines = doc.splitTextToSize(`${idx + 1}. ${nombreProducto}`, textW);
    const nameH = nameLines.length * 13;
    const contentH = 18 + nameH + 8 + 52 + 12 + 18 + 14;
    const cardH = Math.max(contentH, IMG_BOX + CARD_PAD * 2);

    ensureSpace(cardH + 12);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.75);
    doc.roundedRect(margin, y, contentWidth, cardH, 6, 6, 'FD');

    if (hasImg && productImageData) {
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin + CARD_PAD, y + CARD_PAD, IMG_BOX, IMG_BOX, 4, 4, 'S');
      drawImageFit(productImageData.dataUrl, productImageData.format, productImageData.width, productImageData.height, margin + CARD_PAD, y + CARD_PAD, IMG_BOX, IMG_BOX);
    }

    let cy = y + 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    nameLines.forEach((line: string) => {
      doc.text(line, textX, cy);
      cy += 13;
    });
    cy += 8;

    const dCol1 = textX;
    const dCol2 = textX + textW / 2;
    drawField(dCol1, cy, 'Cantidad', String(unidades), { size: 9.5 });
    drawField(dCol2, cy, 'Precio unitario', formatCOP(precioUnitario), { size: 9.5 });
    cy += 26;
    drawField(dCol1, cy, 'Pintura + Personalización', formatCOP(precioPintura + precioPersonalizacion), { size: 9.5 });
    drawField(dCol2, cy, 'Empaque', formatCOP(precioEmpaque), { size: 9.5 });
    cy += 26 + 12;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(textX, cy, margin + contentWidth - CARD_PAD, cy);
    cy += 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(6, 182, 212);
    doc.text(`Total por producto: ${formatCOP(totalProducto)}`, margin + contentWidth - CARD_PAD, cy, { align: 'right' });

    y += cardH + 12;
  }

  // ── Pie de página (todas las páginas) ────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('RepliCars3D · Cotización generada automáticamente', margin, pageHeight - 22);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 22, { align: 'right' });
  }

  const filename = `cotizacion-${selectedQuote.id}.pdf`;
  doc.save(filename);

  const message = `Hola ${clienteNombre}, te envío la cotización final. Cédula: ${clienteCedula}. Total: ${formatCOP(totals.total)}. Referencia: ${selectedQuote.id}.`;
  const waUrl = `https://wa.me/${clienteTelefono}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
}
