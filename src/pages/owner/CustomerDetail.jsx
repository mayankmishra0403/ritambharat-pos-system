import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, ShoppingBag, ChefHat, CheckCheck, Gift } from 'lucide-react';
import CustomerProfile from '../../components/crm/CustomerProfile';

const STATUS_ICONS = {
    PENDING: Clock, ACCEPTED: ChefHat, PREPARING: ChefHat,
    READY: CheckCheck, SERVED: CheckCheck, CANCELLED: Clock
};
const STATUS_COLORS = {
    PENDING: 'text-yellow-500', ACCEPTED: 'text-blue-500', PREPARING: 'text-orange-500',
    READY: 'text-green-500', SERVED: 'text-green-500', CANCELLED: 'text-red-500'
};

const CustomerDetail = ({ customer: initialCustomer, restaurantId, onBack }) => {
    const queryClient = useQueryClient();
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        name: initialCustomer?.name || '',
        email: initialCustomer?.email || '',
        birthday: initialCustomer?.birthday ? initialCustomer.birthday.split('T')[0] : '',
        notes: initialCustomer?.notes || '',
        tags: initialCustomer?.tags?.join(', ') || ''
    });

    const { data: customerData } = useQuery({
        queryKey: ['customer-detail', initialCustomer?._id, restaurantId],
        queryFn: async () => {
            const res = await api.get(`/customers/${initialCustomer._id}?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId && !!initialCustomer?._id
    });

    const customer = customerData?.customer || initialCustomer;
    const orders = customerData?.orders || [];

    const updateMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.patch(`/customers/${customer._id}`, data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-detail', customer._id, restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['customers', restaurantId] });
            setShowEdit(false);
            toast.success('Customer updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
    });

    const handleSave = () => {
        updateMutation.mutate({
            name: editForm.name,
            email: editForm.email,
            birthday: editForm.birthday || null,
            notes: editForm.notes,
            tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        });
    };

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Customers
            </button>

            <CustomerProfile customer={customer} onEdit={() => {
                setEditForm({
                    name: customer.name || '',
                    email: customer.email || '',
                    birthday: customer.birthday ? customer.birthday.split('T')[0] : '',
                    notes: customer.notes || '',
                    tags: customer.tags?.join(', ') || ''
                });
                setShowEdit(true);
            }} />

            {showEdit && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-foreground mb-4">Edit Customer</h3>
                        <div className="space-y-3">
                            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            <div>
                                <label className="text-xs font-bold text-muted-foreground mb-1 block">Birthday</label>
                                <input type="date" value={editForm.birthday} onChange={e => setEditForm(f => ({ ...f, birthday: e.target.value }))} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={3} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                            <input value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma separated)" className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 bg-muted text-muted-foreground font-bold rounded-xl text-sm">Cancel</button>
                            <button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm disabled:opacity-50">{updateMutation.isPending ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mt-6 mb-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <ShoppingBag size={16} />
                    Order History ({orders.length})
                </h3>
                {customer.loyaltyPoints > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                        <Gift size={12} />
                        {customer.loyaltyPoints} pts
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {orders.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">No orders found</div>
                )}
                {orders.map(order => {
                    const Icon = STATUS_ICONS[order.status] || Clock;
                    const color = STATUS_COLORS[order.status] || 'text-muted-foreground';
                    return (
                        <div key={order._id} className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">#{order.orderNumber}</span>
                                    <span className={`flex items-center gap-1 text-[10px] font-bold ${color}`}>
                                        <Icon size={10} />
                                        {order.status}
                                    </span>
                                    {order.table?.name && (
                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                            {order.table.name}
                                        </span>
                                    )}
                                </div>
                                <span className="font-mono font-bold text-primary text-sm">₹{order.total?.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {order.items?.slice(0, 3).map((item, idx) => (
                                    <span key={idx} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                                        {item.quantity}x {item.name}
                                    </span>
                                ))}
                                {order.items?.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground">+{order.items.length - 3} more</span>
                                )}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-2">
                                {new Date(order.createdAt).toLocaleString()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomerDetail;
