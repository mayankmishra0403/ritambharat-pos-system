import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Calendar, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';

const CustomerProfile = ({ customer }) => {
    const navigate = useNavigate();

    if (!customer) return null;

    const getTierBadge = (spent) => {
        if (spent > 50000) return { label: 'Platinum', class: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
        if (spent > 20000) return { label: 'Gold', class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
        if (spent > 5000) return { label: 'Silver', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
        return { label: 'Bronze', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
    };

    const tier = getTierBadge(customer.totalSpent);

    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-black text-primary">
                                {customer.name?.charAt(0) || '?'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">{customer.name || 'Unknown'}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.class}`}>
                                {tier.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Phone size={14} />
                    {customer.phone}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <ShoppingBag size={12} />
                        Orders
                    </div>
                    <span className="text-lg font-bold text-foreground">{customer.orderCount || 0}</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <DollarSign size={12} />
                        Total Spent
                    </div>
                    <span className="text-lg font-bold text-primary">₹{(customer.totalSpent || 0).toFixed(2)}</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Calendar size={12} />
                        First Visit
                    </div>
                    <span className="text-sm font-bold text-foreground">
                        {customer.firstVisit ? new Date(customer.firstVisit).toLocaleDateString() : '-'}
                    </span>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <TrendingUp size={12} />
                        Last Visit
                    </div>
                    <span className="text-sm font-bold text-foreground">
                        {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : '-'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;
