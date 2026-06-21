import { motion } from 'framer-motion';
import { XCircle, CheckCircle2, AlertTriangle, Zap, Brain, ClipboardCheck } from 'lucide-react';
import { AnimatedSection } from '../ui/animated-section';

const comparisonData = [
    {
        title: "Ordering Experience",
        old: "Guests wait for staff to bring physical menus, then wait again to place an order.",
        new: "Guests scan QR. Instant digital menu access with beautiful photos and AI recommendations.",
        oldIcon: AlertTriangle,
        newIcon: Zap
    },
    {
        title: "Kitchen Efficiency",
        old: "Handwritten tickets, verbal shouting, and lost orders lead to high stress and waste.",
        new: "Unified digital dashboard. AI-prioritized prep lists and real-time status updates.",
        oldIcon: XCircle,
        newIcon: Brain
    },
    {
        title: "Staff Errors",
        old: "Incorrectly heard orders and manual billing mistakes hurt your reputation and bottom line.",
        new: "Digital precision. Orders go directly from guest to kitchen. Billing is automated.",
        oldIcon: AlertTriangle,
        newIcon: ClipboardCheck
    }
];

export const ComparisonSection = () => {
    return (
        <section className="section-padding bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <AnimatedSection className="text-center mb-20">
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                        Stop Guessing. <span className="text-gradient">Start Controlling.</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
Traditional restaurant management is reactive. Ritam Bharat POS makes you proactive.
                         Compare the difference in everyday operations.
                    </p>
                </AnimatedSection>

                <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
                    {comparisonData.map((item, index) => (
                        <AnimatedSection
                            key={index}
                            delay={index * 0.15}
                            className="group relative"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-b from-primary/20 to-transparent rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />

                            <div className="relative h-full glass-card border-border/50 rounded-[2rem] overflow-hidden flex flex-col">
                                <div className="p-8 border-b border-border/50 bg-muted/30">
                                    <h3 className="text-xl font-black italic uppercase tracking-tight">{item.title}</h3>
                                </div>

                                <div className="p-8 space-y-8 flex-1">
                                    {/* The Old Way */}
                                    <div className="space-y-4 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-3 text-red-500">
                                            <item.oldIcon className="w-5 h-5" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">The Old Way</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {item.old}
                                        </p>
                                    </div>

                                    {/* Divider */}
                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-dashed border-border/50" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-background px-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">vs</span>
                                        </div>
                                    </div>

                                    {/* The New Way */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-primary">
                                            <item.newIcon className="w-5 h-5" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">With Ritam Bharat POS</span>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed italic">
                                            {item.new}
                                        </p>
                                    </div>
                                </div>

                                <div className="px-8 pb-8">
                                    <div className="flex items-center justify-between py-4 border-t border-border/50">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={`w-1 h-3 rounded-full ${i <= 2 ? 'bg-red-400/20' : 'bg-primary'}`} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black italic text-primary uppercase">Optimized</span>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
};
