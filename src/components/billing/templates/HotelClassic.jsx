const HotelClassic = ({ order, restaurant, settings, type = 'display' }) => {
    const currency = restaurant.currency || '₹';
    const isPrint = type === 'print';

    const col = {
        item: isPrint ? '45%' : 'auto',
        qty: isPrint ? '15%' : 'auto',
        rate: isPrint ? '20%' : 'auto',
        amount: isPrint ? '20%' : 'auto'
    };

    const formatDate = (d) => {
        const date = new Date(d);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (d) => {
        return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const taxRate = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0.0';

    return (
        <div className={`bg-white ${isPrint ? 'text-black p-1 max-w-[300px] mx-auto font-mono text-[9px] leading-tight' : 'text-black p-5 font-mono text-xs leading-snug'}`}>
            {/* ─── HEADER ─── */}
            <div className="text-center border-b-2 border-gray-400 pb-2 mb-2">
                {settings.showLogo && restaurant.logo && (
                    <img src={restaurant.logo} alt="" className="h-10 mx-auto mb-1 object-contain" />
                )}
                <h1 className={`${isPrint ? 'text-sm' : 'text-lg'} font-black uppercase tracking-wider`}>
                    {restaurant.name}
                </h1>
                {restaurant.tagline && (
                    <p className="text-gray-600 italic">{restaurant.tagline}</p>
                )}
                <p className="text-gray-600">
                    {[restaurant.address?.street, restaurant.address?.city, restaurant.address?.state, restaurant.address?.zipCode].filter(Boolean).join(', ')}
                </p>
                {restaurant.contact?.phone && <p className="text-gray-600">📞 {restaurant.contact.phone}</p>}
                {restaurant.alternatePhone && <p className="text-gray-600">📞 {restaurant.alternatePhone}</p>}
                {restaurant.contact?.email && <p className="text-gray-600">✉ {restaurant.contact.email}</p>}
                {restaurant.website && <p className="text-gray-600">🌐 {restaurant.website}</p>}
                {settings.showGstin && restaurant.gstin && <p className="text-gray-600 font-bold">GSTIN: {restaurant.gstin}</p>}
                {settings.showFssai && restaurant.fssai && <p className="text-gray-600">FSSAI: {restaurant.fssai}</p>}
            </div>

            {/* ─── TITLE ─── */}
            <div className="text-center border-b border-gray-300 pb-1 mb-2">
                <h2 className={`${isPrint ? 'text-xs' : 'text-sm'} font-bold uppercase tracking-widest`}>
                    {settings.invoiceTitle || 'TAX INVOICE'}
                </h2>
            </div>

            {/* ─── ORDER INFO ─── */}
            <div className={`${isPrint ? 'text-[8px]' : 'text-[10px]'} mb-2 border-b border-dashed border-gray-300 pb-2`}>
                <div className="flex justify-between">
                    <span>Invoice: <span className="font-bold">{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span></span>
                    <span>Date: {formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Time: {formatTime(order.createdAt)}</span>
                    {order.table?.name && <span>Table: {order.table.name}</span>}
                </div>
                {settings.showPax && order.pax && (
                    <div className="flex justify-between">
                        <span>PAX: {order.pax}</span>
                        <span>Type: {order.orderType || 'DINE IN'}</span>
                    </div>
                )}
                {settings.showWaiterName && order.waiterName && (
                    <span>Waiter: {order.waiterName}</span>
                )}
                {settings.showCashierName && order.cashierName && (
                    <span className="ml-4">Cashier: {order.cashierName}</span>
                )}
                {settings.showCustomerDetails && order.customerName && (
                    <div>Customer: {order.customerName}{order.customerPhone ? ` (${order.customerPhone})` : ''}</div>
                )}
            </div>

            {/* ─── ITEMS ─── */}
            <div className="mb-2">
                <div className={`flex border-b border-gray-400 pb-1 mb-1 font-bold ${isPrint ? 'text-[8px]' : 'text-[10px]'}`}>
                    <span className="flex-[2]">Item</span>
                    <span className="flex-1 text-center">Qty</span>
                    <span className="flex-1 text-right">Rate</span>
                    <span className="flex-1 text-right">Amt</span>
                </div>
                {(order.items || []).map((item, idx) => (
                    <div key={idx} className={`border-b border-dashed border-gray-200 py-1 ${isPrint ? 'text-[8px]' : 'text-[10px]'}`}>
                        <div className="flex">
                            <span className="flex-[2] break-words pr-1">{item.name || item.menuItem?.name}</span>
                            <span className="flex-1 text-center">{item.quantity}</span>
                            <span className="flex-1 text-right">{item.price?.toFixed(2)}</span>
                            <span className="flex-1 text-right font-bold">{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.specialInstructions && (
                            <p className="text-gray-500 italic ml-2">📝 {item.specialInstructions}</p>
                        )}
                        {item.modifiers?.map((mod, mi) => (
                            <p key={mi} className="text-gray-500 ml-2"> + {mod.name} {mod.price > 0 ? `(${mod.price.toFixed(2)})` : ''}</p>
                        ))}
                    </div>
                ))}
            </div>

            {/* ─── TOTALS ─── */}
            <div className="border-t-2 border-gray-400 pt-1 mb-2">
                <div className={`space-y-0.5 ${isPrint ? 'text-[8px]' : 'text-[10px]'}`}>
                    <div className="flex justify-between">
                        <span>Sub Total</span>
                        <span className="font-bold">{(order.subtotal || 0).toFixed(2)}</span>
                    </div>

                    {order.discountAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                            <span>Discount</span>
                            <span>-{(order.discountAmount || 0).toFixed(2)}</span>
                        </div>
                    )}

                    {settings.showServiceCharge && order.serviceChargeAmount > 0 && (
                        <div className="flex justify-between">
                            <span>Service Charge</span>
                            <span>{(order.serviceChargeAmount || 0).toFixed(2)}</span>
                        </div>
                    )}

                    {settings.showGstBreakdown && order.gstBreakdown ? (
                        <>
                            {order.gstBreakdown.cgst > 0 && (
                                <div className="flex justify-between">
                                    <span>CGST @ {((order.gstBreakdown.cgst / (order.subtotal || 1)) * 100).toFixed(1)}%</span>
                                    <span>{order.gstBreakdown.cgst.toFixed(2)}</span>
                                </div>
                            )}
                            {order.gstBreakdown.sgst > 0 && (
                                <div className="flex justify-between">
                                    <span>SGST @ {((order.gstBreakdown.sgst / (order.subtotal || 1)) * 100).toFixed(1)}%</span>
                                    <span>{order.gstBreakdown.sgst.toFixed(2)}</span>
                                </div>
                            )}
                            {order.gstBreakdown.igst > 0 && (
                                <div className="flex justify-between">
                                    <span>IGST @ {((order.gstBreakdown.igst / (order.subtotal || 1)) * 100).toFixed(1)}%</span>
                                    <span>{order.gstBreakdown.igst.toFixed(2)}</span>
                                </div>
                            )}
                        </>
                    ) : (order.tax || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>GST @ {taxRate}%</span>
                            <span>{(order.tax || 0).toFixed(2)}</span>
                        </div>
                    )}

                    {order.tipAmount > 0 && (
                        <div className="flex justify-between">
                            <span>Tip</span>
                            <span>{(order.tipAmount || 0).toFixed(2)}</span>
                        </div>
                    )}

                    <div className="border-t-2 border-gray-400 pt-1 mt-1">
                        <div className={`flex justify-between ${isPrint ? 'text-xs' : 'text-sm'} font-black`}>
                            <span>GRAND TOTAL</span>
                            <span>{(order.total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── ROUND OFF ─── */}
            {(() => {
                const rawTotal = (order.subtotal || 0) - (order.discountAmount || 0) + (order.tax || 0) + (order.serviceChargeAmount || 0) + (order.tipAmount || 0);
                const roundOff = (order.total || 0) - rawTotal;
                if (Math.abs(roundOff) > 0.01) {
                    return (
                        <div className="flex justify-between text-gray-500 border-t border-dashed border-gray-300 pt-1 mb-1">
                            <span>Round Off</span>
                            <span>{roundOff.toFixed(2)}</span>
                        </div>
                    );
                }
                return null;
            })()}

            {/* ─── AMOUNT IN WORDS ─── */}
            {settings.showAmountInWords && order.total > 0 && (
                <div className={`border-t border-dashed border-gray-300 pt-1 mb-1 ${isPrint ? 'text-[8px]' : 'text-[10px]'} italic text-gray-700`}>
                    <span className="font-bold">Amount in Words: </span>
                    {numberToWords(order.total)} ONLY
                </div>
            )}

            {/* ─── PAYMENT ─── */}
            <div className="border-t border-dashed border-gray-300 pt-1 mb-1">
                <div className="flex justify-between text-xs">
                    <span>Payment: {order.paymentMethod || '-'}</span>
                    <span className={order.paymentStatus === 'PAID' ? 'text-green-700 font-bold' : ''}>
                        {order.paymentStatus === 'PAID' ? '✓ PAID' : order.paymentStatus || 'PENDING'}
                    </span>
                </div>
            </div>

            {/* ─── QR CODE ─── */}
            {settings.showQRCode && settings.qrUrl && (
                <div className="text-center mb-1">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=${settings.qrSize === 'small' ? '120x120' : '160x160'}&data=${encodeURIComponent(settings.qrUrl)}`}
                        alt="QR"
                        className={`inline-block ${settings.qrSize === 'small' ? 'w-[120px]' : 'w-[160px]'}`}
                        crossOrigin="anonymous"
                    />
                </div>
            )}

            {/* ─── FOOTER ─── */}
            {settings.showFooter && (
                <div className={`text-center border-t-2 border-gray-400 pt-2 ${isPrint ? 'text-[8px]' : 'text-[10px]'} text-gray-700`}>
                    <p className="font-bold text-black">{settings.thankYouMessage}</p>
                    <p>{settings.visitAgainMessage}</p>
                    {settings.customerCareNumber && <p>📞 {settings.customerCareNumber}</p>}
                    {settings.footerEmail && <p>✉ {settings.footerEmail}</p>}
                    {settings.footerWebsite && <p>🌐 {settings.footerWebsite}</p>}
                    {settings.customFooterNote && <p className="italic mt-1">{settings.customFooterNote}</p>}
                    {settings.showPoweredBy && (
                        <p className="mt-1 text-gray-500">Powered by Ritam Bharat POS</p>
                    )}
                </div>
            )}
        </div>
    );
};

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

export default HotelClassic;
