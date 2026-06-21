import numberToWords from '../../../utils/numberToWords';

const PremiumRestaurant = ({ order, restaurant, settings, type = 'display' }) => {
    const isPrint = type === 'print';
    const currency = restaurant.currency || '\u20B9';

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <div className={`bg-white text-black ${isPrint ? 'max-w-[72mm] mx-auto font-mono text-[8pt] leading-tight' : 'p-6 font-mono text-xs leading-snug'}`}>
            {/* ─── HEADER ─── */}
            <div className="text-center border-b-2 border-black pb-3 mb-3">
                {settings.showLogo && restaurant.logo && (
                    <img src={restaurant.logo} alt="" className="h-10 mx-auto mb-2 object-contain" />
                )}
                <h1 className={`${isPrint ? 'text-[18pt]' : 'text-xl'} font-bold uppercase tracking-widest text-black`}>
                    {restaurant.name}
                </h1>
                {restaurant.tagline && (
                    <p className="font-bold text-black text-[8pt]">{restaurant.tagline}</p>
                )}
                <div className="text-[7.5pt] font-bold text-black mt-1">
                    <p>{restaurant.address?.street}, {restaurant.address?.city}</p>
                    <p>{restaurant.address?.state} - {restaurant.address?.zipCode}</p>
                    <p>{restaurant.contact?.phone}{restaurant.alternatePhone ? ' | ' + restaurant.alternatePhone : ''}</p>
                    {restaurant.contact?.email && <p>{restaurant.contact.email}</p>}
                </div>
                <div className="flex justify-center gap-4 mt-1 text-[8pt]">
                    {settings.showGstin && restaurant.gstin && <span className="font-bold text-black">GST: {restaurant.gstin}</span>}
                    {settings.showFssai && restaurant.fssai && <span className="font-bold text-black">FSSAI: {restaurant.fssai}</span>}
                </div>
            </div>

            {/* ─── TITLE ─── */}
            <div className="text-center mb-3">
                <div className="inline-block border border-black px-3 py-1">
                    <h2 className={`${isPrint ? 'text-[12pt]' : 'text-sm'} font-bold uppercase tracking-widest text-black`}>
                        {settings.invoiceTitle || 'TAX INVOICE'}
                    </h2>
                </div>
            </div>

            {/* ─── ORDER INFO ─── */}
            <div className={`${isPrint ? 'text-[8pt]' : 'text-xs'} mb-3 border border-black p-2`}>
                <div className="flex justify-between gap-2 font-bold text-black">
                    <span>Invoice: <span className="font-bold">{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span></span>
                    <span>Date: {formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between gap-2 font-bold text-black">
                    <span>Time: {formatTime(order.createdAt)}</span>
                    {order.table?.name && <span>Table: {order.table.name}</span>}
                </div>
                <div className="flex justify-between gap-2 font-bold text-black">
                    {settings.showPax && order.pax && <span>PAX: {order.pax}</span>}
                    <span>Type: {order.orderType || 'DINE IN'}</span>
                </div>
                {settings.showWaiterName && order.waiterName && <div className="font-bold text-black">Waiter: {order.waiterName}</div>}
                {settings.showCashierName && order.cashierName && <div className="font-bold text-black">Cashier: {order.cashierName}</div>}
                {settings.showCustomerDetails && order.customerName && (
                    <div className="font-bold text-black">Customer: {order.customerName}{order.customerPhone ? ' (' + order.customerPhone + ')' : ''}</div>
                )}
            </div>

            {/* ─── ITEMS ─── */}
            <div className="mb-3">
                <div className={`flex border-b-2 border-black pb-1 mb-1 font-bold ${isPrint ? 'text-[8pt]' : 'text-xs'} text-black`}>
                    <span style={{ width: '44%' }}>DESCRIPTION</span>
                    <span style={{ width: '14%' }} className="text-center">QTY</span>
                    <span style={{ width: '20%' }} className="text-right">RATE</span>
                    <span style={{ width: '22%' }} className="text-right">AMOUNT</span>
                </div>
                {(order.items || []).map((item, idx) => (
                    <div key={idx} className={`border-b border-dotted border-black py-1 ${isPrint ? 'text-[8pt]' : 'text-xs'}`}>
                        <div className="flex font-bold text-black">
                            <span style={{ width: '44%' }} className="break-words pr-1">{item.name || item.menuItem?.name}</span>
                            <span style={{ width: '14%' }} className="text-center">{item.quantity}</span>
                            <span style={{ width: '20%' }} className="text-right">{currency}{item.price?.toFixed(2)}</span>
                            <span style={{ width: '22%' }} className="text-right">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.specialInstructions && (
                            <p className="font-bold text-black ml-2 text-[7pt]">— {item.specialInstructions}</p>
                        )}
                        {item.modifiers?.map((mod, mi) => (
                            <p key={mi} className="font-bold text-black ml-2 text-[7pt]">+ {mod.name}{mod.price > 0 ? ' (' + currency + mod.price.toFixed(2) + ')' : ''}</p>
                        ))}
                    </div>
                ))}
            </div>

            {/* ─── TOTALS ─── */}
            <div className="border-t-2 border-black pt-2 mb-3">
                <div className={`space-y-0.5 ${isPrint ? 'text-[8pt]' : 'text-xs'}`}>
                    <div className="flex justify-between font-bold text-black">
                        <span>Sub Total</span>
                        <span>{currency}{(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                        <div className="flex justify-between font-bold text-black">
                            <span>Discount</span>
                            <span>-{currency}{(order.discountAmount || 0).toFixed(2)}</span>
                        </div>
                    )}
                    {settings.showServiceCharge && order.serviceChargeAmount > 0 && (
                        <div className="flex justify-between font-bold text-black">
                            <span>Service Charge</span>
                            <span>{currency}{(order.serviceChargeAmount || 0).toFixed(2)}</span>
                        </div>
                    )}
                    {(() => {
                        if (settings.showGstBreakdown && order.gstBreakdown) {
                            return (
                                <>
                                    {order.gstBreakdown.cgst > 0 && (
                                        <div className="flex justify-between font-bold text-black">
                                            <span>CGST @ {((order.gstBreakdown.cgst / (order.subtotal || 1)) * 100).toFixed(1)}%</span>
                                            <span>{currency}{order.gstBreakdown.cgst.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {order.gstBreakdown.sgst > 0 && (
                                        <div className="flex justify-between font-bold text-black">
                                            <span>SGST @ {((order.gstBreakdown.sgst / (order.subtotal || 1)) * 100).toFixed(1)}%</span>
                                            <span>{currency}{order.gstBreakdown.sgst.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {order.gstBreakdown.igst > 0 && (
                                        <div className="flex justify-between font-bold text-black">
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
                                <div className="flex justify-between font-bold text-black">
                                    <span>GST @ {taxRate}%</span>
                                    <span>{currency}{(order.tax || 0).toFixed(2)}</span>
                                </div>
                            );
                        }
                        return null;
                    })()}
                    {(() => {
                        const rawTotal = (order.subtotal || 0) - (order.discountAmount || 0) + (order.tax || 0) + (order.serviceChargeAmount || 0) + (order.tipAmount || 0);
                        const roundOff = (order.total || 0) - rawTotal;
                        if (Math.abs(roundOff) > 0.01) {
                            return (
                                <div className="flex justify-between font-bold text-black">
                                    <span>Round Off</span>
                                    <span>{currency}{roundOff.toFixed(2)}</span>
                                </div>
                            );
                        }
                        return null;
                    })()}
                    <div className="border-t-2 border-black pt-1 mt-1">
                        <div className={`flex justify-between ${isPrint ? 'text-[14pt]' : 'text-base'} font-black text-black`}>
                            <span>GRAND TOTAL</span>
                            <span>{currency}{(order.total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── AMOUNT IN WORDS ─── */}
            {settings.showAmountInWords && order.total > 0 && (
                <div className={`border-t border-dotted border-black pt-1 mb-2 ${isPrint ? 'text-[8pt]' : 'text-xs'} font-bold text-black`}>
                    <span className="font-bold">Amount in Words: </span>
                    {numberToWords(order.total)} ONLY
                </div>
            )}

            {/* ─── PAYMENT ─── */}
            <div className="border-t border-dotted border-black pt-1 mb-2 flex justify-between font-bold text-[8pt]">
                <span className="text-black">{order.paymentMethod || '-'}</span>
                <span className={order.paymentStatus === 'PAID' ? 'text-green-700 font-bold' : 'font-bold text-black'}>
                    {order.paymentStatus === 'PAID' ? '\u2713 PAID' : order.paymentStatus || 'PENDING'}
                </span>
            </div>

            {/* ─── QR ─── */}
            {settings.showQRCode && settings.qrUrl && (
                <div className="text-center mb-2">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(settings.qrUrl)}&ecc=H&margin=4`}
                        alt="QR"
                        style={{ width: '30mm', height: '30mm', display: 'inline-block' }}
                    />
                </div>
            )}

            {/* ─── FOOTER ─── */}
            {settings.showFooter && (
                <div className={`text-center border-t border-black pt-2 ${isPrint ? 'text-[7.5pt]' : 'text-xs'} font-bold text-black`}>
                    <p className="font-bold text-black">{settings.thankYouMessage || 'Thank You For Visiting'}</p>
                    <p className="font-bold text-black">{settings.visitAgainMessage || 'Please Visit Again'}</p>
                    {settings.customerCareNumber && <p className="font-bold text-black">{settings.customerCareNumber}</p>}
                    {settings.footerEmail && <p className="font-bold text-black">{settings.footerEmail}</p>}
                    {settings.customFooterNote && <p className="mt-1 font-bold text-black">{settings.customFooterNote}</p>}
                    {settings.showPoweredBy && <p className="mt-1 font-bold text-black">Ritam Bharat POS</p>}
                </div>
            )}
        </div>
    );
};

export default PremiumRestaurant;
