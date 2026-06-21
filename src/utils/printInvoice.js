import numberToWords from './numberToWords';

function renderToString(order, restaurant, settings) {
    const currency = restaurant.currency || '\u20B9';
    const s = settings || {};
    const now = new Date(order.createdAt);
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const invoiceNum = order.orderNumber || order._id?.slice(-6).toUpperCase() || '';
    const isPaid = order.paymentStatus === 'PAID';
    const total = order.total || 0;

    const itemsHtml = (order.items || []).map(item => {
        const name = item.name || (item.menuItem && item.menuItem.name) || '';
        const rate = item.price || 0;
        const qty = item.quantity || 0;
        const amount = rate * qty;
        const extras = [];
        if (item.specialInstructions) {
            extras.push(`<tr><td colspan="4" style="padding:0 0 0 6px;font-size:7.5pt;font-weight:bold;color:#000">— ${item.specialInstructions}</td></tr>`);
        }
        if (item.modifiers) {
            item.modifiers.forEach(m => {
                extras.push(`<tr><td colspan="4" style="padding:0 0 0 6px;font-size:7.5pt;font-weight:bold;color:#000">+ ${m.name}${m.price > 0 ? ' (' + currency + m.price.toFixed(2) + ')' : ''}</td></tr>`);
            });
        }
        return `
            <tr>
                <td style="padding:1.5pt 0;word-break:break-word;font-size:8.5pt;font-weight:bold;color:#000">${name}</td>
                <td style="padding:1.5pt 0;text-align:center;font-size:8.5pt;font-weight:bold;color:#000">${qty}</td>
                <td style="padding:1.5pt 0;text-align:right;font-size:8.5pt;font-weight:bold;color:#000">${currency}${rate.toFixed(2)}</td>
                <td style="padding:1.5pt 0;text-align:right;font-size:8.5pt;font-weight:bold;color:#000">${currency}${amount.toFixed(2)}</td>
            </tr>
            ${extras.join('')}
        `;
    }).join('');

    const gstHtml = (() => {
        if (s.showGstBreakdown && order.gstBreakdown) {
            let h = '';
            if (order.gstBreakdown.cgst > 0) {
                const pct = ((order.gstBreakdown.cgst / (order.subtotal || 1)) * 100).toFixed(1);
                h += `<tr><td style="padding:1.5pt 0;font-size:8.5pt;font-weight:bold;color:#000">CGST @ ${pct}%</td><td class="r b" style="padding:1.5pt 0;font-size:8.5pt">${currency}${order.gstBreakdown.cgst.toFixed(2)}</td></tr>`;
            }
            if (order.gstBreakdown.sgst > 0) {
                const pct = ((order.gstBreakdown.sgst / (order.subtotal || 1)) * 100).toFixed(1);
                h += `<tr><td style="padding:1.5pt 0;font-size:8.5pt;font-weight:bold;color:#000">SGST @ ${pct}%</td><td class="r b" style="padding:1.5pt 0;font-size:8.5pt">${currency}${order.gstBreakdown.sgst.toFixed(2)}</td></tr>`;
            }
            if (order.gstBreakdown.igst > 0) {
                const pct = ((order.gstBreakdown.igst / (order.subtotal || 1)) * 100).toFixed(1);
                h += `<tr><td style="padding:1.5pt 0;font-size:8.5pt;font-weight:bold;color:#000">IGST @ ${pct}%</td><td class="r b" style="padding:1.5pt 0;font-size:8.5pt">${currency}${order.gstBreakdown.igst.toFixed(2)}</td></tr>`;
            }
            return h;
        }
        if ((order.tax || 0) > 0) {
            const pct = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0';
            return `<tr><td style="padding:1.5pt 0;font-size:8.5pt;font-weight:bold;color:#000">GST @ ${pct}%</td><td class="r b" style="padding:1.5pt 0;font-size:8.5pt">${currency}${(order.tax || 0).toFixed(2)}</td></tr>`;
        }
        return '';
    })();

    const roundOffHtml = (() => {
        const raw = (order.subtotal || 0) - (order.discountAmount || 0) + (order.tax || 0) + (order.serviceChargeAmount || 0) + (order.tipAmount || 0);
        const ro = total - raw;
        if (Math.abs(ro) > 0.01) {
            return `<tr><td style="padding:1.5pt 0;font-size:8.5pt;font-weight:bold;color:#000">Round Off</td><td class="r b" style="padding:1.5pt 0;font-size:8.5pt">${currency}${ro.toFixed(2)}</td></tr>`;
        }
        return '';
    })();

    const qrUrl = s.showQRCode && s.qrUrl ? s.qrUrl : '';
    const qrTag = qrUrl
        ? `<div class="c" style="margin:2.5pt 0"><img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&ecc=H&margin=4" style="width:30mm;height:30mm;image-rendering:pixelated" /></div>`
        : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <title>Invoice - ${invoiceNum}</title>
    <style>
        @page { size: 80mm auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            width: 72mm;
            margin: 0 auto;
            padding: 2mm 2.5mm;
            font-family: 'Courier New', Courier, monospace;
            color: #000;
            background: #fff;
            font-size: 9pt;
            line-height: 1.2;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; }
        .c { text-align: center; }
        .r { text-align: right; }
        .b { font-weight: bold; }

        .sep-thicker { border-top: 3px solid #000; }
        .sep-thick { border-top: 2px solid #000; }
        .sep { border-top: 1px solid #000; }
        .sep-dashed { border-top: 1px dashed #888; }

        .restaurant-name { font-size: 18pt; font-weight: bold; text-align: center; letter-spacing: 0.5pt; color: #000; }
        .invoice-title { font-size: 12pt; font-weight: bold; text-align: center; letter-spacing: 1.5pt; color: #000; }
        .invoice-number-lg { font-size: 10pt; font-weight: bold; color: #000; }
        .grand-total-label { font-size: 12pt; font-weight: bold; text-align: center; color: #000; letter-spacing: 1pt; }
        .grand-total-amount { font-size: 16pt; font-weight: bold; text-align: center; color: #000; }
        .amount-words { font-size: 8.5pt; font-weight: bold; color: #000; }
        .paid-badge { font-size: 9pt; font-weight: bold; color: #008000; }
    </style>
    </head>
    <body>

        <!-- HEADER -->
        <div class="c" style="padding-bottom:3pt">
            ${s.showLogo && restaurant.logo
                ? `<img src="${restaurant.logo}" style="height:8mm;margin-bottom:2pt;object-fit:contain" /><br>`
                : ''}
            <div class="restaurant-name">${restaurant.name || 'Restaurant'}</div>
            ${restaurant.tagline
                ? `<div style="font-size:8pt;font-weight:bold;color:#000;margin-top:1pt">${restaurant.tagline}</div>`
                : ''}
            <div style="font-size:7.5pt;font-weight:bold;color:#000;margin-top:2pt">${[restaurant.address?.street, restaurant.address?.city, restaurant.address?.state, restaurant.address?.zipCode].filter(Boolean).join(', ')}</div>
            ${restaurant.contact?.phone ? `<div style="font-size:7.5pt;font-weight:bold;color:#000">${restaurant.contact.phone}</div>` : ''}
            ${restaurant.alternatePhone ? `<div style="font-size:7.5pt;font-weight:bold;color:#000">${restaurant.alternatePhone}</div>` : ''}
            ${s.showGstin && restaurant.gstin ? `<div style="font-size:8pt;font-weight:bold;color:#000;margin-top:1pt">GSTIN: ${restaurant.gstin}</div>` : ''}
        </div>

        <!-- DOUBLE LINE + TAX INVOICE -->
        <div class="sep-thick" style="margin-bottom:1.5pt"></div>
        <div class="sep-thick" style="margin-bottom:2.5pt"></div>
        <div class="invoice-title" style="padding:0 0 2.5pt 0">${s.invoiceTitle || 'TAX INVOICE'}</div>
        <div class="sep" style="margin-bottom:2.5pt"></div>

        <!-- ORDER INFO -->
        <table style="margin-bottom:2.5pt">
            <tr>
                <td style="width:50%;font-size:8pt;font-weight:bold;color:#000">Invoice No</td>
                <td class="r invoice-number-lg">${invoiceNum}</td>
            </tr>
            <tr>
                <td style="font-size:8pt;font-weight:bold;color:#000">Date</td>
                <td class="r b" style="font-size:8.5pt;color:#000">${dateStr}</td>
            </tr>
            <tr>
                <td style="font-size:8pt;font-weight:bold;color:#000">Time</td>
                <td class="r b" style="font-size:8.5pt;color:#000">${timeStr}</td>
            </tr>
            <tr>
                <td style="font-size:8pt;font-weight:bold;color:#000">Type</td>
                <td class="r b" style="font-size:8.5pt;color:#000">${order.orderType || 'DINE IN'}</td>
            </tr>
            ${order.table?.name ? `<tr><td style="font-size:8pt;font-weight:bold;color:#000">Table</td><td class="r b" style="font-size:8.5pt;color:#000">${order.table.name}</td></tr>` : ''}
            ${s.showPax && order.pax ? `<tr><td style="font-size:8pt;font-weight:bold;color:#000">PAX</td><td class="r b" style="font-size:8.5pt;color:#000">${order.pax}</td></tr>` : ''}
            ${s.showWaiterName && order.waiterName ? `<tr><td colspan="2" style="font-size:8pt;font-weight:bold;color:#000">Waiter: <span class="b" style="font-size:8.5pt;color:#000">${order.waiterName}</span></td></tr>` : ''}
            ${s.showCashierName && order.cashierName ? `<tr><td colspan="2" style="font-size:8pt;font-weight:bold;color:#000">Cashier: <span class="b" style="font-size:8.5pt;color:#000">${order.cashierName}</span></td></tr>` : ''}
            ${s.showCustomerDetails && order.customerName ? `<tr><td colspan="2" style="font-size:8pt;font-weight:bold;color:#000">Customer: ${order.customerName}${order.customerPhone ? ' (' + order.customerPhone + ')' : ''}</td></tr>` : ''}
        </table>
        <div class="sep-dashed" style="margin-bottom:2.5pt"></div>

        <!-- ITEMS TABLE -->
        <table style="margin-bottom:2.5pt">
            <thead>
                <tr><td colspan="4" style="padding:0"><div class="sep-thick"></div></td></tr>
                <tr style="font-size:8.5pt;font-weight:bold;color:#000">
                    <td style="width:44%;padding:2pt 0">Item</td>
                    <td style="width:14%;text-align:center;padding:2pt 0">Qty</td>
                    <td style="width:20%;text-align:right;padding:2pt 0">Rate</td>
                    <td style="width:22%;text-align:right;padding:2pt 0">Amt</td>
                </tr>
                <tr><td colspan="4" style="padding:0"><div class="sep"></div></td></tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>
        <div class="sep" style="margin-bottom:2.5pt"></div>

        <!-- TOTALS -->
        <table style="margin-bottom:2.5pt">
            <tr>
                <td style="padding:1.5pt 0;font-size:8.5pt;font-weight:bold;color:#000">Sub Total</td>
                <td class="r b" style="padding:1.5pt 0;font-size:8.5pt">${currency}${(order.subtotal || 0).toFixed(2)}</td>
            </tr>
            ${order.discountAmount > 0 ? `<tr><td style="padding:1.5pt 0;font-size:8.5pt;font-weight:bold;color:#c00">Discount</td><td class="r b" style="padding:1.5pt 0;font-size:8.5pt;color:#c00">-${currency}${order.discountAmount.toFixed(2)}</td></tr>` : ''}
            ${s.showServiceCharge && order.serviceChargeAmount > 0 ? `<tr><td style="padding:1.5pt 0;font-size:8.5pt;font-weight:bold;color:#000">Service Charge</td><td class="r b" style="padding:1.5pt 0;font-size:8.5pt">${currency}${order.serviceChargeAmount.toFixed(2)}</td></tr>` : ''}
            ${gstHtml}
            ${order.tipAmount > 0 ? `<tr><td style="padding:1.5pt 0;font-size:8.5pt;font-weight:bold;color:#000">Tip</td><td class="r b" style="padding:1.5pt 0;font-size:8.5pt">${currency}${order.tipAmount.toFixed(2)}</td></tr>` : ''}
            ${roundOffHtml}
        </table>

        <!-- GRAND TOTAL -->
        <div class="sep-thicker" style="margin-bottom:2.5pt"></div>
        <div class="c" style="padding:3pt 0">
            <div class="grand-total-label">GRAND TOTAL</div>
            <div class="grand-total-amount" style="margin-top:1.5pt">${currency}${total.toFixed(2)}</div>
        </div>
        <div class="sep-thicker" style="margin-top:2.5pt;margin-bottom:2.5pt"></div>

        <!-- AMOUNT IN WORDS -->
        ${s.showAmountInWords && total > 0
            ? `<div class="amount-words sep-dashed" style="padding:2.5pt 0;margin-bottom:2.5pt"><span>Amount in Words: </span>${numberToWords(total)} ONLY</div>`
            : ''}

        <!-- PAYMENT -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:2.5pt 0;border-top:1px solid #000;border-bottom:1px solid #000;margin-bottom:2.5pt">
            <span class="b" style="font-size:8.5pt;color:#000">${order.paymentMethod || '-'}</span>
            ${isPaid
                ? `<span class="paid-badge" style="background:#e8f5e9;padding:1.5pt 5pt;border:1px solid #008000">\u2713 PAID</span>`
                : `<span class="b" style="font-size:8.5pt;color:#000">${order.paymentStatus || 'PENDING'}</span>`}
        </div>

        <!-- QR CODE -->
        ${qrTag}

        <!-- FOOTER -->
        ${s.showFooter
            ? `<div class="sep-thick" style="margin-bottom:2.5pt"></div>
               <div class="c" style="font-size:7.5pt;font-weight:bold;color:#000;padding-bottom:2pt">
                   <div style="font-size:8pt;font-weight:bold;color:#000">${s.thankYouMessage || 'Thank You For Visiting'}</div>
                   <div style="margin-top:1pt;font-weight:bold;color:#000">${s.visitAgainMessage || 'Please Visit Again'}</div>
                   ${s.customerCareNumber ? `<div style="margin-top:1pt;font-weight:bold;color:#000">${s.customerCareNumber}</div>` : ''}
                   ${s.footerEmail ? `<div style="margin-top:1pt;font-weight:bold;color:#000">${s.footerEmail}</div>` : ''}
                   ${s.footerWebsite ? `<div style="margin-top:1pt;font-weight:bold;color:#000">${s.footerWebsite}</div>` : ''}
                   ${s.customFooterNote ? `<div style="margin-top:1pt;font-weight:bold;color:#000;font-style:italic">${s.customFooterNote}</div>` : ''}
                   ${s.showPoweredBy ? '<div style="margin-top:1.5pt;font-weight:bold;color:#000">Ritam Bharat POS</div>' : ''}
               </div>`
            : ''}

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
