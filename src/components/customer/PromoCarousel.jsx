import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Flame, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const PromoCarousel = ({ items, currency = '₹' }) => {
    const { addToCart } = useCart();

    if (!items || items.length === 0) return null;

    const featuredItem = items[0];

    return (
        <div className="relative w-full h-[50vh] sm:h-[55vh] md:h-[500px] overflow-hidden rounded-b-3xl mb-6 sm:mb-8 shadow-2xl">
            <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
            >
                {featuredItem.image ? (
                    <img
                        src={featuredItem.image}
                        alt={featuredItem.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </motion.div>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12 z-10 flex flex-col items-start gap-2 sm:gap-3 md:gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className="bg-primary/90 text-black font-bold px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-primary/20">
                        <Flame size={12} className="fill-black" /> Chef's Special
                    </span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight max-w-2xl drop-shadow-xl"
                >
                    {featuredItem.name}
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/80 line-clamp-2 max-w-lg text-sm sm:text-base md:text-lg drop-shadow-md"
                >
                    {featuredItem.description}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-2"
                >
                    <span className="text-2xl sm:text-3xl font-bold text-primary drop-shadow-md">{currency}{featuredItem.price}</span>
                    <button
                        onClick={() => addToCart(featuredItem, 1)}
                        className="bg-white text-black hover:bg-gray-100 active:bg-gray-200 font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg text-sm sm:text-base min-h-[44px]"
                    >
                        <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> Order Now
                    </button>
                </motion.div>
            </div>

            {items.length > 1 && (
                <div className="absolute top-4 right-4 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <span className="text-white/80 text-xs font-medium">
                        Featured Item
                    </span>
                </div>
            )}
        </div>
    );
};

export default PromoCarousel;
