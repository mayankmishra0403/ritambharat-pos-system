function generateKOT(order, restaurant) {
    const now = new Date(order.createdAt);
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const orderNum = order.orderNumber || order._id?.slice(-6).toUpperCase() || '';

    const itemsHtml = (order.items || []).map(item => {
        const name = item.name || (item.menuItem && item.menuItem.name) || '';
        const qty = item.quantity || 0;
        const extras = [];
        if (item.specialInstructions) {
            extras.push(`<tr><td colspan="3" style="padding:1.5pt 0 1.5pt 6px;font-size:9.5pt;font-weight:bold;color:#000">— ${item.specialInstructions}</td></tr>`);
        }
        if (item.modifiers) {
            item.modifiers.forEach(m => {
                extras.push(`<tr><td colspan="3" style="padding:1.5pt 0 1.5pt 6px;font-size:9.5pt;font-weight:bold;color:#000">+ ${m.name}</td></tr>`);
            });
        }
        return `
            <tr>
                <td style="padding:2pt 0;word-break:break-word;font-size:10pt;font-weight:bold;color:#000">${name}</td>
                <td style="padding:2pt 0;text-align:center;font-size:10pt;font-weight:bold;color:#000">${qty}</td>
                <td style="padding:2pt 0;text-align:right;font-size:10pt;font-weight:bold;color:#000"></td>
            </tr>
            ${extras.join('')}
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=80mm">
    <title>KOT - ${orderNum}</title>
    <style>
        @page { size: 80mm auto; margin: 0; }
        html { margin: 0; width: 100%; }
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: none; -moz-osx-font-smoothing: unset; text-rendering: geometricPrecision; }
        body {
            width: 72mm;
            margin: 0 auto;
            padding: 2mm 2.5mm;
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            background: #fff;
            font-size: 9pt;
            line-height: 1.3;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        @media print {
            body { width: 72mm; margin: 0; padding: 2mm 2.5mm; }
            @page { size: 80mm auto; margin: 0; }
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

        .restaurant-name { font-size: 16pt; font-weight: bold; text-align: center; letter-spacing: 0.5pt; color: #000; }
        .kot-title { font-size: 14pt; font-weight: bold; text-align: center; letter-spacing: 3pt; color: #000; }
        .kot-label { font-size: 9.5pt; font-weight: bold; color: #000; }
        .highlight-box { border: 2px solid #000; padding: 2pt 4pt; text-align: center; margin: 2pt 0; }
        .print-guide { font-size: 7pt; font-weight: bold; color: #888; text-align: center; padding: 2pt 0; }
    </style>
    </head>
    <body>

        <div class="print-guide">Set Scale to 100%, Margins to None</div>

        <div class="c" style="padding-bottom:3pt">
            <div class="restaurant-name">${restaurant.name || 'Restaurant'}</div>
            ${restaurant.contact?.phone ? `<div style="font-size:9pt;font-weight:bold;color:#000;margin-top:1pt">${restaurant.contact.phone}</div>` : ''}
        </div>

        <div class="sep-thick" style="margin-bottom:1.5pt"></div>
        <div class="sep-thick" style="margin-bottom:2.5pt"></div>

        <div class="kot-title">KITCHEN ORDER TICKET</div>

        <div class="sep" style="margin:2.5pt 0"></div>

        <table style="margin-bottom:2.5pt">
            <tr>
                <td style="font-size:9.5pt;font-weight:bold;color:#000">Order #</td>
                <td class="r b" style="font-size:10pt;color:#000">${orderNum}</td>
            </tr>
            ${order.table?.name ? `<tr><td style="font-size:9.5pt;font-weight:bold;color:#000">Table</td><td class="r b" style="font-size:10pt;color:#000">${order.table.name}</td></tr>` : ''}
            <tr>
                <td style="font-size:9.5pt;font-weight:bold;color:#000">Type</td>
                <td class="r b" style="font-size:10pt;color:#000">${order.orderType || 'DINE IN'}</td>
            </tr>
            <tr>
                <td style="font-size:9.5pt;font-weight:bold;color:#000">Date</td>
                <td class="r b" style="font-size:10pt;color:#000">${dateStr}</td>
            </tr>
            <tr>
                <td style="font-size:9.5pt;font-weight:bold;color:#000">Time</td>
                <td class="r b" style="font-size:10pt;color:#000">${timeStr}</td>
            </tr>
            ${order.waiterName ? `<tr><td style="font-size:9.5pt;font-weight:bold;color:#000">Waiter</td><td class="r b" style="font-size:10pt;color:#000">${order.waiterName}</td></tr>` : ''}
            ${order.customerName ? `<tr><td colspan="2" style="font-size:9.5pt;font-weight:bold;color:#000">Customer: ${order.customerName}${order.customerPhone ? ' (' + order.customerPhone + ')' : ''}</td></tr>` : ''}
        </table>

        <div class="sep-thick" style="margin-bottom:2pt"></div>

        <table style="margin-bottom:2pt">
            <thead>
                <tr style="font-size:10pt;font-weight:bold;color:#000">
                    <td style="width:60%;padding:2pt 0">Item</td>
                    <td style="width:15%;text-align:center;padding:2pt 0">Qty</td>
                    <td style="width:25%;text-align:right;padding:2pt 0"></td>
                </tr>
                <tr><td colspan="3" style="padding:0"><div class="sep"></div></td></tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>

        <div class="sep-thick" style="margin-top:2.5pt;margin-bottom:3pt"></div>

        <div class="c" style="font-size:8pt;font-weight:bold;color:#000;padding-bottom:2pt">
            <div>--- Thank You ---</div>
        </div>
    </body></html>
    `;
}

export default generateKOT;
