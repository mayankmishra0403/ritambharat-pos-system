import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus } from 'lucide-react';
import TableGrid from '../../components/waiter/TableGrid';
import WaiterMenuBrowser from '../../components/waiter/WaiterMenuBrowser';
import WaiterCart from '../../components/waiter/WaiterCart';

const OrderCreate = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { restaurantId } = useOutletContext();

    const [step, setStep] = useState('table');
    const [selectedTable, setSelectedTable] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const restaurant = user?.restaurant;

    const { data: tables = [] } = useQuery({
        queryKey: ['waiter-tables', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/waiter/tables?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    const { data: menuItems = [] } = useQuery({
        queryKey: ['waiter-menu', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/menu/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    const categories = [...new Set(menuItems.map(item => item.category))];

    const placeOrderMutation = useMutation({
        mutationFn: async (orderData) => {
            const res = await api.post('/waiter/order', orderData);
            return res.data.data;
        },
        onSuccess: (data) => {
            toast.success(`Order #${data.orderNumber} placed!`);
            queryClient.invalidateQueries({ queryKey: ['waiter-orders'] });
            queryClient.invalidateQueries({ queryKey: ['waiter-tables'] });
            navigate(`/waiter-app/order/${data._id}`);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to place order');
        }
    });

    const handleAddItem = (item) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.menuItem === item._id);
            if (existing) {
                return prev.map(i =>
                    i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { menuItem: item._id, name: item.name, quantity: 1 }];
        });
    };

    const handleUpdateQuantity = (menuItemId, delta) => {
        setCartItems(prev =>
            prev.map(i =>
                i.menuItem === menuItemId
                    ? { ...i, quantity: Math.max(1, i.quantity + delta) }
                    : i
            ).filter(i => i.quantity > 0)
        );
    };

    const handleRemoveItem = (menuItemId) => {
        setCartItems(prev => prev.filter(i => i.menuItem !== menuItemId));
    };

    const handlePlaceOrder = () => {
        if (cartItems.length === 0) {
            toast.error('Add at least one item');
            return;
        }

        placeOrderMutation.mutate({
            restaurant: restaurantId,
            table: selectedTable?._id,
            items: cartItems,
            customerName: customerName || undefined,
            customerPhone: customerPhone || undefined,
            orderSource: 'MANUAL'
        });
    };

    return (
        <div className="space-y-4">
            <button
                onClick={() => step === 'table' ? navigate('/waiter-app') : setStep('table')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} />
                {step === 'table' ? 'Back to Dashboard' : 'Change Table'}
            </button>

            <div className="flex items-center gap-2 mb-2">
                {['table', 'items', 'review'].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            step === s ? 'bg-primary text-primary-foreground' :
                            ['table', 'items', 'review'].indexOf(step) > i ? 'bg-green-500/20 text-green-500' :
                            'bg-muted text-muted-foreground'
                        }`}>
                            {['table', 'items', 'review'].indexOf(step) > i ? '✓' : i + 1}
                        </div>
                        {i < 2 && <div className="w-6 h-px bg-muted" />}
                    </div>
                ))}
            </div>

            {step === 'table' && (
                <div>
                    <h2 className="text-lg font-bold text-foreground mb-3">Select Table</h2>
                    <TableGrid
                        tables={tables}
                        onSelectTable={(table) => {
                            setSelectedTable(table);
                            setStep('items');
                        }}
                        selectedTableId={selectedTable?._id}
                    />
                    {tables.length > 0 && (
                        <button
                            onClick={() => {
                                setSelectedTable(null);
                                setStep('items');
                            }}
                            className="w-full mt-3 py-3 bg-muted text-muted-foreground font-bold text-sm rounded-xl hover:bg-muted/80 transition-colors"
                        >
                            <Plus size={16} className="inline mr-1" />
                            Takeaway (no table)
                        </button>
                    )}
                </div>
            )}

            {step === 'items' && (
                <div className="flex flex-col gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
                    <div className="flex-1 min-h-0">
                        <WaiterMenuBrowser
                            menuItems={menuItems}
                            categories={categories}
                            onAddItem={handleAddItem}
                            selectedItems={cartItems}
                        />
                    </div>

                    <div className="flex-shrink-0">
                        <input
                            type="text"
                            placeholder="Customer name (optional)"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <input
                            type="tel"
                            placeholder="Customer phone (optional)"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />

                        <div className="bg-card border border-border rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm text-foreground">Cart ({cartItems.length})</span>
                                {cartItems.length > 0 && (
                                    <button
                                        onClick={() => setStep('review')}
                                        className="text-xs font-bold text-primary"
                                    >
                                        View Details
                                    </button>
                                )}
                            </div>
                            {cartItems.length > 0 ? (
                                <div className="space-y-1">
                                    {cartItems.slice(0, 3).map(item => {
                                        const details = menuItems.find(m => m._id === item.menuItem);
                                        return (
                                            <div key={item.menuItem} className="flex justify-between text-xs text-muted-foreground">
                                                <span>{details?.name} x{item.quantity}</span>
                                                <span>₹{((details?.price || 0) * item.quantity).toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                    {cartItems.length > 3 && (
                                        <p className="text-xs text-muted-foreground">+{cartItems.length - 3} more items</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">No items added yet</p>
                            )}
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={cartItems.length === 0 || placeOrderMutation.isPending}
                            className="w-full mt-3 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {placeOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            )}

            {step === 'review' && (
                <div>
                    <div className="bg-card border border-border rounded-xl p-4 mb-4">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Order Details</p>
                        <p className="font-bold text-foreground">
                            {selectedTable ? `Table ${selectedTable.name}` : 'Takeaway'}
                        </p>
                        {customerName && <p className="text-sm text-muted-foreground">{customerName}</p>}
                        {customerPhone && <p className="text-sm text-muted-foreground">{customerPhone}</p>}
                    </div>

                    <WaiterCart
                        items={cartItems}
                        menuItems={menuItems}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                        onPlaceOrder={handlePlaceOrder}
                        loading={placeOrderMutation.isPending}
                        restaurant={typeof restaurant === 'object' ? restaurant : null}
                    />
                </div>
            )}
        </div>
    );
};

export default OrderCreate;
