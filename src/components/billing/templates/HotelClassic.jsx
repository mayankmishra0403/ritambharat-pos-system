import numberToWords from '../../../utils/numberToWords';

const HotelClassic = ({ order, restaurant, settings, type = 'display' }) => {
    const currency = restaurant.currency || '\u20B9';
    const isPrint = type === 'print';
    const isPaid = order.paymentStatus === 'PAID';
    const total = order.total || 0;

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const formatTime = (d) =>
        new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const taxRate = order.subtotal > 0 ? ((order.tax / order.subtotal) * 100).toFixed(1) : '0.0';
    const invoiceNum = order.orderNumber || order._id?.slice(-6).toUpperCase() || '';

    const roundOff = (() => {
        const raw = (order.subtotal || 0) - (order.discountAmount || 0) + (order.tax || 0) + (order.serviceChargeAmount || 0) + (order.tipAmount || 0);
        return total - raw;
    })();

    return (
        <div className={`bg-white text-black ${isPrint ? 'max-w-[72mm] mx-auto font-mono leading-tight' : 'p-5 font-mono text-xs leading-snug'}`}>
            {/* ═══════════ HEADER ═══════════ */}
            <div className="text-center pb-3">
                {settings.showLogo && restaurant.logo && (
                    <img src={restaurant.logo} alt="" className="h-8 mx-auto mb-1 object-contain" />
                )}
                <h1 className={`${isPrint ? 'text-[18pt]' : 'text-xl'} font-black tracking-wider text-black`}>
                    {restaurant.name}
                </h1>
                {restaurant.tagline && (
                    <p className={`${isPrint ? 'text-[8pt]' : 'text-xs'} font-bold text-black mt-0.5`}>{restaurant.tagline}</p>
                )}
                <p className={`${isPrint ? 'text-[7.5pt]' : 'text-xs'} font-bold text-black mt-1`}>
                    {[restaurant.address?.street, restaurant.address?.city, restaurant.address?.state, restaurant.address?.zipCode].filter(Boolean).join(', ')}
                </p>
                {restaurant.contact?.phone && <p className={`${isPrint ? 'text-[7.5pt]' : 'text-xs'} font-bold text-black`}>{restaurant.contact.phone}</p>}
                {restaurant.alternatePhone && <p className={`${isPrint ? 'text-[7.5pt]' : 'text-xs'} font-bold text-black`}>{restaurant.alternatePhone}</p>}
                {settings.showGstin && restaurant.gstin && <p className={`${isPrint ? 'text-[8pt]' : 'text-xs'} font-bold mt-0.5 text-black`}>GSTIN: {restaurant.gstin}</p>}
            </div>

            {/* ═══════════ DOUBLE LINE + TAX INVOICE ═══════════ */}
            <div className="border-t-2 border-black mb-0.5"></div>
            <div className="border-t-2 border-black mb-1"></div>
            <h2 className={`${isPrint ? 'text-[12pt]' : 'text-base'} font-bold text-center tracking-widest text-black pb-1`}>
                {settings.invoiceTitle || 'TAX INVOICE'}
            </h2>
            <div className="border-t border-black mb-1"></div>

            {/* ═══════════ ORDER INFO ═══════════ */}
            <div className={`${isPrint ? 'text-[8pt]' : 'text-xs'} mb-1`}>
                <div className="flex justify-between">
                    <span className="font-bold text-black">Invoice No</span>
                    <span className={`${isPrint ? 'text-[10pt]' : 'text-sm'} font-bold text-black`}>{invoiceNum}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold text-black">Date</span>
                    <span className="font-bold text-black">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold text-black">Time</span>
                    <span className="font-bold text-black">{formatTime(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold text-black">Type</span>
                    <span className="font-bold text-black">{order.orderType || 'DINE IN'}</span>
                </div>
                {order.table?.name && (
                    <div className="flex justify-between">
                        <span className="font-bold text-black">Table</span>
                        <span className="font-bold text-black">{order.table.name}</span>
                    </div>
                )}
                {settings.showPax && order.pax && (
                    <div className="flex justify-between">
                        <span className="font-bold text-black">PAX</span>
                        <span className="font-bold text-black">{order.pax}</span>
                    </div>
                )}
                {settings.showWaiterName && order.waiterName && (
                    <div><span className="font-bold text-black">Waiter: </span><span className="font-bold text-black">{order.waiterName}</span></div>
                )}
                {settings.showCashierName && order.cashierName && (
                    <div><span className="font-bold text-black">Cashier: </span><span className="font-bold text-black">{order.cashierName}</span></div>
                )}
                {settings.showCustomerDetails && order.customerName && (
                    <div><span className="font-bold text-black">Customer: </span><span className="font-bold text-black">{order.customerName}{order.customerPhone ? ` (${order.customerPhone})` : ''}</span></div>
                )}
            </div>
            <div className="border-t border-dashed border-black mb-1"></div>

            {/* ═══════════ ITEMS TABLE ═══════════ */}
            <div className="mb-1">
                <div className="border-t-2 border-black"></div>
                <div className={`flex font-bold py-0.5 ${isPrint ? 'text-[8.5pt]' : 'text-xs'} text-black`}>
                    <span style={{ width: '44%' }}>Item</span>
                    <span style={{ width: '14%' }} className="text-center">Qty</span>
                    <span style={{ width: '20%' }} className="text-right">Rate</span>
                    <span style={{ width: '22%' }} className="text-right">Amt</span>
                </div>
                <div className="border-t border-black"></div>
                {(order.items || []).map((item, idx) => (
                    <div key={idx} className={`border-b border-dashed border-black py-0.5 ${isPrint ? 'text-[8.5pt]' : 'text-xs'}`}>
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
                            <p key={mi} className="font-bold text-black ml-2 text-[7pt]">+ {mod.name}{mod.price > 0 ? ` (${currency}${mod.price.toFixed(2)})` : ''}</p>
                        ))}
                    </div>
                ))}
            </div>
            <div className="border-t border-black mb-1"></div>

            {/* ═══════════ TOTALS ═══════════ */}
            <div className={`${isPrint ? 'text-[8.5pt]' : 'text-xs'} space-y-0.5 mb-1`}>
                <div className="flex justify-between font-bold text-black">
                    <span>Sub Total</span>
                    <span>{currency}{(order.subtotal || 0).toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                    <div className="flex justify-between font-bold text-black">
                        <span>Discount</span>
                        <span>-{currency}{order.discountAmount.toFixed(2)}</span>
                    </div>
                )}
                {settings.showServiceCharge && order.serviceChargeAmount > 0 && (
                    <div className="flex justify-between font-bold text-black">
                        <span>Service Charge</span>
                        <span>{currency}{order.serviceChargeAmount.toFixed(2)}</span>
                    </div>
                )}
                {settings.showGstBreakdown && order.gstBreakdown ? (
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
                ) : (order.tax || 0) > 0 && (
                    <div className="flex justify-between font-bold text-black">
                        <span>GST @ {taxRate}%</span>
                        <span>{currency}{(order.tax || 0).toFixed(2)}</span>
                    </div>
                )}
                {order.tipAmount > 0 && (
                    <div className="flex justify-between font-bold text-black">
                        <span>Tip</span>
                        <span>{currency}{order.tipAmount.toFixed(2)}</span>
                    </div>
                )}
                {Math.abs(roundOff) > 0.01 && (
                    <div className="flex justify-between font-bold text-black">
                        <span>Round Off</span>
                        <span>{currency}{roundOff.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* ═══════════ GRAND TOTAL ═══════════ */}
            <div className="border-t-[3px] border-black mt-1 mb-1"></div>
            <div className={`text-center py-1 ${isPrint ? '' : ''}`}>
                <div className={`${isPrint ? 'text-[12pt]' : 'text-lg'} font-bold tracking-wider text-black`}>GRAND TOTAL</div>
                <div className={`${isPrint ? 'text-[16pt]' : 'text-2xl'} font-black mt-0.5 text-black`}>{currency}{total.toFixed(2)}</div>
            </div>
            <div className="border-t-[3px] border-black mt-1 mb-1"></div>

            {/* ═══════════ AMOUNT IN WORDS ═══════════ */}
            {settings.showAmountInWords && total > 0 && (
                <div className={`border-t border-dashed border-black pt-1 mb-1 ${isPrint ? 'text-[8pt]' : 'text-xs'} font-bold text-black`}>
                    <span className="font-bold">Amount in Words: </span>
                    {numberToWords(total)} ONLY
                </div>
            )}

            {/* ═══════════ PAYMENT ═══════════ */}
            <div className="border-t border-black border-b border-black py-1 mb-1">
                <div className="flex justify-between items-center">
                    <span className={`${isPrint ? 'text-[8.5pt]' : 'text-xs'} font-bold text-black`}>{order.paymentMethod || '-'}</span>
                    {isPaid ? (
                        <span className={`${isPrint ? 'text-[9pt]' : 'text-sm'} font-bold text-green-800 bg-green-100 px-1 py-0.5 border border-green-700`}>
                            {'\u2713'} PAID
                        </span>
                    ) : (
                        <span className={`${isPrint ? 'text-[8.5pt]' : 'text-xs'} font-bold text-black`}>{order.paymentStatus || 'PENDING'}</span>
                    )}
                </div>
            </div>

            {/* ═══════════ QR CODE ═══════════ */}
            {settings.showQRCode && settings.qrUrl && (
                <div className="text-center my-1">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(settings.qrUrl)}&ecc=H&margin=4`}
                        alt="QR"
                        style={{ width: '30mm', height: '30mm', display: 'inline-block' }}
                    />
                </div>
            )}

            {/* ═══════════ FOOTER ═══════════ */}
            {settings.showFooter && (
                <div className={`text-center pt-2 ${isPrint ? 'text-[7.5pt]' : 'text-xs'} font-bold text-black`}>
                    <div className="border-t-2 border-black mb-1"></div>
                    <p className="font-bold text-black">{settings.thankYouMessage || 'Thank You For Visiting'}</p>
                    <p className="font-bold text-black">{settings.visitAgainMessage || 'Please Visit Again'}</p>
                    {settings.customerCareNumber && <p className="font-bold text-black">{settings.customerCareNumber}</p>}
                    {settings.footerEmail && <p className="font-bold text-black">{settings.footerEmail}</p>}
                    {settings.footerWebsite && <p className="font-bold text-black">{settings.footerWebsite}</p>}
                    {settings.customFooterNote && <p className="font-bold text-black mt-1">{settings.customFooterNote}</p>}
                    {settings.showPoweredBy && (
                        <p className="mt-1 font-bold text-black">Ritam Bharat POS</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default HotelClassic;
