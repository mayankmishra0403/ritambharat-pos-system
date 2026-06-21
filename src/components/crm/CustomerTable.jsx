import { useState } from 'react';
import { Search, ChevronDown, Phone, DollarSign, ShoppingBag, Calendar } from 'lucide-react';

const CustomerTable = ({ customers, onSelect, loading }) => {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('lastVisit');
    const [sortDir, setSortDir] = useState('desc');

    const filtered = (customers || []).filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (c.name?.toLowerCase().includes(q) || c.phone?.includes(q));
    });

    const sorted = [...filtered].sort((a, b) => {
        let valA, valB;
        switch (sortBy) {
            case 'name': valA = a.name || ''; valB = b.name || ''; break;
            case 'totalSpent': valA = a.totalSpent || 0; valB = b.totalSpent || 0; break;
            case 'orderCount': valA = a.orderCount || 0; valB = b.orderCount || 0; break;
            default: valA = new Date(a.lastVisit || 0).getTime(); valB = new Date(b.lastVisit || 0).getTime();
        }
        if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('desc');
        }
    };

    const SortHeader = ({ field, children }) => (
        <button onClick={() => toggleSort(field)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            {children}
            {sortBy === field && <ChevronDown size={10} className={`transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />}
        </button>
    );

    return (
        <div>
            <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-5 gap-4 p-3 border-b border-border bg-muted/30">
                    <SortHeader field="name">Customer</SortHeader>
                    <SortHeader field="orderCount"><ShoppingBag size={12} /> Orders</SortHeader>
                    <SortHeader field="totalSpent"><DollarSign size={12} /> Spent</SortHeader>
                    <SortHeader field="lastVisit"><Calendar size={12} /> Last Visit</SortHeader>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone</span>
                </div>

                {loading && (
                    <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
                )}

                {!loading && sorted.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">No customers found</div>
                )}

                {sorted.map((customer, idx) => (
                    <button
                        key={`${customer.phone}-${customer.name}-${idx}`}
                        onClick={() => onSelect(customer)}
                        className="w-full grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">{customer.name?.charAt(0) || '?'}</span>
                            </div>
                            <span className="font-bold text-sm text-foreground truncate">{customer.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 md:justify-center">
                            <ShoppingBag size={12} className="text-muted-foreground md:hidden" />
                            <span className="text-sm font-mono text-muted-foreground">{customer.orderCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 md:justify-center">
                            <DollarSign size={12} className="text-primary md:hidden" />
                            <span className="text-sm font-mono font-bold text-primary">₹{(customer.totalSpent || 0).toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground md:text-center">
                            {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : '-'}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone size={12} className="md:hidden" />
                            {customer.phone || '-'}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CustomerTable;
