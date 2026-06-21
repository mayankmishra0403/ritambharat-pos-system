function renderToString(order, restaurant, settings) {
    const currency = restaurant.currency || '₹';
    const now = new Date(order.createdAt);
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const taxRate = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0';
    const s = settings || {};
    const itemsHtml = (order.items || []).map(item => {
        const extras = [];
        if (item.specialInstructions) extras.push(`<div style="font-size:9px;color:#666;margin-left:4px;font-style:italic">— ${item.specialInstructions}</div>`);
        if (item.modifiers) item.modifiers.forEach(m => extras.push(`<div style="font-size:9px;color:#666;margin-left:4px">+ ${m.name}${m.price > 0 ? ` (${currency}${m.price.toFixed(2)})` : ''}</div>`));
        return `
            <tr>
                <td style="padding:2px 0;word-break:break-word">${item.name || (item.menuItem && item.menuItem.name) || ''}</td>
                <td style="padding:2px 0;text-align:center">${item.quantity}</td>
                <td style="padding:2px 0;text-align:right">${currency}${(item.price || 0).toFixed(2)}</td>
                <td style="padding:2px 0;text-align:right;font-weight:bold">${currency}${((item.price || 0) * item.quantity).toFixed(2)}</td>
            </tr>
            ${extras.map(e => `<tr><td colspan="4">${e}</td></tr>`).join('')}
        `;
    }).join('');

    let gstHtml = '';
    if (s.showGstBreakdown && order.gstBreakdown) {
        if (order.gstBreakdown.cgst > 0) gstHtml += `<tr><td style="padding:1px 0;font-size:10px">CGST @ ${((order.gstBreakdown.cgst / (order.subtotal || 1)) * 100).toFixed(1)}%</td><td style="text-align:right;font-size:10px">${currency}${order.gstBreakdown.cgst.toFixed(2)}</td></tr>`;
        if (order.gstBreakdown.sgst > 0) gstHtml += `<tr><td style="padding:1px 0;font-size:10px">SGST @ ${((order.gstBreakdown.sgst / (order.subtotal || 1)) * 100).toFixed(1)}%</td><td style="text-align:right;font-size:10px">${currency}${order.gstBreakdown.sgst.toFixed(2)}</td></tr>`;
        if (order.gstBreakdown.igst > 0) gstHtml += `<tr><td style="padding:1px 0;font-size:10px">IGST @ ${((order.gstBreakdown.igst / (order.subtotal || 1)) * 100).toFixed(1)}%</td><td style="text-align:right;font-size:10px">${currency}${order.gstBreakdown.igst.toFixed(2)}</td></tr>`;
    } else if ((order.tax || 0) > 0) {
        gstHtml = `<tr><td style="padding:1px 0;font-size:10px">GST @ ${taxRate}%</td><td style="text-align:right;font-size:10px">${currency}${(order.tax || 0).toFixed(2)}</td></tr>`;
    }

    return `
    <html><head>
    <meta charset="utf-8">
    <title>Invoice - ${order.orderNumber || order._id?.slice(-6) || ''}</title>
    <style>
        @page { margin: 0; size: 80mm auto; }
        body { margin: 0; padding: 8px; font-family: 'Courier New', Courier, monospace; color: #000; background: #fff; font-size: 10px; line-height: 1.3; }
        .receipt { max-width: 72mm; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .border-t { border-top: 2px solid #000; }
        .border-b { border-bottom: 2px solid #000; }
        .border-dashed { border-top: 1px dashed #999; }
        .mt-1 { margin-top: 4px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .pt-1 { padding-top: 4px; }
        .pb-1 { padding-bottom: 4px; }
        .pb-2 { padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; font-size: 10px; }
        .text-lg { font-size: 14px; }
        .text-sm { font-size: 11px; }
        .text-xs { font-size: 9px; }
        .text-2xl { font-size: 16px; }
        .text-gray { color: #666; }
        .text-red { color: #c00; }
        .text-green { color: #0a0; }
        .no-print { display: none; }
        hr { border: none; border-top: 1px dashed #999; margin: 4px 0; }
    </style>
    </head><body>
    <div class="receipt">

        <div class="center mb-2 border-b pb-2">
            ${s.showLogo && restaurant.logo ? `<img src="${restaurant.logo}" style="height:30px;margin-bottom:4px;object-fit:contain" /><br>` : ''}
            <div class="bold text-lg">${restaurant.name || 'Restaurant'}</div>
            ${restaurant.tagline ? `<div style="font-size:9px;color:#666;font-style:italic">${restaurant.tagline}</div>` : ''}
            <div class="text-xs text-gray">${[restaurant.address?.street, restaurant.address?.city, restaurant.address?.state, restaurant.address?.zipCode].filter(Boolean).join(', ')}</div>
            ${restaurant.contact?.phone ? `<div class="text-xs text-gray">${restaurant.contact.phone}</div>` : ''}
            ${restaurant.alternatePhone ? `<div class="text-xs text-gray">${restaurant.alternatePhone}</div>` : ''}
            ${restaurant.contact?.email ? `<div class="text-xs text-gray">${restaurant.contact.email}</div>` : ''}
            ${restaurant.website ? `<div class="text-xs text-gray">${restaurant.website}</div>` : ''}
            ${s.showGstin && restaurant.gstin ? `<div class="text-xs bold">GSTIN: ${restaurant.gstin}</div>` : ''}
            ${s.showFssai && restaurant.fssai ? `<div class="text-xs text-gray">FSSAI: ${restaurant.fssai}</div>` : ''}
        </div>

        <div class="center mb-2">
            <div class="bold text-sm">${s.invoiceTitle || 'TAX INVOICE'}</div>
        </div>

        <div class="text-xs mb-2 border-dashed pb-1">
            <table>
                <tr><td>Invoice: <span class="bold">${order.orderNumber || order._id?.slice(-6).toUpperCase() || ''}</span></td><td style="text-align:right">Date: ${dateStr}</td></tr>
                <tr><td>Time: ${timeStr}</td>${order.table?.name ? `<td style="text-align:right">Table: ${order.table.name}</td>` : ''}</tr>
                ${s.showPax && order.pax ? `<tr><td>PAX: ${order.pax}</td><td style="text-align:right">Type: ${order.orderType || 'DINE IN'}</td></tr>` : ''}
                ${s.showWaiterName && order.waiterName ? `<tr><td colspan="2">Waiter: ${order.waiterName}</td></tr>` : ''}
                ${s.showCashierName && order.cashierName ? `<tr><td colspan="2">Cashier: ${order.cashierName}</td></tr>` : ''}
                ${s.showCustomerDetails && order.customerName ? `<tr><td colspan="2">Customer: ${order.customerName}${order.customerPhone ? ` (${order.customerPhone})` : ''}</td></tr>` : ''}
            </table>
        </div>

        <table class="mb-1">
            <thead>
                <tr class="border-b bold text-xs">
                    <td style="padding:4px 0">Item</td>
                    <td style="padding:4px 0;text-align:center">Qty</td>
                    <td style="padding:4px 0;text-align:right">Rate</td>
                    <td style="padding:4px 0;text-align:right">Amt</td>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="border-t pt-1 mb-1">
            <table>
                <tr><td style="padding:1px 0">Sub Total</td><td style="text-align:right;padding:1px 0">${currency}${(order.subtotal || 0).toFixed(2)}</td></tr>
                ${order.discountAmount > 0 ? `<tr><td style="padding:1px 0;color:#c00">Discount</td><td style="text-align:right;padding:1px 0;color:#c00">-${currency}${(order.discountAmount || 0).toFixed(2)}</td></tr>` : ''}
                ${s.showServiceCharge && order.serviceChargeAmount > 0 ? `<tr><td style="padding:1px 0">Service Charge</td><td style="text-align:right;padding:1px 0">${currency}${(order.serviceChargeAmount || 0).toFixed(2)}</td></tr>` : ''}
                ${gstHtml}
                ${order.tipAmount > 0 ? `<tr><td style="padding:1px 0">Tip</td><td style="text-align:right;padding:1px 0">${currency}${(order.tipAmount || 0).toFixed(2)}</td></tr>` : ''}
                <tr class="border-t"><td style="padding:4px 0" class="bold text-lg">GRAND TOTAL</td><td style="text-align:right;padding:4px 0" class="bold text-lg">${currency}${(order.total || 0).toFixed(2)}</td></tr>
            </table>
        </div>

        ${(() => {
            const rawTotal = (order.subtotal || 0) - (order.discountAmount || 0) + (order.tax || 0) + (order.serviceChargeAmount || 0) + (order.tipAmount || 0);
            const roundOff = (order.total || 0) - rawTotal;
            if (Math.abs(roundOff) > 0.01) return `<div style="display:flex;justify-content:space-between;font-size:9px;color:#666;border-top:1px dashed #999;padding-top:2px;margin-bottom:2px"><span>Round Off</span><span>${roundOff.toFixed(2)}</span></div>`;
            return '';
        })()}

        ${s.showAmountInWords && order.total > 0 ? `<div style="border-top:1px dashed #999;padding-top:2px;margin-bottom:4px;font-size:9px;font-style:italic;color:#333"><span class="bold">Amount in Words: </span>${numberToWords(order.total)} ONLY</div>` : ''}

        <div style="border-top:1px dashed #999;padding-top:2px;margin-bottom:4px;font-size:10px;display:flex;justify-content:space-between">
            <span>${order.paymentMethod || '-'}</span>
            <span style="${order.paymentStatus === 'PAID' ? 'color:#0a0;font-weight:bold' : ''}">${order.paymentStatus === 'PAID' ? '✓ PAID' : (order.paymentStatus || 'PENDING')}</span>
        </div>

        ${s.showQRCode && s.qrUrl ? `<div class="center mb-1"><img src="https://api.qrserver.com/v1/create-qr-code/?size=${s.qrSize === 'small' ? '120x120' : '160x160'}&data=${encodeURIComponent(s.qrUrl)}" style="${s.qrSize === 'small' ? 'width:120px' : 'width:160px'}" crossorigin="anonymous" /></div>` : ''}

        ${s.showFooter ? `
        <div class="center border-t pt-2 text-xs text-gray">
            <div class="bold" style="color:#000">${s.thankYouMessage || 'Thank You For Visiting'}</div>
            <div>${s.visitAgainMessage || 'Please Visit Again'}</div>
            ${s.customerCareNumber ? `<div>📞 ${s.customerCareNumber}</div>` : ''}
            ${s.footerEmail ? `<div>✉ ${s.footerEmail}</div>` : ''}
            ${s.footerWebsite ? `<div>🌐 ${s.footerWebsite}</div>` : ''}
            ${s.customFooterNote ? `<div style="margin-top:2px;font-style:italic">${s.customFooterNote}</div>` : ''}
            ${s.showPoweredBy ? `<div style="margin-top:2px;color:#999">Powered by Ritam Bharat POS</div>` : ''}
        </div>
        ` : ''}

    </div>
    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
    </body></html>
    `;
}

function numberToWords(num) {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
        'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    function convert(n) {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    }
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let result = 'RUPEES ' + convert(rupees);
    if (paise > 0) result += ' AND ' + convert(paise) + ' PAISE';
    return result;
}

export default renderToString;
