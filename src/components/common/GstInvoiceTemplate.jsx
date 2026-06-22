const GstInvoiceTemplate = ({ invoice, restaurant }) => {
    if (!invoice) return null;

    return (
        <div className="bg-white text-black p-6 max-w-[300px] mx-auto font-mono text-[10px] leading-tight print:max-w-full">
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
                <h1 className="text-sm font-bold uppercase">{restaurant?.name || 'Restaurant'}</h1>
                <p className="text-[9px]">{restaurant?.address?.street}, {restaurant?.address?.city}</p>
                {restaurant?.contact?.phone && <p className="text-[9px]">Phone: {restaurant.contact.phone}</p>}
                <p className="text-[9px]">GSTIN: {restaurant?.gstin || '-'}</p>
                <h2 className="text-xs font-bold mt-2 uppercase tracking-wider">Tax Invoice</h2>
            </div>

            {/* Info */}
            <div className="flex justify-between mb-3 text-[9px]">
                <div>
                    <p>Invoice: <span className="font-bold">{invoice.invoiceNo}</span></p>
                    <p>Date: {new Date(invoice.generatedAt || invoice.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                    <p>Order: #{invoice.order?.orderNumber || '-'}</p>
                    {invoice.order?.table?.name && <p>Table: {invoice.order.table.name}</p>}
                </div>
            </div>

            {invoice.customerName && (
                <p className="text-[9px] mb-2">Customer: {invoice.customerName} {invoice.customerPhone ? `(${invoice.customerPhone})` : ''}</p>
            )}

            {/* Items Table */}
            <table className="w-full border-collapse mb-3 text-[9px]">
                <thead>
                    <tr className="border-b border-gray-400">
                        <th className="text-left pb-1 font-bold">#</th>
                        <th className="text-left pb-1 font-bold">Item</th>
                        <th className="text-center pb-1 font-bold">HSN</th>
                        <th className="text-center pb-1 font-bold">Qty</th>
                        <th className="text-right pb-1 font-bold">Rate</th>
                        <th className="text-right pb-1 font-bold">Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items?.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-300">
                            <td className="py-1">{idx + 1}</td>
                            <td className="py-1">{item.name}</td>
                            <td className="py-1 text-center">{item.hsnCode || '-'}</td>
                            <td className="py-1 text-center">{item.quantity}</td>
                            <td className="py-1 text-right">{item.price?.toFixed(2)}</td>
                            <td className="py-1 text-right">{item.total?.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="space-y-0.5 text-[9px] border-t border-gray-400 pt-2">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold">₹{invoice.subTotal?.toFixed(2)}</span>
                </div>
                {invoice.cgstAmount > 0 && (
                    <div className="flex justify-between">
                        <span>CGST</span>
                        <span>₹{invoice.cgstAmount?.toFixed(2)}</span>
                    </div>
                )}
                {invoice.sgstAmount > 0 && (
                    <div className="flex justify-between">
                        <span>SGST</span>
                        <span>₹{invoice.sgstAmount?.toFixed(2)}</span>
                    </div>
                )}
                {invoice.igstAmount > 0 && (
                    <div className="flex justify-between">
                        <span>IGST</span>
                        <span>₹{invoice.igstAmount?.toFixed(2)}</span>
                    </div>
                )}
                {invoice.taxAmount > 0 && !invoice.cgstAmount && !invoice.sgstAmount && (
                    <div className="flex justify-between">
                        <span>Tax</span>
                        <span>₹{invoice.taxAmount?.toFixed(2)}</span>
                    </div>
                )}
                {invoice.discountAmount > 0 && (
                    <div className="flex justify-between">
                        <span>Discount</span>
                        <span>-₹{invoice.discountAmount?.toFixed(2)}</span>
                    </div>
                )}
                {invoice.serviceChargeAmount > 0 && (
                    <div className="flex justify-between">
                        <span>Service Charge</span>
                        <span>₹{invoice.serviceChargeAmount?.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-xs font-bold border-t border-gray-400 pt-1 mt-1">
                    <span>Total</span>
                    <span>₹{invoice.total?.toFixed(2)}</span>
                </div>
            </div>

            {/* Amount in words */}
            <p className="text-[9px] mt-2 italic">Amount in Words: {invoice.amountInWords}</p>

            {/* Payment info */}
            <div className="border-t border-dashed border-gray-400 mt-3 pt-2 text-center text-[9px]">
                <p>Status: {invoice.paymentStatus}</p>
                <p className="mt-1 text-xs font-bold">Thank You! Visit Again!</p>
            </div>
        </div>
    );
};

export default GstInvoiceTemplate;
