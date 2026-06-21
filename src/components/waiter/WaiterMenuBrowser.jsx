import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const WaiterMenuBrowser = ({ menuItems, categories, onAddItem, selectedItems }) => {
    const [activeCategory, setActiveCategory] = useState(categories[0] || '');
    const [search, setSearch] = useState('');

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = !activeCategory || item.category === activeCategory;
        const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getItemQuantity = (itemId) => {
        return selectedItems?.find(i => i.menuItem === itemId)?.quantity || 0;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search menu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`
                            whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all
                            ${activeCategory === cat
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {filteredItems.map(item => {
                    const qty = getItemQuantity(item._id);

                    return (
                        <motion.div
                            key={item._id}
                            layout
                            className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                        >
                            {item.image && (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                            </div>
                            <button
                                onClick={() => onAddItem(item)}
                                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex-shrink-0 relative"
                            >
                                <Plus size={18} />
                                {qty > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                        {qty}
                                    </span>
                                )}
                            </button>
                        </motion.div>
                    );
                })}
                {filteredItems.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">No items found</p>
                )}
            </div>
        </div>
    );
};

export default WaiterMenuBrowser;
