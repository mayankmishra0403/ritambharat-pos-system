import numberToWords from '../../../utils/numberToWords';

const HotelClassic = ({ order, restaurant, settings, type = 'display' }) => {
    const currency = restaurant.currency || '\u20B9';
    const isPrint = type === 'print';

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const formatTime = (d) =>
        new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const taxRate = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0.0';

    return (
        <div className={`bg-white text-black ${isPrint ? 'max-w-[72mm] mx-auto font-mono text-[8pt] leading-tight' : 'p-5 font-mono text-xs leading-snug'}`}>
            {/* ─── HEADER ─── */}
            <div className="text-center border-b-2 border-gray-800 pb-2 mb-2">
                {settings.showLogo && restaurant.logo && (
                    <img src={restaurant.logo} alt="" className="h-8 mx-auto mb-1 object-contain" />
                )}
                <h1 className={`${isPrint ? 'text-[14pt]' : 'text-lg'} font-black uppercase tracking-wider`}>
                    {restaurant.name}
                </h1>
                {restaurant.tagline && (
                    <p className="text-gray-600 italic text-[8pt]">{restaurant.tagline}</p>
                )}
                <p className="text-gray-600 text-[7.5pt]">
                    {[restaurant.address?.street, restaurant.address?.city, restaurant.address?.state, restaurant.address?.zipCode].filter(Boolean).join(', ')}
                </p>
                {restaurant.contact?.phone && <p className="text-gray-600 text-[7.5pt]">{restaurant.contact.phone}</p>}
                {restaurant.alternatePhone && <p className="text-gray-600 text-[7.5pt]">{restaurant.alternatePhone}</p>}
                {restaurant.contact?.email && <p className="text-gray-600 text-[7.5pt]">{restaurant.contact.email}</p>}
                {restaurant.website && <p className="text-gray-600 text-[7.5pt]">{restaurant.website}</p>}
                {settings.showGstin && restaurant.gstin && <p className="font-bold text-[8pt]">GSTIN: {restaurant.gstin}</p>}
                {settings.showFssai && restaurant.fssai && <p className="text-gray-600 text-[7.5pt]">FSSAI: {restaurant.fssai}</p>}
            </div>

            {/* ─── INVOICE TITLE ─── */}
            <div className="text-center border-b border-dashed border-gray-300 pb-1 mb-2">
                <h2 className={`${isPrint ? 'text-[10pt]' : 'text-sm'} font-bold uppercase tracking-widest`}>
                    {settings.invoiceTitle || 'TAX INVOICE'}
                </h2>
            </div>

            {/* ─── ORDER INFO ─── */}
            <div className={`${isPrint ? 'text-[8pt]' : 'text-[10px]'} mb-2 border-b border-dashed border-gray-300 pb-2`}>
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
                {settings.showWaiterName && order.waiterName && <div>Waiter: {order.waiterName}</div>}
                {settings.showCashierName && order.cashierName && <div>Cashier: {order.cashierName}</div>}
                {settings.showCustomerDetails && order.customerName && (
                    <div>Customer: {order.customerName}{order.customerPhone ? ` (${order.customerPhone})` : ''}</div>
                )}
            </div>

            {/* ─── ITEMS ─── */}
            <div className="mb-2">
                <div className={`flex border-b-2 border-gray-800 pb-1 mb-1 font-bold ${isPrint ? 'text-[8pt]' : 'text-[10px]'}`}>
                    <span style={{ width: '44%' }}>Item</span>
                    <span style={{ width: '14%' }} className="text-center">Qty</span>
                    <span style={{ width: '20%' }} className="text-right">Rate</span>
                    <span style={{ width: '22%' }} className="text-right">Amt</span>
                </div>
                {(order.items || []).map((item, idx) => (
                    <div key={idx} className={`border-b border-dashed border-gray-200 py-1 ${isPrint ? 'text-[8pt]' : 'text-[10px]'}`}>
                        <div className="flex">
                            <span style={{ width: '44%' }} className="break-words pr-1">{item.name || item.menuItem?.name}</span>
                            <span style={{ width: '14%' }} className="text-center">{item.quantity}</span>
                            <span style={{ width: '20%' }} className="text-right">{currency}{item.price?.toFixed(2)}</span>
                            <span style={{ width: '22%' }} className="text-right font-bold">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.specialInstructions && (
                            <p className="text-gray-500 italic ml-2 text-[7pt]">— {item.specialInstructions}</p>
                        )}
                        {item.modifiers?.map((mod, mi) => (
                            <p key={mi} className="text-gray-500 ml-2 text-[7pt]">+ {mod.name}{mod.price > 0 ? ` (${currency}${mod.price.toFixed(2)})` : ''}</p>
                        ))}
                    </div>
                ))}
            </div>

            {/* ─── TOTALS ─── */}
            <div className="border-t-2 border-gray-900 pt-1 mb-2">
                <div className={`space-y-0.5 ${isPrint ? 'text-[8pt]' : 'text-[10px]'}`}>
                    <div className="flex justify-between">
                        <span>Sub Total</span>
                        <span className="font-bold">{currency}{(order.subtotal || 0).toFixed(2)}</span>
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

                    {settings.showGstBreakdown && order.gstBreakdown ? (
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
                    ) : (order.tax || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>GST @ {taxRate}%</span>
                            <span>{currency}{(order.tax || 0).toFixed(2)}</span>
                        </div>
                    )}

                    {order.tipAmount > 0 && (
                        <div className="flex justify-between">
                            <span>Tip</span>
                            <span>{currency}{(order.tipAmount || 0).toFixed(2)}</span>
                        </div>
                    )}

                    {(() => {
                        const rawTotal = (order.subtotal || 0) - (order.discountAmount || 0) + (order.tax || 0) + (order.serviceChargeAmount || 0) + (order.tipAmount || 0);
                        const roundOff = (order.total || 0) - rawTotal;
                        if (Math.abs(roundOff) > 0.01) {
                            return (
                                <div className="flex justify-between text-gray-500">
                                    <span>Round Off</span>
                                    <span>{currency}{roundOff.toFixed(2)}</span>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <div className="border-t-2 border-gray-900 pt-1 mt-1">
                        <div className={`flex justify-between ${isPrint ? 'text-[11pt]' : 'text-sm'} font-black`}>
                            <span>GRAND TOTAL</span>
                            <span>{currency}{(order.total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── AMOUNT IN WORDS ─── */}
            {settings.showAmountInWords && order.total > 0 && (
                <div className={`border-t border-dashed border-gray-300 pt-1 mb-1 ${isPrint ? 'text-[8pt]' : 'text-[10px]'} italic text-gray-700`}>
                    <span className="font-bold">Amount in Words: </span>
                    {numberToWords(order.total)} ONLY
                </div>
            )}

            {/* ─── PAYMENT ─── */}
            <div className="border-t border-dashed border-gray-300 pt-1 mb-1">
                <div className="flex justify-between text-[8pt]">
                    <span>{order.paymentMethod || '-'}</span>
                    <span className={order.paymentStatus === 'PAID' ? 'text-green-700 font-bold' : ''}>
                        {order.paymentStatus === 'PAID' ? '\u2713 PAID' : order.paymentStatus || 'PENDING'}
                    </span>
                </div>
            </div>

            {/* ─── QR CODE ─── */}
            {settings.showQRCode && settings.qrUrl && (
                <div className="text-center my-1">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(settings.qrUrl)}`}
                        alt="QR"
                        style={{ width: '150px', display: 'inline-block' }}
                    />
                </div>
            )}

            {/* ─── FOOTER ─── */}
            {settings.showFooter && (
                <div className={`text-center border-t-2 border-gray-800 pt-2 ${isPrint ? 'text-[7.5pt]' : 'text-[10px]'} text-gray-700`}>
                    <p className="font-bold text-black">{settings.thankYouMessage || 'Thank You For Visiting'}</p>
                    <p>{settings.visitAgainMessage || 'Please Visit Again'}</p>
                    {settings.customerCareNumber && <p>{settings.customerCareNumber}</p>}
                    {settings.footerEmail && <p>{settings.footerEmail}</p>}
                    {settings.footerWebsite && <p>{settings.footerWebsite}</p>}
                    {settings.customFooterNote && <p className="italic mt-1">{settings.customFooterNote}</p>}
                    {settings.showPoweredBy && (
                        <p className="mt-1 text-gray-500">Ritam Bharat POS</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default HotelClassic;
