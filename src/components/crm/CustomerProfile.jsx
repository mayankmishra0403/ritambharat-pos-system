import { Phone, Mail, Calendar, DollarSign, ShoppingBag, TrendingUp, Gift, Edit3 } from 'lucide-react';

const CustomerProfile = ({ customer, onEdit }) => {
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
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-black text-primary">
                                {customer.name?.charAt(0) || '?'}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-foreground">{customer.name || 'Unknown'}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.class}`}>
                                    {tier.label}
                                </span>
                            </div>
                            {customer.phone && (
                                <span className="text-sm text-muted-foreground">{customer.phone}</span>
                            )}
                        </div>
                    </div>
                </div>
                {onEdit && (
                    <button onClick={onEdit} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <Edit3 size={14} className="text-muted-foreground" />
                    </button>
                )}
            </div>

            {customer.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Mail size={14} />
                    {customer.email}
                </div>
            )}

            {customer.tags && customer.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {customer.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <ShoppingBag size={12} />
                        Orders
                    </div>
                    <span className="text-lg font-bold text-foreground">{customer.totalVisits || customer.orderCount || 0}</span>
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
                        <Gift size={12} />
                        Loyalty Points
                    </div>
                    <span className="text-lg font-bold text-foreground">{customer.loyaltyPoints || 0}</span>
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
                {customer.birthday && (
                    <div className="p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <Calendar size={12} />
                            Birthday
                        </div>
                        <span className="text-sm font-bold text-foreground">
                            {new Date(customer.birthday).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                )}
                {customer.firstVisit && (
                    <div className="p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <Calendar size={12} />
                            First Visit
                        </div>
                        <span className="text-sm font-bold text-foreground">
                            {new Date(customer.firstVisit).toLocaleDateString()}
                        </span>
                    </div>
                )}
            </div>

            {customer.notes && (
                <div className="mt-3 p-3 bg-muted/20 rounded-xl">
                    <p className="text-xs font-bold text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground">{customer.notes}</p>
                </div>
            )}
        </div>
    );
};

export default CustomerProfile;
