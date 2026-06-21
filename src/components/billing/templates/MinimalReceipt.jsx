const MinimalReceipt = ({ order, restaurant, settings, type = 'display' }) => {
    const isPrint = type === 'print';
    const currency = restaurant.currency || '₹';
    const taxRate = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0.0';

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className={`bg-white ${isPrint ? 'text-black p-1 max-w-[280px] mx-auto font-mono text-[8px] leading-tight' : 'text-black p-4 font-mono text-[10px] leading-snug'}`}>
            <div className="text-center mb-2 border-b border-dashed border-gray-300 pb-2">
                <h1 className={`${isPrint ? 'text-xs' : 'text-sm'} font-bold uppercase`}>{restaurant.name}</h1>
                <p className="text-gray-500">{restaurant.address?.city}, {restaurant.contact?.phone}</p>
                {settings.showGstin && restaurant.gstin && <p className="font-bold">GST: {restaurant.gstin}</p>}
            </div>

            <div className="flex justify-between mb-1">
                <span className="font-bold">#{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span>
                <span>{formatDate(order.createdAt)}</span>
            </div>
            {order.table?.name && <p className="mb-1">Table: {order.table.name} | {order.orderType || 'DINE IN'}</p>}

            <div className="border-t border-dashed border-gray-300 mb-1"></div>

            {(order.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between py-0.5">
                    <span className="flex-1 break-words pr-1">{item.quantity}x {item.name || item.menuItem?.name}</span>
                    <span className="font-bold shrink-0">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
            ))}

            <div className="border-t border-dashed border-gray-300 mt-1 pt-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{currency}{(order.subtotal || 0).toFixed(2)}</span></div>
                {order.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>-{currency}{(order.discountAmount || 0).toFixed(2)}</span></div>}
                {(order.tax || 0) > 0 && <div className="flex justify-between"><span>GST @ {taxRate}%</span><span>{currency}{(order.tax || 0).toFixed(2)}</span></div>}
                <div className={`flex justify-between border-t border-gray-800 pt-1 mt-1 ${isPrint ? 'text-xs' : 'text-sm'} font-black`}>
                    <span>TOTAL</span>
                    <span>{currency}{(order.total || 0).toFixed(2)}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300 mt-1 pt-1 flex justify-between text-gray-500">
                <span>{order.paymentMethod || '-'}</span>
                <span className={order.paymentStatus === 'PAID' ? 'text-green-700 font-bold' : ''}>{order.paymentStatus || ''}</span>
            </div>

            {settings.showFooter && (
                <div className="text-center mt-1 text-gray-500">
                    <p className="font-bold text-gray-800">{settings.thankYouMessage}</p>
                    {settings.showPoweredBy && <p>Ritam Bharat POS</p>}
                </div>
            )}
        </div>
    );
};

export default MinimalReceipt;
