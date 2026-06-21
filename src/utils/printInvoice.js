import numberToWords from './numberToWords';

function renderToString(order, restaurant, settings) {
    const currency = restaurant.currency || '\u20B9';
    const s = settings || {};
    const now = new Date(order.createdAt);
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const invoiceNum = order.orderNumber || order._id?.slice(-6).toUpperCase() || '';

    const itemsHtml = (order.items || []).map(item => {
        const name = item.name || (item.menuItem && item.menuItem.name) || '';
        const rate = item.price || 0;
        const qty = item.quantity || 0;
        const amount = rate * qty;
        const extras = [];
        if (item.specialInstructions) {
            extras.push(`<tr><td colspan="4" style="padding:0 0 0 6px;font-size:7pt;color:#555;font-style:italic">— ${item.specialInstructions}</td></tr>`);
        }
        if (item.modifiers) {
            item.modifiers.forEach(m => {
                extras.push(`<tr><td colspan="4" style="padding:0 0 0 6px;font-size:7pt;color:#555">+ ${m.name}${m.price > 0 ? ' (' + currency + m.price.toFixed(2) + ')' : ''}</td></tr>`);
            });
        }
        return `
            <tr>
                <td style="padding:1.5pt 0;word-break:break-word;font-size:8pt">${name}</td>
                <td style="padding:1.5pt 0;text-align:center;font-size:8pt">${qty}</td>
                <td style="padding:1.5pt 0;text-align:right;font-size:8pt">${currency}${rate.toFixed(2)}</td>
                <td style="padding:1.5pt 0;text-align:right;font-size:8pt;font-weight:bold">${currency}${amount.toFixed(2)}</td>
            </tr>
            ${extras.join('')}
        `;
    }).join('');

    const roundOffHtml = (() => {
        const rawTotal = (order.subtotal || 0) - (order.discountAmount || 0) + (order.tax || 0) + (order.serviceChargeAmount || 0) + (order.tipAmount || 0);
        const roundOff = (order.total || 0) - rawTotal;
        if (Math.abs(roundOff) > 0.01) {
            return `<tr><td colspan="3" style="padding:1.5pt 0;font-size:8pt;color:#666">Round Off</td><td style="padding:1.5pt 0;text-align:right;font-size:8pt;color:#666">${roundOff.toFixed(2)}</td></tr>`;
        }
        return '';
    })();

    const gstHtml = (() => {
        if (s.showGstBreakdown && order.gstBreakdown) {
            let html = '';
            if (order.gstBreakdown.cgst > 0) {
                html += `<tr><td colspan="3" style="padding:1.5pt 0;font-size:8pt">CGST @ ${((order.gstBreakdown.cgst / (order.subtotal || 1)) * 100).toFixed(1)}%</td><td style="padding:1.5pt 0;text-align:right;font-size:8pt">${currency}${order.gstBreakdown.cgst.toFixed(2)}</td></tr>`;
            }
            if (order.gstBreakdown.sgst > 0) {
                html += `<tr><td colspan="3" style="padding:1.5pt 0;font-size:8pt">SGST @ ${((order.gstBreakdown.sgst / (order.subtotal || 1)) * 100).toFixed(1)}%</td><td style="padding:1.5pt 0;text-align:right;font-size:8pt">${currency}${order.gstBreakdown.sgst.toFixed(2)}</td></tr>`;
            }
            if (order.gstBreakdown.igst > 0) {
                html += `<tr><td colspan="3" style="padding:1.5pt 0;font-size:8pt">IGST @ ${((order.gstBreakdown.igst / (order.subtotal || 1)) * 100).toFixed(1)}%</td><td style="padding:1.5pt 0;text-align:right;font-size:8pt">${currency}${order.gstBreakdown.igst.toFixed(2)}</td></tr>`;
            }
            return html;
        }
        if ((order.tax || 0) > 0) {
            const taxRate = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0';
            return `<tr><td colspan="3" style="padding:1.5pt 0;font-size:8pt">GST @ ${taxRate}%</td><td style="padding:1.5pt 0;text-align:right;font-size:8pt">${currency}${(order.tax || 0).toFixed(2)}</td></tr>`;
        }
        return '';
    })();

    const isPaid = order.paymentStatus === 'PAID';

    return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <title>Invoice - ${invoiceNum}</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            width: 72mm;
            margin: 0 auto;
            padding: 2mm 2.5mm;
            font-family: 'Courier New', Courier, monospace;
            color: #000;
            background: #fff;
            font-size: 9pt;
            line-height: 1.25;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td {
            vertical-align: top;
        }
        .c { text-align: center; }
        .r { text-align: right; }
        .b { font-weight: bold; }
        .i { font-style: italic; }
        .muted { color: #555; }

        /* Separators — weight hierarchy: thicker > thick > solid > dashed */
        .sep-thicker { border-top: 3px solid #000; }
        .sep-thick { border-top: 2px solid #000; }
        .sep { border-top: 1px solid #000; }
        .sep-dashed { border-top: 1px dashed #888; }

        /* Typography hierarchy */
        .name-row { font-size: 16pt; font-weight: bold; text-align: center; letter-spacing: 0.5pt; }
        .invoice-title { font-size: 12pt; font-weight: bold; text-align: center; letter-spacing: 1pt; }
        .invoice-number { font-size: 10pt; font-weight: bold; }
        .grand-total-label { font-size: 13pt; font-weight: bold; }
        .grand-total-amount { font-size: 13pt; font-weight: bold; text-align: right; }
        .amount-words { font-size: 8pt; font-style: italic; color: #333; }
        .footer-text { font-size: 7.5pt; color: #555; }
        .paid-badge { font-size: 9pt; font-weight: bold; color: #008000; }
        .pending-badge { font-size: 8pt; color: #888; }
    </style>
    </head>
    <body>

        <!-- ═══════════ HEADER ═══════════ -->
        <div class="c" style="padding-bottom:4pt">
            ${s.showLogo && restaurant.logo ? `<img src="${restaurant.logo}" style="height:8mm;margin-bottom:2pt;object-fit:contain" /><br>` : ''}
            <div class="name-row">${restaurant.name || 'Restaurant'}</div>
            ${restaurant.tagline ? `<div style="font-size:8pt;color:#555;font-style:italic;margin-top:1pt">${restaurant.tagline}</div>` : ''}
            <div style="font-size:7.5pt;color:#555;margin-top:2pt">${[restaurant.address?.street, restaurant.address?.city, restaurant.address?.state, restaurant.address?.zipCode].filter(Boolean).join(', ')}</div>
            ${restaurant.contact?.phone ? `<div style="font-size:7.5pt;color:#555">${restaurant.contact.phone}</div>` : ''}
            ${restaurant.alternatePhone ? `<div style="font-size:7.5pt;color:#555">${restaurant.alternatePhone}</div>` : ''}
            ${restaurant.contact?.email ? `<div style="font-size:7.5pt;color:#555">${restaurant.contact.email}</div>` : ''}
            ${restaurant.website ? `<div style="font-size:7.5pt;color:#555">${restaurant.website}</div>` : ''}
            ${s.showGstin && restaurant.gstin ? `<div style="font-size:8pt;font-weight:bold;margin-top:1pt">GSTIN: ${restaurant.gstin}</div>` : ''}
            ${s.showFssai && restaurant.fssai ? `<div style="font-size:7.5pt;color:#555">FSSAI: ${restaurant.fssai}</div>` : ''}
        </div>
        <div class="sep-thick"></div>

        <!-- ═══════════ INVOICE TITLE ═══════════ -->
        <div class="sep-thick" style="margin-top:3pt;margin-bottom:2pt"></div>
        <div class="invoice-title" style="padding:3pt 0">
            ${s.invoiceTitle || 'TAX INVOICE'}
        </div>
        <div class="sep" style="margin-bottom:3pt"></div>

        <!-- ═══════════ ORDER INFO ═══════════ -->
        <table style="font-size:8pt;margin-bottom:3pt">
            <tr>
                <td style="width:50%">Invoice: <span class="invoice-number">${invoiceNum}</span></td>
                <td class="r">Date: <span class="b">${dateStr}</span></td>
            </tr>
            <tr>
                <td>Time: <span class="b">${timeStr}</span></td>
                ${order.table?.name ? `<td class="r">Table: <span class="b">${order.table.name}</span></td>` : '<td></td>'}
            </tr>
            ${s.showPax && order.pax ? `<tr><td>PAX: ${order.pax}</td><td class="r">Type: ${order.orderType || 'DINE IN'}</td></tr>` : ''}
            ${s.showWaiterName && order.waiterName ? `<tr><td colspan="2">Waiter: <span class="b">${order.waiterName}</span></td></tr>` : ''}
            ${s.showCashierName && order.cashierName ? `<tr><td colspan="2">Cashier: <span class="b">${order.cashierName}</span></td></tr>` : ''}
            ${s.showCustomerDetails && order.customerName ? `<tr><td colspan="2">Customer: ${order.customerName}${order.customerPhone ? ' (' + order.customerPhone + ')' : ''}</td></tr>` : ''}
        </table>
        <div class="sep-dashed"></div>

        <!-- ═══════════ ITEMS TABLE ═══════════ -->
        <table style="margin-top:3pt;margin-bottom:3pt">
            <thead>
                <tr><td colspan="4" style="padding:0"><div class="sep-thick"></div></td></tr>
                <tr style="font-size:8pt;font-weight:bold">
                    <td style="width:44%;padding:2pt 0">Item</td>
                    <td style="width:14%;text-align:center;padding:2pt 0">Qty</td>
                    <td style="width:20%;text-align:right;padding:2pt 0">Rate</td>
                    <td style="width:22%;text-align:right;padding:2pt 0">Amt</td>
                </tr>
                <tr><td colspan="4" style="padding:0"><div class="sep"></div></td></tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        <div class="sep"></div>

        <!-- ═══════════ TOTALS ═══════════ -->
        <table style="margin-top:3pt;margin-bottom:3pt">
            <tr>
                <td style="width:60%;padding:1.5pt 0;font-size:8pt">Sub Total</td>
                <td style="text-align:right;padding:1.5pt 0;font-size:8pt;font-weight:bold">${currency}${(order.subtotal || 0).toFixed(2)}</td>
            </tr>
            ${order.discountAmount > 0 ? `<tr><td style="padding:1.5pt 0;font-size:8pt;color:#c00">Discount</td><td style="text-align:right;padding:1.5pt 0;font-size:8pt;color:#c00">-${currency}${(order.discountAmount || 0).toFixed(2)}</td></tr>` : ''}
            ${s.showServiceCharge && order.serviceChargeAmount > 0 ? `<tr><td style="padding:1.5pt 0;font-size:8pt">Service Charge</td><td style="text-align:right;padding:1.5pt 0;font-size:8pt">${currency}${(order.serviceChargeAmount || 0).toFixed(2)}</td></tr>` : ''}
            ${gstHtml}
            ${order.tipAmount > 0 ? `<tr><td style="padding:1.5pt 0;font-size:8pt">Tip</td><td style="text-align:right;padding:1.5pt 0;font-size:8pt">${currency}${(order.tipAmount || 0).toFixed(2)}</td></tr>` : ''}
            ${roundOffHtml}
            <tr><td colspan="2" style="padding:0"><div class="sep-thicker" style="margin:3pt 0 2pt 0"></div></td></tr>
            <tr>
                <td class="grand-total-label" style="padding:3pt 0">GRAND TOTAL</td>
                <td class="grand-total-amount" style="padding:3pt 0">${currency}${(order.total || 0).toFixed(2)}</td>
            </tr>
            <tr><td colspan="2" style="padding:0"><div class="sep-thicker" style="margin:2pt 0 0 0"></div></td></tr>
        </table>

        <!-- ═══════════ AMOUNT IN WORDS ═══════════ -->
        ${s.showAmountInWords && order.total > 0 ? `<div class="amount-words sep-dashed" style="padding:2.5pt 0;margin-bottom:3pt"><span class="b">Amount in Words: </span>${numberToWords(order.total)} ONLY</div>` : ''}

        <!-- ═══════════ PAYMENT ═══════════ -->
        <div class="sep" style="margin-bottom:2pt"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:2.5pt 0;font-size:9pt">
            <span class="b">${order.paymentMethod || '-'}</span>
            ${isPaid
                ? `<span class="paid-badge" style="background:#e8f5e9;padding:1.5pt 6pt;border:1px solid #008000">\u2713 PAID</span>`
                : `<span class="pending-badge">${order.paymentStatus || 'PENDING'}</span>`
            }
        </div>
        <div class="sep" style="margin-top:2pt"></div>

        <!-- ═══════════ QR CODE ═══════════ -->
        ${s.showQRCode && s.qrUrl ? `<div class="c" style="margin:2pt 0"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(s.qrUrl)}" style="width:150px;image-rendering:pixelated" /></div>` : ''}

        <!-- ═══════════ FOOTER ═══════════ -->
        ${s.showFooter ? `
        <div class="sep-thick" style="margin-bottom:3pt"></div>
        <div style="font-size:7.5pt;color:#555;text-align:center">
            <div style="font-weight:bold;color:#000;font-size:8pt">${s.thankYouMessage || 'Thank You For Visiting'}</div>
            <div style="margin-top:1pt">${s.visitAgainMessage || 'Please Visit Again'}</div>
            ${s.customerCareNumber ? `<div style="margin-top:1pt">${s.customerCareNumber}</div>` : ''}
            ${s.footerEmail ? `<div style="margin-top:1pt">${s.footerEmail}</div>` : ''}
            ${s.footerWebsite ? `<div style="margin-top:1pt">${s.footerWebsite}</div>` : ''}
            ${s.customFooterNote ? `<div style="margin-top:1pt;font-style:italic">${s.customFooterNote}</div>` : ''}
            ${s.showPoweredBy ? '<div style="margin-top:1.5pt;color:#999">Ritam Bharat POS</div>' : ''}
        </div>
        ` : ''}

    <script>
    window.onload = function() {
        window.print();
        window.onafterprint = function() { window.close(); };
    };
    </script>
    </body></html>
    `;
}

export default renderToString;
