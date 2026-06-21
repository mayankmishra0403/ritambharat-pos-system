const PremiumRestaurant = ({ order, restaurant, settings, type = 'display' }) => {
    const isPrint = type === 'print';
    const currency = restaurant.currency || '₹';

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <div className={`bg-white ${isPrint ? 'text-black p-2 max-w-[300px] mx-auto font-mono text-[9px] leading-tight' : 'text-black p-6 font-mono text-xs leading-snug'}`}>
            {/* ─── HEADER ─── */}
            <div className="text-center border-b border-gray-300 pb-3 mb-3">
                {settings.showLogo && restaurant.logo && (
                    <img src={restaurant.logo} alt="" className="h-12 mx-auto mb-2 object-contain" />
                )}
                <h1 className={`${isPrint ? 'text-sm' : 'text-xl'} font-bold uppercase tracking-widest text-gray-900`}>
                    {restaurant.name}
                </h1>
                {restaurant.tagline && (
                    <p className="text-gray-500 text-xs italic">{restaurant.tagline}</p>
                )}
                <div className="text-[10px] text-gray-600 mt-1">
                    <p>{restaurant.address?.street}, {restaurant.address?.city}</p>
                    <p>{restaurant.address?.state} - {restaurant.address?.zipCode}</p>
                    <p>📞 {restaurant.contact?.phone}{restaurant.alternatePhone ? ` | ${restaurant.alternatePhone}` : ''}</p>
                    {restaurant.contact?.email && <p>✉ {restaurant.contact.email}</p>}
                </div>
                <div className="flex justify-center gap-4 mt-1 text-[9px]">
                    {settings.showGstin && restaurant.gstin && <span className="font-bold">GST: {restaurant.gstin}</span>}
                    {settings.showFssai && restaurant.fssai && <span>FSSAI: {restaurant.fssai}</span>}
                </div>
            </div>

            {/* ─── TITLE ─── */}
            <div className="text-center mb-3">
                <div className="inline-block border border-gray-400 px-4 py-1">
                    <h2 className={`${isPrint ? 'text-xs' : 'text-sm'} font-bold uppercase tracking-widest`}>
                        {settings.invoiceTitle || 'TAX INVOICE'}
                    </h2>
                </div>
            </div>

            {/* ─── ORDER INFO ─── */}
            <div className={`${isPrint ? 'text-[8px]' : 'text-xs'} mb-3 border border-gray-300 p-2`}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <span>Invoice: <span className="font-bold">{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span></span>
                    <span className="text-right">Date: {formatDate(order.createdAt)}</span>
                    <span>Time: {formatTime(order.createdAt)}</span>
                    {order.table?.name && <span className="text-right">Table: {order.table.name}</span>}
                    {settings.showPax && order.pax && <span>PAX: {order.pax}</span>}
                    <span className="text-right">Type: {order.orderType || 'DINE IN'}</span>
                </div>
                {settings.showWaiterName && order.waiterName && <p className="mt-0.5">Waiter: {order.waiterName}</p>}
                {settings.showCashierName && order.cashierName && <p>Cashier: {order.cashierName}</p>}
                {settings.showCustomerDetails && order.customerName && (
                    <p className="mt-0.5">Customer: {order.customerName}{order.customerPhone ? ` (${order.customerPhone})` : ''}</p>
                )}
            </div>

            {/* ─── ITEMS ─── */}
            <div className="mb-3">
                <div className={`flex border-b-2 border-gray-800 pb-1 mb-1 font-bold ${isPrint ? 'text-[8px]' : 'text-xs'}`}>
                    <span className="flex-[2]">DESCRIPTION</span>
                    <span className="flex-1 text-center">QTY</span>
                    <span className="flex-1 text-right">RATE</span>
                    <span className="flex-1 text-right">AMOUNT</span>
                </div>
                {(order.items || []).map((item, idx) => (
                    <div key={idx} className={`border-b border-dotted border-gray-200 py-1 ${isPrint ? 'text-[8px]' : 'text-xs'}`}>
                        <div className="flex">
                            <span className="flex-[2] break-words pr-1">{item.name || item.menuItem?.name}</span>
                            <span className="flex-1 text-center">{item.quantity}</span>
                            <span className="flex-1 text-right">{currency}{item.price?.toFixed(2)}</span>
                            <span className="flex-1 text-right font-bold">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.specialInstructions && (
                            <p className="text-gray-500 ml-2 italic">— {item.specialInstructions}</p>
                        )}
                        {item.modifiers?.map((mod, mi) => (
                            <p key={mi} className="text-gray-500 ml-2">+ {mod.name}{mod.price > 0 ? ` (${currency}${mod.price.toFixed(2)})` : ''}</p>
                        ))}
                    </div>
                ))}
            </div>

            {/* ─── TOTALS ─── */}
            <div className="border-t-2 border-gray-800 pt-2 mb-3">
                <div className={`space-y-1 ${isPrint ? 'text-[8px]' : 'text-xs'}`}>
                    <div className="flex justify-between">
                        <span>Sub Total</span>
                        <span>{currency}{(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                            <span>Discount</span>
                            <span>-{currency}{(order.discountAmount || 0).toFixed(2)}</span>
                        </div>
                    )}
                    {settings.showServiceCharge && order.serviceChargeAmount > 0 && (
                        <div className="flex justify-between">
                            <span>Service Charge</span>
                            <span>{currency}{(order.serviceChargeAmount || 0).toFixed(2)}</span>
                        </div>
                    )}
                    {(() => {
                        if (settings.showGstBreakdown && order.gstBreakdown) {
                            return (
                                <>
                                    {order.gstBreakdown.cgst > 0 && (
                                        <div className="flex justify-between">
                                            <span>CGST @ {((order.gstBreakdown.cgst / (order.subtotal || 1)) * 100).toFixed(1)}%</span>
                                            <span>{currency}{order.gstBreakdown.cgst.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {order.gstBreakdown.sgst > 0 && (
                                        <div className="flex justify-between">
                                            <span>SGST @ {((order.gstBreakdown.sgst / (order.subtotal || 1)) * 100).toFixed(1)}%</span>
                                            <span>{currency}{order.gstBreakdown.sgst.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {order.gstBreakdown.igst > 0 && (
                                        <div className="flex justify-between">
                                            <span>IGST @ {((order.gstBreakdown.igst / (order.subtotal || 1)) * 100).toFixed(1)}%</span>
                                            <span>{currency}{order.gstBreakdown.igst.toFixed(2)}</span>
                                        </div>
                                    )}
                                </>
                            );
                        }
                        if ((order.tax || 0) > 0) {
                            const taxRate = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0.0';
                            return (
                                <div className="flex justify-between">
                                    <span>GST @ {taxRate}%</span>
                                    <span>{currency}{(order.tax || 0).toFixed(2)}</span>
                                </div>
                            );
                        }
                        return null;
                    })()}
                    <div className="border-t-2 border-gray-800 pt-1 mt-1">
                        <div className={`flex justify-between ${isPrint ? 'text-xs' : 'text-base'} font-black`}>
                            <span>GRAND TOTAL</span>
                            <span>{currency}{(order.total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── AMOUNT IN WORDS ─── */}
            {settings.showAmountInWords && order.total > 0 && (
                <div className={`border-t border-dotted border-gray-300 pt-1 mb-2 ${isPrint ? 'text-[8px]' : 'text-xs'} italic`}>
                    <span className="font-bold">Amount in Words: </span>
                    {numberToWords(order.total)} ONLY
                </div>
            )}

            {/* ─── PAYMENT ─── */}
            <div className="border-t border-dotted border-gray-300 pt-1 mb-2 flex justify-between text-xs">
                <span>Payment: {order.paymentMethod || '-'}</span>
                <span className={order.paymentStatus === 'PAID' ? 'text-green-700 font-bold' : ''}>
                    {order.paymentStatus === 'PAID' ? '✓ PAID' : order.paymentStatus || 'PENDING'}
                </span>
            </div>

            {/* ─── QR ─── */}
            {settings.showQRCode && settings.qrUrl && (
                <div className="text-center mb-2">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${settings.qrSize === 'small' ? '120x120' : '160x160'}&data=${encodeURIComponent(settings.qrUrl)}`}
                        alt="QR" className={`inline-block ${settings.qrSize === 'small' ? 'w-[120px]' : 'w-[160px]'}`} crossOrigin="anonymous" />
                </div>
            )}

            {/* ─── FOOTER ─── */}
            {settings.showFooter && (
                <div className={`text-center border-t border-gray-300 pt-2 ${isPrint ? 'text-[8px]' : 'text-xs'} text-gray-600`}>
                    <p className="font-bold text-gray-900">{settings.thankYouMessage}</p>
                    <p className="italic">{settings.visitAgainMessage}</p>
                    {settings.customerCareNumber && <p>📞 {settings.customerCareNumber}</p>}
                    {settings.footerEmail && <p>✉ {settings.footerEmail}</p>}
                    {settings.customFooterNote && <p className="mt-1">{settings.customFooterNote}</p>}
                    {settings.showPoweredBy && <p className="mt-1 text-gray-400">Powered by Ritam Bharat POS</p>}
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

export default PremiumRestaurant;
