import { motion } from "framer-motion";
import { QrCode, ArrowRight, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
    return (
        <section className="relative min-h-[80vh] sm:min-h-[75vh] lg:min-h-[70vh] flex items-center justify-center overflow-hidden pt-12 sm:pt-16 md:pt-20 lg:pt-16">
            {/* Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Gradient Orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute top-1/4 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[60px] sm:blur-[80px] lg:blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[60px] sm:blur-[80px] lg:blur-[120px]"
                />

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                             linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-8">
                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-14 items-center">
                    {/* Left Content */}
                    <div className="text-center lg:text-left">
                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.2] sm:leading-[1.25] mb-4 sm:mb-6 tracking-tight"
                        >
                            The Operating System for{" "}
                            <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">High-Growth Restaurants</span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed"
                        >
                            Cut wait times by 15%, reduce staff errors, and increase average order value.
                            Transform your restaurant into a data-driven powerhouse with Ritam Bharat POS.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start mb-6 sm:mb-10"
                        >
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link to="/register" className="btn-primary text-sm sm:text-base h-11 sm:h-12 px-5 sm:px-6 gap-2 group inline-flex items-center justify-center shadow-lg shadow-primary/25 rounded-xl">
                                    Start 14-Day Free Trial
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <a
                                    href="#roi"
                                    className="text-sm sm:text-base h-11 sm:h-12 px-5 sm:px-6 gap-2 inline-flex items-center justify-center border border-border/50 bg-background/50 hover:bg-muted/50 backdrop-blur-sm rounded-xl transition-all hover:border-border cursor-pointer font-medium"
                                >
                                    Calculate ROI
                                </a>
                            </motion.div>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex items-center justify-center lg:justify-start gap-4 sm:gap-6 lg:gap-8 border-t border-border/30 pt-6 sm:pt-8"
                        >
                            {[
                                { value: "30%", label: "Faster Service" },
                                { value: "2.5x", label: "Better Accuracy" },
                                { value: "18%", label: "Revenue Boost" },
                            ].map((stat, index) => (
                                <div key={index} className="text-center px-2 sm:px-3 lg:px-4 first:pl-0 border-r last:border-0 border-border/30">
                                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                                    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right Content - Dashboard Preview (Desktop) */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative hidden lg:block lg:mt-4"
                    >
                        <div className="relative group">
                            {/* Glass Background Glow */}
                            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 via-accent/10 to-primary/5 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />

                            {/* Dashboard Shell */}
                            <div className="relative glass-card border-border/50 shadow-2xl rounded-[1.5rem] overflow-hidden">
                                {/* Dashboard Header */}
                                <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400/50" />
                                        <div className="w-3 h-3 rounded-full bg-amber-400/50" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-400/50" />
                                    </div>
                                    <div className="h-4 w-32 bg-muted rounded-full flex items-center px-3">
                                        <div className="h-1 w-full bg-border rounded-full" />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-muted border border-border/50" />
                                </div>

                                {/* Dashboard Content */}
                                <div className="p-6 space-y-6 bg-background/40">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Today's Revenue</p>
                                            <p className="text-2xl font-black text-foreground">₹1,280.50</p>
                                            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                                                <span>↑ 12.5%</span>
                                                <span className="text-muted-foreground/60 font-medium">vs yesterday</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Active Orders</p>
                                            <p className="text-2xl font-black text-foreground">14</p>
                                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '70%' }}
                                                    transition={{ duration: 1.5, delay: 1 }}
                                                    className="h-full bg-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Revenue Chart Placeholder */}
                                    <div className="p-4 rounded-xl border border-border/50 bg-background/50 h-32 flex items-end gap-2">
                                        {[40, 65, 45, 90, 75, 55, 80].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                                                className="flex-1 bg-gradient-to-t from-primary/40 to-primary/80 rounded-t-sm"
                                            />
                                        ))}
                                    </div>

                                    {/* Order Feed */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-black">Live Feed</p>
                                        {[
                                            { id: '#8021', table: 'Table 14', status: 'In Progress', time: '2m' },
                                            { id: '#8020', table: 'Table 08', status: 'Ready', time: '5m' }
                                        ].map((order, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-muted/20">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${order.status === 'Ready' ? 'bg-emerald-500' : 'bg-primary'}`} />
                                                    <div>
                                                        <p className="text-xs font-bold">{order.id} • {order.table}</p>
                                                        <p className="text-[10px] text-muted-foreground">{order.status}</p>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-medium">{order.time}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Floating Card */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-6 -right-6 p-4 glass-card border-primary/20 shadow-xl rounded-2xl hidden xl:block"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black">AI Optimized</p>
                                        <p className="text-[10px] text-muted-foreground">Kitchen efficiency +15%</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

