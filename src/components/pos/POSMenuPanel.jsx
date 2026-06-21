import { useState, useMemo } from 'react';
import { Search, Plus, Coffee } from 'lucide-react';

const POSMenuPanel = ({ menuItems, categories, onAddItem }) => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');

    const filteredItems = useMemo(() => {
        let items = menuItems || [];
        if (search) {
            items = items.filter(i =>
                i.name.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (activeCategory !== 'All') {
            items = items.filter(i => i.category === activeCategory);
        }
        return items;
    }, [menuItems, activeCategory, search]);

    return (
        <div className="flex flex-col h-full">
            <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
            </div>

            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 custom-scrollbar">
                <button
                    onClick={() => setActiveCategory('All')}
                    className={`
                        px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0
                        ${activeCategory === 'All'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }
                    `}
                >
                    All
                </button>
                {(categories || []).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`
                            px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0
                            ${activeCategory === cat
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                            }
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
                {filteredItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                        <Coffee size={24} className="opacity-20" />
                        <span className="text-xs font-medium">No items found</span>
                    </div>
                )}
                {filteredItems.map(item => (
                    <button
                        key={item._id}
                        onClick={() => onAddItem(item)}
                        className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all text-left group"
                    >
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-foreground block truncate">{item.name}</span>
                            <span className="text-xs font-bold text-primary">₹{item.price}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={14} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default POSMenuPanel;
