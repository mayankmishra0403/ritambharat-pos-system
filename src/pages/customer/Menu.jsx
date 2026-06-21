import { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Play, Box, Plus, X, ChevronRight, Star, Info, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import api from '../../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import PromoCarousel from '../../components/customer/PromoCarousel';

const currency = '₹';

const Menu = () => {
    const { restaurant, tableId } = useOutletContext();
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [dietaryFilter, setDietaryFilter] = useState("All");

    const [showFilters, setShowFilters] = useState(false);

    const { cart, cartTotal } = useCart();
    const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const { data: menuItems, isLoading } = useQuery({
        queryKey: ['menu', restaurant._id],
        queryFn: async () => {
            const res = await api.get(`/menu?restaurant=${restaurant._id}`);
            return res.data.data;
        },
        enabled: !!restaurant?._id
    });

    const categories = useMemo(() => {
        if (!menuItems) return ["All"];
        const order = ["All", "Special", "Appetizer", "Main Course", "Dessert", "Beverage", "Salad", "Soup", "Side Dish"];
        const cats = new Set(menuItems.map(item => item.category));
        return order.filter(c => c === "All" || cats.has(c)).concat(
            [...cats].filter(c => !order.includes(c))
        );
    }, [menuItems]);

    const promoItems = useMemo(() => {
        if (!menuItems) return [];
        const specials = menuItems.filter(item => item.category === 'Special');
        if (specials.length >= 5) return specials.slice(0, 5);
        const remaining = menuItems
            .filter(item => item.category !== 'Special')
            .sort((a, b) => b.price - a.price);
        return [...specials, ...remaining].slice(0, 5);
    }, [menuItems]);

    const filteredItems = useMemo(() => {
        if (!menuItems) return [];
        return menuItems.filter(item => {
            const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            let matchesDietary = true;
            if (dietaryFilter === "Veg") matchesDietary = item.isVegetarian;
            if (dietaryFilter === "Spicy") matchesDietary = item.isSpicy;
            if (dietaryFilter === "GlutenFree") matchesDietary = item.isGlutenFree;
            return matchesCategory && matchesSearch && matchesDietary && item.isAvailable;
        });
    }, [menuItems, selectedCategory, searchTerm, dietaryFilter]);

    const groupedItems = useMemo(() => {
        if (selectedCategory !== "All" || searchTerm) return null;
        const groups = {};
        menuItems?.filter(i => i.isAvailable).forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [menuItems, selectedCategory, searchTerm]);

    const MenuSkeleton = () => (
        <div className="animate-pulse space-y-8 px-4 pt-10">
            <div className="h-48 sm:h-64 bg-white/5 rounded-3xl" />
            <div className="space-y-4">
                <div className="h-12 bg-white/5 rounded-xl border border-white/5" />
                <div className="flex gap-2 overflow-hidden">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-24 bg-white/5 rounded-xl flex-shrink-0" />
                    ))}
                </div>
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5 flex gap-4 p-4">
                        <div className="w-24 h-24 bg-white/5 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 bg-white/5 rounded" />
                            <div className="h-3 w-1/2 bg-white/5 rounded" />
                            <div className="h-3 w-1/4 bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (isLoading) return <MenuSkeleton />;

    const activeFiltersCount = dietaryFilter !== "All" ? 1 : 0;

    return (
        <div className="pb-32 px-0 sm:px-0 md:px-0">
            <PromoCarousel items={promoItems} currency={currency} />

            <div className="sticky top-14 sm:top-16 bg-black/95 backdrop-blur-md z-30 py-3 sm:py-4 px-4 space-y-3 sm:space-y-4 shadow-lg shadow-black/20 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        <input
                            type="text"
                            placeholder="Search for food..."
                            className="w-full bg-white/10 border-none rounded-xl py-3.5 sm:py-3 pl-10 pr-4 text-base sm:text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary outline-none transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`relative min-w-[50px] min-h-[50px] sm:min-w-[44px] sm:min-h-[44px] rounded-xl flex items-center justify-center transition-all border ${showFilters || activeFiltersCount > 0
                            ? 'bg-primary text-black border-primary'
                            : 'bg-white/10 text-white/70 border-white/5'
                            }`}
                        aria-label="Toggle filters"
                    >
                        <Filter size={20} />
                        {activeFiltersCount > 0 && !showFilters && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
                        )}
                    </button>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory hide-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all active:scale-95 snap-start border ${selectedCategory === cat
                                ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20'
                                : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pt-1 pb-2">
                                {["All", "Veg", "Spicy", "GlutenFree"].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => {
                                            if (filter === "All") {
                                                setDietaryFilter("All");
                                                setSearchTerm("");
                                                setSelectedCategory("All");
                                            } else {
                                                setDietaryFilter(filter);
                                            }
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all active:scale-95 border text-[11px] font-bold uppercase tracking-wider ${dietaryFilter === filter
                                            ? 'bg-white text-black border-white shadow-lg'
                                            : 'bg-white/10 text-white/40 border-white/10'
                                            }`}
                                    >
                                        {filter === "Veg" && <span className={`w-1.5 h-1.5 rounded-full ${dietaryFilter === filter ? 'bg-green-600' : 'bg-green-500'}`} />}
                                        {filter === "Spicy" && <span className={`w-1.5 h-1.5 rounded-full ${dietaryFilter === filter ? 'bg-red-600' : 'bg-red-500'}`} />}
                                        {filter === "All" ? "Reset All" : filter}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-6 px-4 space-y-8">
                {filteredItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 flex flex-col items-center">
                        <UtensilsCrossed size={48} className="mb-4 text-gray-700" />
                        <p className="text-lg font-medium">No items found</p>
                        <p className="text-sm">Try changing your filters or check back later</p>
                    </div>
                ) : groupedItems && !searchTerm ? (
                    Object.entries(groupedItems).map(([category, items]) => (
                        <section key={category}>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-primary rounded-full" />
                                {category}
                            </h3>
                            <div className="space-y-3">
                                {items.map(item => (
                                    <MenuItemCard
                                        key={item._id}
                                        item={item}
                                        currency={currency}
                                        onClick={() => setSelectedItem(item)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="space-y-3">
                        {filteredItems.map(item => (
                            <MenuItemCard
                                key={item._id}
                                item={item}
                                currency={currency}
                                onClick={() => setSelectedItem(item)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <ItemDetailModal
                        item={selectedItem}
                        currency={currency}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {cartItemCount > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-4 left-4 right-4 z-30 pb-safe"
                    >
                        <Link
                            to={`/menu/${restaurant._id}/cart${tableId ? `?table=${tableId}` : ''}`}
                            className="bg-primary text-black p-4 sm:p-4 min-h-[56px] rounded-xl shadow-xl shadow-primary/20 flex items-center justify-between font-bold active:scale-[0.98] transition-transform"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-black/20 min-w-[32px] min-h-[32px] w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                                    {cartItemCount}
                                </div>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] sm:text-xs text-black/60 uppercase font-semibold">Total</span>
                                    <span className="text-lg sm:text-lg font-bold">{currency}{cartTotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-base sm:text-base">
                                View Cart <ChevronRight size={20} />
                            </div>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MenuItemCard = ({ item, currency, onClick }) => {
    const isPopular = item.price > 25;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className="flex gap-3 sm:gap-4 p-4 sm:p-3 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 active:scale-[0.98] transition-all cursor-pointer group hover:border-primary/30 relative overflow-hidden"
        >
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-gray-800 rounded-xl overflow-hidden relative">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 bg-gradient-to-br from-gray-800 to-gray-900">
                        <UtensilsCrossed size={24} />
                    </div>
                )}
                {(item.video || item.model3D?.glb) && (
                    <div className="absolute top-1.5 right-1.5 flex gap-1 z-10">
                        {item.video && <div className="bg-black/70 p-1.5 rounded-full backdrop-blur-sm"><Play size={12} className="fill-white" /></div>}
                        {item.model3D?.glb && <div className="bg-primary/90 text-black px-2 py-1 rounded text-[9px] font-bold shadow-sm">3D</div>}
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-bold text-base sm:text-lg leading-tight text-white line-clamp-1">{item.name}</h3>
                        <span className="font-bold text-primary font-mono text-base sm:text-lg whitespace-nowrap">{currency}{item.price}</span>
                    </div>
                    <p className="text-sm sm:text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">{item.description}</p>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {isPopular && <span className="text-[10px] sm:text-[11px] uppercase font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded">Bestseller</span>}
                        {item.isVegetarian && <span className="text-[10px] sm:text-[11px] uppercase font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">Veg</span>}
                        {item.isSpicy && <span className="text-[10px] sm:text-[11px] uppercase font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">Spicy</span>}
                    </div>
                </div>

                <div className="flex items-center justify-end mt-2">
                    <button
                        className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-black active:scale-95 transition-all shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}
                    >
                        <Plus size={18} className="sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const ItemDetailModal = ({ item, currency, onClose }) => {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [instructions, setInstructions] = useState("");

    const handleAddToCart = () => {
        addToCart(item, quantity, instructions);
        onClose();
        toast.success(`Added ${quantity} ${item.name} to cart`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl sm:rounded-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="sm:hidden w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

                <div className="relative h-52 sm:h-72 w-full flex-shrink-0">
                    {item.video ? (
                        <video
                            src={item.video}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <UtensilsCrossed size={48} className="text-gray-600" />
                        </div>
                    )}

                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                    <button
                        onClick={onClose}
                        className="absolute top-3 sm:top-4 right-3 sm:right-4 min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-lg active:bg-black/70 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent" />
                </div>

                <div className="px-5 sm:px-6 pb-6 pt-0 overflow-y-auto custom-scrollbar relative z-10 -mt-10 flex-1">
                    <div className="flex justify-between items-start mb-2 gap-3">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{item.name}</h2>
                        <span className="text-xl sm:text-2xl font-bold text-primary whitespace-nowrap">{currency}{item.price}</span>
                    </div>

                    <p className="text-gray-300 leading-relaxed mb-4 sm:mb-6 text-base sm:text-lg">{item.description}</p>

                    <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                        {item.isVegetarian && <span className="px-3 py-1.5 sm:py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/20">Vegetarian</span>}
                        {item.isSpicy && <span className="px-3 py-1.5 sm:py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20">Spicy</span>}
                        {item.calories && <span className="px-3 py-1.5 sm:py-1 rounded-full bg-white/10 text-white/70 text-xs border border-white/10">{item.calories} cal</span>}
                        {item.prepTime && <span className="px-3 py-1.5 sm:py-1 rounded-full bg-white/10 text-white/70 text-xs border border-white/10">{item.prepTime} min</span>}
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 sm:p-4 mb-5 sm:mb-6 border border-white/5">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-400">Quantity</label>
                            <div className="flex items-center gap-3 sm:gap-4">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="min-w-[48px] min-h-[48px] sm:min-w-[40px] sm:min-h-[40px] w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-white text-xl active:bg-white/20 active:scale-95 transition-all"
                                >
                                    -
                                </button>
                                <span className="w-10 sm:w-8 text-center font-bold text-xl">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="min-w-[48px] min-h-[48px] sm:min-w-[40px] sm:min-h-[40px] w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-white text-xl active:bg-white/20 active:scale-95 transition-all"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 sm:mb-8">
                        <label className="text-sm font-bold text-gray-400 block mb-3">Special Instructions</label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Add notes for the chef (e.g., No onions, extra spicy)..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-base sm:text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 min-h-[100px] resize-none"
                        />
                    </div>
                </div>

                <div className="p-4 sm:p-4 pb-safe border-t border-white/5 bg-[#1a1a1a] sticky bottom-0">
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-black font-bold py-4 sm:py-4 min-h-[56px] rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                    >
                        <ShoppingBag size={20} />
                        <span className="text-base sm:text-base">Add to Order</span>
                        <span className="w-1 h-1 rounded-full bg-black/40"></span>
                        <span className="text-base sm:text-base">{currency}{(item.price * quantity).toFixed(2)}</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Menu;
