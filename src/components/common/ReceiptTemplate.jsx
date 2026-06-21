import { forwardRef } from 'react';

const ReceiptTemplate = forwardRef(({ order }, ref) => {
    if (!order) return null;

    return (
        <div
            ref={ref}
            id="thermal-receipt"
            className="hidden print:block bg-white text-black p-8 font-mono text-sm max-w-[400px] mx-auto border border-black/10 shadow-sm"
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0; padding: 0px; background: white !important; }
                    .no-print { display: none !important; }
                    #thermal-receipt { 
                        display: block !important; 
                        width: 100% !important; 
                        max-width: 320px !important;
                        margin: 0 auto !important;
                        padding: 15px !important;
                        color: black !important;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
            `}} />


            <div className="text-center mb-6">
                <h2 className="text-xl font-black uppercase mb-1 tracking-tighter">{order.restaurant?.name || 'Restaurant Name'}</h2>
                {order.restaurant?.address && (
                    <p className="text-[10px] uppercase leading-tight mb-2 px-4">
                        {typeof order.restaurant.address === 'string'
                            ? order.restaurant.address
                            : `${order.restaurant.address.street || ''}, ${order.restaurant.address.city || ''}, ${order.restaurant.address.zipCode || ''}`.trim()
                        }
                    </p>
                )}
                <div className="text-[10px] space-x-2">
                    {order.restaurant?.phone && <span>TEL: {order.restaurant.phone}</span>}
                </div>

                <div className="border-t-2 border-black my-4" />
                <p className="font-black text-lg">OFFICIAL INVOICE</p>
                <div className="flex justify-between text-[11px] mt-2 px-1">
                    <span>DATE: {new Date(order.createdAt).toLocaleDateString()}</span>
                    <span>TIME: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[11px] font-bold mt-1">INVOICE NO: {order.orderNumber?.split('-')[2] || order._id?.slice(-6).toUpperCase()}</p>
            </div>


            <div className="border-b-2 border-black mb-6" />

            <div className="flex justify-between mb-4 font-black text-xs">
                <span>TABLE: {order.table?.name || 'TAKEOUT'}</span>
                <span>{order.orderSource || 'WEB'}</span>
            </div>

            <div className="space-y-2 mb-6">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                        <div className="flex-1 pr-4">
                            <div className="flex gap-2">
                                <span className="font-bold">{item.quantity}</span>
                                <span className="uppercase">{item.name}</span>
                            </div>
                        </div>
                        <span className="font-bold">{((item.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="border-t-2 border-black pt-4 space-y-1 text-right mb-4">
                <div className="flex justify-between text-[12px]">
                    <span className="uppercase font-bold">Subtotal</span>
                    <span>{((order.total || 0) / 1.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                    <span className="uppercase font-bold">VAT (10%)</span>
                    <span>{((order.total || 0) - ((order.total || 0) / 1.1)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-black border-t-2 border-black pt-2 mt-4">
                    <span className="uppercase">Grand Total</span>
                    <span>{(order.total || 0).toFixed(2)}</span>
                </div>
            </div>

            <div className="text-center mt-8 space-y-2 pb-4">
                <div className="border-t border-black/20 pt-4" />
                <p className="text-[10px] uppercase font-black tracking-[0.3em]">Thank You</p>
                <p className="text-[9px] uppercase tracking-widest opacity-60">Please visit again</p>

                <div className="pt-4 flex flex-col items-center gap-1">
                    <div className="w-16 h-16 border border-black p-1 flex items-center justify-center text-[8px] font-bold">
                        QR CODE
                    </div>
                    <span className="text-[8px] opacity-40 uppercase">Scan to provide feedback</span>
                </div>
                <p className="text-[8px] mt-4 opacity-30 uppercase font-bold tracking-widest">Powered by Ritam Bharat POS</p>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
