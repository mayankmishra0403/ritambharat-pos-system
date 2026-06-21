import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, Mail, Clock, Star, Globe, Info } from 'lucide-react';

const RestaurantInfoModal = ({ isOpen, onClose, restaurant }) => {
    if (!restaurant) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-[#1a1a1a] rounded-3xl overflow-hidden shadow-2xl pointer-events-auto border border-white/10 flex flex-col max-h-[90vh]"
                        >
                            {/* Header with Banner & Logo */}
                            <div className="relative h-48 sm:h-56 shrink-0">
                                {restaurant.coverImage ? (
                                    <img
                                        src={restaurant.coverImage}
                                        alt={restaurant.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange-600/20 flex items-center justify-center">
                                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                            <Info size={40} className="text-primary/40" />
                                        </div>
                                    </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
                                >
                                    <X size={20} />
                                </button>

                                {/* Logo Overlay */}
                                <div className="absolute -bottom-8 left-6 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#1a1a1a] p-1.5 border border-white/10 shadow-xl overflow-hidden">
                                    {restaurant.logo ? (
                                        <img
                                            src={restaurant.logo}
                                            alt="Logo"
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-primary flex items-center justify-center rounded-xl font-black text-3xl text-black">
                                            {restaurant.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="pt-12 p-6 sm:p-8 overflow-y-auto space-y-6 custom-scrollbar">
                                {/* Basic Info */}
                                <div>
                                    <h2 className="text-3xl font-black text-white mb-1">{restaurant.name}</h2>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-white/5 w-full" />

                                {/* Action Details */}
                                <div className="grid gap-4">
                                    {/* Address */}
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                            <MapPin size={20} className="text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Location</h4>
                                            <p className="text-sm text-white/90 leading-relaxed font-medium">
                                                {restaurant.address?.street}, {restaurant.address?.city}, {restaurant.address?.state} {restaurant.address?.zipCode}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                                <Phone size={18} className="text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Phone</h4>
                                                <p className="text-xs text-white/90 font-medium truncate">{restaurant.contact?.phone || "+1 (555) 123-4567"}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                                <Mail size={18} className="text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Email</h4>
                                                <p className="text-xs text-white/90 font-medium truncate">{restaurant.contact?.email || "hello@ritambharat.com"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hours */}
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                            <Clock size={20} className="text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Opening Hours</h4>
                                            <p className="text-sm text-white/90 font-medium">
                                                Mon - Sun: 09:00 AM - 11:00 PM
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-white/5 w-full" />

                                {/* Footer Features */}
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {['Dine-in', 'Smart Ordering', 'QR Payments', 'Wi-Fi'].map((tag) => (
                                        <span key={tag} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-wider">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default RestaurantInfoModal;
