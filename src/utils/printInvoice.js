import numberToWords from './numberToWords';

function renderToString(order, restaurant, settings) {
    const currency = restaurant.currency || '\u20B9';
    const s = settings || {};
    const now = new Date(order.createdAt);
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

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

    return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <title>Invoice - ${order.orderNumber || order._id?.slice(-6) || ''}</title>
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
        .sep { border-top: 1px solid #000; margin: 2.5pt 0; }
        .sep-dashed { border-top: 1px dashed #888; margin: 2pt 0; }
        .sep-thick { border-top: 2px solid #000; }
        .name-row { font-size: 14pt; font-weight: bold; text-align: center; letter-spacing: 0.5pt; }
        .invoice-title { font-size: 10pt; font-weight: bold; text-align: center; }
        .grand-total { font-size: 11pt; font-weight: bold; text-align: right; }
        .footer-text { font-size: 7.5pt; color: #555; }
        .amount-words { font-size: 8pt; font-style: italic; color: #333; }
    </style>
    </head>
    <body>

        <!-- ─── HEADER ─── -->
        <div class="c sep" style="padding-bottom:3pt">
            ${s.showLogo && restaurant.logo ? `<img src="${restaurant.logo}" style="height:8mm;margin-bottom:2pt;object-fit:contain" /><br>` : ''}
            <div class="name-row">${restaurant.name || 'Restaurant'}</div>
            ${restaurant.tagline ? `<div style="font-size:8pt;color:#555;font-style:italic">${restaurant.tagline}</div>` : ''}
            <div style="font-size:7.5pt;color:#555">${[restaurant.address?.street, restaurant.address?.city, restaurant.address?.state, restaurant.address?.zipCode].filter(Boolean).join(', ')}</div>
            ${restaurant.contact?.phone ? `<div style="font-size:7.5pt;color:#555">${restaurant.contact.phone}</div>` : ''}
            ${restaurant.alternatePhone ? `<div style="font-size:7.5pt;color:#555">${restaurant.alternatePhone}</div>` : ''}
            ${restaurant.contact?.email ? `<div style="font-size:7.5pt;color:#555">${restaurant.contact.email}</div>` : ''}
            ${restaurant.website ? `<div style="font-size:7.5pt;color:#555">${restaurant.website}</div>` : ''}
            ${s.showGstin && restaurant.gstin ? `<div style="font-size:8pt;font-weight:bold">GSTIN: ${restaurant.gstin}</div>` : ''}
            ${s.showFssai && restaurant.fssai ? `<div style="font-size:7.5pt;color:#555">FSSAI: ${restaurant.fssai}</div>` : ''}
        </div>

        <!-- ─── INVOICE TITLE ─── -->
        <div class="invoice-title sep-dashed" style="padding:2.5pt 0 2.5pt 0;margin-bottom:2.5pt">
            ${s.invoiceTitle || 'TAX INVOICE'}
        </div>

        <!-- ─── ORDER INFO ─── -->
        <table style="font-size:8pt;margin-bottom:2.5pt">
            <tr>
                <td style="width:50%">Invoice: <span class="b">${order.orderNumber || order._id?.slice(-6).toUpperCase() || ''}</span></td>
                <td style="text-align:right">Date: ${dateStr}</td>
            </tr>
            <tr>
                <td>Time: ${timeStr}</td>
                ${order.table?.name ? `<td style="text-align:right">Table: ${order.table.name}</td>` : '<td></td>'}
            </tr>
            ${s.showPax && order.pax ? `<tr><td>PAX: ${order.pax}</td><td style="text-align:right">Type: ${order.orderType || 'DINE IN'}</td></tr>` : ''}
            ${s.showWaiterName && order.waiterName ? `<tr><td colspan="2">Waiter: ${order.waiterName}</td></tr>` : ''}
            ${s.showCashierName && order.cashierName ? `<tr><td colspan="2">Cashier: ${order.cashierName}</td></tr>` : ''}
            ${s.showCustomerDetails && order.customerName ? `<tr><td colspan="2">Customer: ${order.customerName}${order.customerPhone ? ' (' + order.customerPhone + ')' : ''}</td></tr>` : ''}
        </table>
        <div class="sep-dashed"></div>

        <!-- ─── ITEMS TABLE ─── -->
        <table style="margin-top:2.5pt;margin-bottom:2.5pt">
            <thead>
                <tr class="sep" style="font-size:8pt;font-weight:bold">
                    <td style="width:44%;padding:2.5pt 0">Item</td>
                    <td style="width:14%;text-align:center;padding:2.5pt 0">Qty</td>
                    <td style="width:20%;text-align:right;padding:2.5pt 0">Rate</td>
                    <td style="width:22%;text-align:right;padding:2.5pt 0">Amt</td>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        <div class="sep-dashed"></div>

        <!-- ─── TOTALS ─── -->
        <table style="margin-top:2.5pt;margin-bottom:2.5pt">
            <tr>
                <td style="width:60%;padding:1.5pt 0;font-size:8pt">Sub Total</td>
                <td style="text-align:right;padding:1.5pt 0;font-size:8pt;font-weight:bold">${currency}${(order.subtotal || 0).toFixed(2)}</td>
            </tr>
            ${order.discountAmount > 0 ? `<tr><td style="padding:1.5pt 0;font-size:8pt;color:#c00">Discount</td><td style="text-align:right;padding:1.5pt 0;font-size:8pt;color:#c00">-${currency}${(order.discountAmount || 0).toFixed(2)}</td></tr>` : ''}
            ${s.showServiceCharge && order.serviceChargeAmount > 0 ? `<tr><td style="padding:1.5pt 0;font-size:8pt">Service Charge</td><td style="text-align:right;padding:1.5pt 0;font-size:8pt">${currency}${(order.serviceChargeAmount || 0).toFixed(2)}</td></tr>` : ''}
            ${gstHtml}
            ${order.tipAmount > 0 ? `<tr><td style="padding:1.5pt 0;font-size:8pt">Tip</td><td style="text-align:right;padding:1.5pt 0;font-size:8pt">${currency}${(order.tipAmount || 0).toFixed(2)}</td></tr>` : ''}
            ${roundOffHtml}
            <tr><td colspan="2" style="padding:0"><div class="sep-thick" style="margin:2pt 0"></div></td></tr>
            <tr>
                <td style="font-size:11pt;font-weight:bold;padding:2.5pt 0">GRAND TOTAL</td>
                <td style="text-align:right;font-size:11pt;font-weight:bold;padding:2.5pt 0">${currency}${(order.total || 0).toFixed(2)}</td>
            </tr>
            <tr><td colspan="2" style="padding:0"><div class="sep-thick" style="margin:0 0 2.5pt 0"></div></td></tr>
        </table>

        <!-- ─── AMOUNT IN WORDS ─── -->
        ${s.showAmountInWords && order.total > 0 ? `<div class="amount-words sep-dashed" style="padding:2pt 0;margin-bottom:2.5pt"><span class="b">Amount in Words: </span>${numberToWords(order.total)} ONLY</div>` : ''}

        <!-- ─── PAYMENT ─── -->
        <div class="sep-dashed" style="padding:2pt 0;margin-bottom:2.5pt;display:flex;justify-content:space-between;font-size:8pt">
            <span>${order.paymentMethod || '-'}</span>
            <span style="${order.paymentStatus === 'PAID' ? 'color:#008000;font-weight:bold' : ''}">${order.paymentStatus === 'PAID' ? '\u2713 PAID' : (order.paymentStatus || 'PENDING')}</span>
        </div>

        <!-- ─── QR CODE ─── -->
        ${s.showQRCode && s.qrUrl ? `<div class="c" style="margin:1.5pt 0"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(s.qrUrl)}" style="width:150px;image-rendering:pixelated" /></div>` : ''}

        <!-- ─── FOOTER ─── -->
        ${s.showFooter ? `
        <div class="sep" style="padding-top:3pt;font-size:7.5pt;color:#555;text-align:center">
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
