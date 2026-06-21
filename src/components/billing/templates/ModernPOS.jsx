const ModernPOS = ({ order, restaurant, settings, type = 'display' }) => {
    const isPrint = type === 'print';
    const currency = restaurant.currency || '₹';
    const taxRate = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0.0';

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <div className={`bg-white ${isPrint ? 'text-black p-2 max-w-[300px] mx-auto font-sans text-[9px] leading-tight' : 'text-black p-5 font-sans text-xs leading-snug'}`}>
            {/* ─── HEADER ─── */}
            <div className="text-center mb-3">
                <h1 className={`${isPrint ? 'text-base' : 'text-xl'} font-bold uppercase tracking-wide`}>{restaurant.name}</h1>
                {settings.showLogo && restaurant.logo && (
                    <img src={restaurant.logo} alt="" className="h-8 mx-auto mb-1 object-contain" />
                )}
                <p className="text-gray-500 text-[10px]">{restaurant.address?.street}, {restaurant.address?.city}</p>
                <p className="text-gray-500 text-[10px]">📞 {restaurant.contact?.phone}</p>
                {settings.showGstin && restaurant.gstin && <p className="text-[9px] font-bold">GSTIN: {restaurant.gstin}</p>}
                {settings.showFssai && restaurant.fssai && <p className="text-[9px]">FSSAI: {restaurant.fssai}</p>}
            </div>

            <div className="text-center mb-2">
                <span className={`${isPrint ? 'text-[10px]' : 'text-xs'} bg-gray-900 text-white px-3 py-0.5 font-bold uppercase tracking-widest`}>
                    {settings.invoiceTitle || 'INVOICE'}
                </span>
            </div>

            {/* ─── ORDER INFO ─── */}
            <div className={`${isPrint ? 'text-[8px]' : 'text-[10px]'} flex justify-between mb-2 border-b border-gray-300 pb-1`}>
                <div>
                    <p><span className="font-bold">#{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span></p>
                    <p>{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                    <p>{formatTime(order.createdAt)}</p>
                    {order.table?.name && <p>Table: {order.table.name}</p>}
                    <p>{order.orderType || 'DINE IN'}</p>
                </div>
            </div>

            {settings.showCustomerDetails && order.customerName && (
                <p className={`${isPrint ? 'text-[8px]' : 'text-[10px]'} mb-2`}>
                    {order.customerName}{order.customerPhone ? ` (${order.customerPhone})` : ''}
                </p>
            )}

            {/* ─── ITEMS ─── */}
            <div className="mb-2">
                <div className={`flex border-b-2 border-gray-800 pb-1 mb-1 font-bold ${isPrint ? 'text-[8px]' : 'text-[10px]'}`}>
                    <span className="flex-[3]">ITEM</span>
                    <span className="flex-1 text-center">QTY</span>
                    <span className="flex-1 text-right">AMOUNT</span>
                </div>
                {(order.items || []).map((item, idx) => (
                    <div key={idx} className={`flex border-b border-dotted border-gray-200 py-0.5 ${isPrint ? 'text-[8px]' : 'text-[10px]'}`}>
                        <span className="flex-[3] break-words pr-1">{item.name || item.menuItem?.name}</span>
                        <span className="flex-1 text-center">{item.quantity}</span>
                        <span className="flex-1 text-right font-bold">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* ─── TOTALS ─── */}
            <div className={`border-t-2 border-gray-800 pt-1 ${isPrint ? 'text-[8px]' : 'text-[10px]'}`}>
                <div className="flex justify-between"><span>Subtotal</span><span>{currency}{(order.subtotal || 0).toFixed(2)}</span></div>
                {order.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>-{currency}{(order.discountAmount || 0).toFixed(2)}</span></div>}
                {(order.tax || 0) > 0 && <div className="flex justify-between"><span>GST @ {taxRate}%</span><span>{currency}{(order.tax || 0).toFixed(2)}</span></div>}
                <div className={`flex justify-between border-t-2 border-gray-800 pt-1 mt-1 ${isPrint ? 'text-xs' : 'text-sm'} font-black`}>
                    <span>TOTAL</span>
                    <span>{currency}{(order.total || 0).toFixed(2)}</span>
                </div>
            </div>

            {/* ─── PAYMENT ─── */}
            <div className={`border-t border-dotted border-gray-300 mt-2 pt-1 flex justify-between ${isPrint ? 'text-[8px]' : 'text-[10px]'}`}>
                <span>{order.paymentMethod || '-'}</span>
                <span className={order.paymentStatus === 'PAID' ? 'text-green-700 font-bold' : ''}>{order.paymentStatus || 'PENDING'}</span>
            </div>

            {/* ─── QR ─── */}
            {settings.showQRCode && settings.qrUrl && (
                <div className="text-center mt-1">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${settings.qrSize === 'small' ? '120x120' : '160x160'}&data=${encodeURIComponent(settings.qrUrl)}`}
                        alt="QR" className={`inline-block ${settings.qrSize === 'small' ? 'w-[100px]' : 'w-[140px]'}`} crossOrigin="anonymous" />
                </div>
            )}

            {/* ─── FOOTER ─── */}
            {settings.showFooter && (
                <div className={`text-center border-t border-gray-300 mt-2 pt-1 ${isPrint ? 'text-[8px]' : 'text-[10px]'} text-gray-500`}>
                    <p className="font-bold text-gray-800">{settings.thankYouMessage}</p>
                    {settings.visitAgainMessage && <p>{settings.visitAgainMessage}</p>}
                    {settings.showPoweredBy && <p className="mt-0.5 text-gray-400">Ritam Bharat POS</p>}
                </div>
            )}
        </div>
    );
};

export default ModernPOS;
