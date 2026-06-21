import numberToWords from '../../../utils/numberToWords';

const ModernPOS = ({ order, restaurant, settings, type = 'display' }) => {
    const isPrint = type === 'print';
    const currency = restaurant.currency || '\u20B9';
    const taxRate = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0.0';

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <div className={`bg-white text-black ${isPrint ? 'max-w-[72mm] mx-auto font-sans text-[8pt] leading-tight' : 'p-5 font-sans text-xs leading-snug'}`}>
            {/* ─── HEADER ─── */}
            <div className="text-center mb-3">
                <h1 className={`${isPrint ? 'text-[18pt]' : 'text-xl'} font-bold uppercase tracking-wide text-black`}>{restaurant.name}</h1>
                {settings.showLogo && restaurant.logo && (
                    <img src={restaurant.logo} alt="" className="h-8 mx-auto mb-1 object-contain" />
                )}
                <p className="font-bold text-black text-[7.5pt]">{restaurant.address?.street}, {restaurant.address?.city}</p>
                <p className="font-bold text-black text-[7.5pt]">{restaurant.contact?.phone}</p>
                {settings.showGstin && restaurant.gstin && <p className="text-[8pt] font-bold text-black">GSTIN: {restaurant.gstin}</p>}
                {settings.showFssai && restaurant.fssai && <p className="text-[7.5pt] font-bold text-black">FSSAI: {restaurant.fssai}</p>}
            </div>

            <div className="text-center mb-2">
                <span className={`${isPrint ? 'text-[9pt]' : 'text-xs'} bg-gray-900 text-white px-3 py-0.5 font-bold uppercase tracking-widest`}>
                    {settings.invoiceTitle || 'INVOICE'}
                </span>
            </div>

            {/* ─── ORDER INFO ─── */}
            <div className={`${isPrint ? 'text-[8pt]' : 'text-[10px]'} flex justify-between mb-2 border-b border-dashed border-black pb-1`}>
                <div className="font-bold text-black">
                    <p><span className="font-bold">#{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span></p>
                    <p>{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right font-bold text-black">
                    <p>{formatTime(order.createdAt)}</p>
                    {order.table?.name && <p>Table: {order.table.name}</p>}
                    <p>{order.orderType || 'DINE IN'}</p>
                </div>
            </div>

            {settings.showCustomerDetails && order.customerName && (
                <p className={`${isPrint ? 'text-[8pt]' : 'text-[10px]'} mb-2 font-bold text-black`}>
                    {order.customerName}{order.customerPhone ? ' (' + order.customerPhone + ')' : ''}
                </p>
            )}

            {/* ─── ITEMS ─── */}
            <div className="mb-2">
                <div className={`flex border-b-2 border-black pb-1 mb-1 font-bold ${isPrint ? 'text-[8pt]' : 'text-[10px]'} text-black`}>
                    <span style={{ width: '58%' }}>ITEM</span>
                    <span style={{ width: '18%' }} className="text-center">QTY</span>
                    <span style={{ width: '24%' }} className="text-right">AMOUNT</span>
                </div>
                {(order.items || []).map((item, idx) => (
                    <div key={idx} className={`flex border-b border-dotted border-black py-0.5 ${isPrint ? 'text-[8pt]' : 'text-[10px]'} font-bold text-black`}>
                        <span style={{ width: '58%' }} className="break-words pr-1">{item.name || item.menuItem?.name}</span>
                        <span style={{ width: '18%' }} className="text-center">{item.quantity}</span>
                        <span style={{ width: '24%' }} className="text-right">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* ─── TOTALS ─── */}
            <div className={`border-t-2 border-black pt-1 ${isPrint ? 'text-[8pt]' : 'text-[10px]'} font-bold text-black`}>
                <div className="flex justify-between"><span>Subtotal</span><span>{currency}{(order.subtotal || 0).toFixed(2)}</span></div>
                {order.discountAmount > 0 && <div className="flex justify-between text-black"><span>Discount</span><span>-{currency}{(order.discountAmount || 0).toFixed(2)}</span></div>}
                {(order.tax || 0) > 0 && <div className="flex justify-between"><span>GST @ {taxRate}%</span><span>{currency}{(order.tax || 0).toFixed(2)}</span></div>}
                {(() => {
                    const rawTotal = (order.subtotal || 0) - (order.discountAmount || 0) + (order.tax || 0) + (order.serviceChargeAmount || 0) + (order.tipAmount || 0);
                    const roundOff = (order.total || 0) - rawTotal;
                    if (Math.abs(roundOff) > 0.01) {
                        return <div className="flex justify-between"><span>Round Off</span><span>{currency}{roundOff.toFixed(2)}</span></div>;
                    }
                    return null;
                })()}
                <div className={`flex justify-between border-t-2 border-black pt-1 mt-1 ${isPrint ? 'text-[14pt]' : 'text-sm'} font-black text-black`}>
                    <span>TOTAL</span>
                    <span>{currency}{(order.total || 0).toFixed(2)}</span>
                </div>
            </div>

            {/* ─── AMOUNT IN WORDS ─── */}
            {settings.showAmountInWords && order.total > 0 && (
                <div className={`border-t border-dashed border-black pt-1 mt-2 ${isPrint ? 'text-[8pt]' : 'text-[10px]'} font-bold text-black`}>
                    <span className="font-bold">Amount in Words: </span>
                    {numberToWords(order.total)} ONLY
                </div>
            )}

            {/* ─── PAYMENT ─── */}
            <div className={`border-t border-dashed border-black mt-1 pt-1 flex justify-between ${isPrint ? 'text-[8pt]' : 'text-[10px]'} font-bold text-black`}>
                <span>{order.paymentMethod || '-'}</span>
                <span className={order.paymentStatus === 'PAID' ? 'text-green-700 font-bold' : 'text-black'}>{order.paymentStatus || 'PENDING'}</span>
            </div>

            {/* ─── QR ─── */}
            {settings.showQRCode && settings.qrUrl && (
                <div className="text-center mt-1">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(settings.qrUrl)}&ecc=H&margin=4`}
                        alt="QR"
                        style={{ width: '30mm', height: '30mm', display: 'inline-block' }}
                    />
                </div>
            )}

            {/* ─── FOOTER ─── */}
            {settings.showFooter && (
                <div className={`text-center border-t border-black mt-1 pt-1 ${isPrint ? 'text-[7.5pt]' : 'text-[10px]'} font-bold text-black`}>
                    <p className="font-bold text-black">{settings.thankYouMessage || 'Thank You For Visiting'}</p>
                    {settings.visitAgainMessage && <p className="font-bold text-black">{settings.visitAgainMessage}</p>}
                    {settings.showPoweredBy && <p className="mt-0.5 font-bold text-black">Ritam Bharat POS</p>}
                </div>
            )}
        </div>
    );
};

export default ModernPOS;
