import numberToWords from '../../../utils/numberToWords';

const MinimalReceipt = ({ order, restaurant, settings, type = 'display' }) => {
    const isPrint = type === 'print';
    const currency = restaurant.currency || '\u20B9';
    const taxRate = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0.0';

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className={`bg-white text-black ${isPrint ? 'max-w-[72mm] mx-auto font-mono text-[8pt] leading-tight' : 'p-4 font-mono text-[10px] leading-snug'}`}>
            {/* ─── HEADER ─── */}
            <div className="text-center mb-2 border-b border-dashed border-gray-300 pb-2">
                <h1 className={`${isPrint ? 'text-[14pt]' : 'text-sm'} font-bold uppercase`}>{restaurant.name}</h1>
                <p className="text-gray-500 text-[7.5pt]">{restaurant.address?.city}, {restaurant.contact?.phone}</p>
                {settings.showGstin && restaurant.gstin && <p className="font-bold text-[8pt]">GST: {restaurant.gstin}</p>}
                {settings.showFssai && restaurant.fssai && <p className="text-[7.5pt]">FSSAI: {restaurant.fssai}</p>}
            </div>

            {/* ─── ORDER INFO ─── */}
            <div className="flex justify-between mb-1 text-[8pt]">
                <span className="font-bold">#{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span>
                <span>{formatDate(order.createdAt)}</span>
            </div>
            {order.table?.name && <p className="mb-1 text-[8pt]">Table: {order.table.name} | {order.orderType || 'DINE IN'}</p>}
            {settings.showWaiterName && order.waiterName && <p className="text-[8pt]">Waiter: {order.waiterName}</p>}
            {settings.showCustomerDetails && order.customerName && (
                <p className="text-[8pt] mb-1">Customer: {order.customerName}{order.customerPhone ? ' (' + order.customerPhone + ')' : ''}</p>
            )}

            <div className="border-t border-dashed border-gray-300 mb-1"></div>

            {/* ─── ITEMS ─── */}
            {(order.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between py-0.5 text-[8pt]">
                    <span className="flex-1 break-words pr-1">{item.quantity}x {item.name || item.menuItem?.name}</span>
                    <span className="font-bold shrink-0">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
            ))}

            {/* ─── TOTALS ─── */}
            <div className="border-t border-dashed border-gray-300 mt-1 pt-1 text-[8pt]">
                <div className="flex justify-between"><span>Subtotal</span><span>{currency}{(order.subtotal || 0).toFixed(2)}</span></div>
                {order.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>-{currency}{(order.discountAmount || 0).toFixed(2)}</span></div>}
                {(order.tax || 0) > 0 && <div className="flex justify-between"><span>GST @ {taxRate}%</span><span>{currency}{(order.tax || 0).toFixed(2)}</span></div>}
                <div className={`flex justify-between border-t border-gray-800 pt-1 mt-1 ${isPrint ? 'text-[11pt]' : 'text-sm'} font-black`}>
                    <span>TOTAL</span>
                    <span>{currency}{(order.total || 0).toFixed(2)}</span>
                </div>
            </div>

            {/* ─── AMOUNT IN WORDS ─── */}
            {settings.showAmountInWords && order.total > 0 && (
                <div className={`border-t border-dashed border-gray-300 pt-1 mt-1 text-[8pt] italic text-gray-700`}>
                    <span className="font-bold">Amount in Words: </span>
                    {numberToWords(order.total)} ONLY
                </div>
            )}

            {/* ─── PAYMENT ─── */}
            <div className="border-t border-dashed border-gray-300 mt-1 pt-1 flex justify-between text-[8pt] text-gray-500">
                <span>{order.paymentMethod || '-'}</span>
                <span className={order.paymentStatus === 'PAID' ? 'text-green-700 font-bold' : ''}>{order.paymentStatus || ''}</span>
            </div>

            {/* ─── QR ─── */}
            {settings.showQRCode && settings.qrUrl && (
                <div className="text-center mt-1">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(settings.qrUrl)}`}
                        alt="QR"
                        style={{ width: '150px', display: 'inline-block' }}
                    />
                </div>
            )}

            {/* ─── FOOTER ─── */}
            {settings.showFooter && (
                <div className="text-center mt-1 border-t border-gray-300 pt-1 text-[7.5pt] text-gray-500">
                    <p className="font-bold text-gray-800">{settings.thankYouMessage || 'Thank You For Visiting'}</p>
                    {settings.visitAgainMessage && <p>{settings.visitAgainMessage}</p>}
                    {settings.showPoweredBy && <p>Ritam Bharat POS</p>}
                </div>
            )}
        </div>
    );
};

export default MinimalReceipt;
