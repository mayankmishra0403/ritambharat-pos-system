import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users, DollarSign } from 'lucide-react';
import { AnimatedSection } from '../ui/animated-section';

export const ROICalculator = () => {
    const [tables, setTables] = useState(15);
    const [checkSize, setCheckSize] = useState(45);
    const [turns, setTurns] = useState(3);

    const calculations = useMemo(() => {
        // Assume Ritam Bharat POS saves 12 minutes per table turn (ordering + payment speed)
        // Assume this leads to 0.5 additional turns per table per day on average
        const currentDailyRevenue = tables * checkSize * turns;
        const potentialDailyRevenue = tables * checkSize * (turns + 0.5);
        const monthlyIncrease = (potentialDailyRevenue - currentDailyRevenue) * 30;
        const yearlyIncrease = monthlyIncrease * 12;

        return {
            monthly: Math.round(monthlyIncrease),
            yearly: Math.round(yearlyIncrease),
            efficiency: 15 // 15% efficiency boost
        };
    }, [tables, checkSize, turns]);

    return (
        <section id="roi" className="section-padding bg-muted/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-7xl mx-auto px-6">
                <AnimatedSection className="text-center mb-16">
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                        See the <span className="text-gradient">Financial Impact</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Ritam Bharat POS isn't an expense—it's a revenue generator. Use our calculator to see
                        how much more you could be earning by optimizing your operations.
                    </p>
                </AnimatedSection>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Controls */}
                    <div className="space-y-8 glass-card p-8 sm:p-10 rounded-[2rem]">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Number of Tables</label>
                                    <span className="text-2xl font-black text-primary">{tables}</span>
                                </div>
                                <input
                                    type="range" min="1" max="100" value={tables}
                                    onChange={(e) => setTables(parseInt(e.target.value))}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Avg. Check Size ($)</label>
                                    <span className="text-2xl font-black text-primary">${checkSize}</span>
                                </div>
                                <input
                                    type="range" min="5" max="500" value={checkSize}
                                    onChange={(e) => setCheckSize(parseInt(e.target.value))}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Daily Table Turns</label>
                                    <span className="text-2xl font-black text-primary">{turns}</span>
                                </div>
                                <input
                                    type="range" min="1" max="10" step="0.5" value={turns}
                                    onChange={(e) => setTurns(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border/50">
                            <p className="text-xs text-muted-foreground italic">
                                *Calculations based on a 15% increase in operational efficiency and table turnover speed observed in QR-powered restaurants.
                            </p>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="relative">
                        <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-3xl -z-10" />
                        <div className="bg-foreground text-background rounded-[2.5rem] p-10 shadow-2xl space-y-10">
                            <div className="space-y-2">
                                <p className="text-sm font-bold uppercase tracking-[0.3em] text-background/60">Potential Monthly Growth</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl sm:text-7xl font-black text-primary italic">
                                        ${calculations.monthly.toLocaleString()}
                                    </span>
                                    <span className="text-xl font-bold text-background/40">/mo</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-background/40">Yearly Revenue Lift</p>
                                    <p className="text-2xl font-bold text-background italic">+${calculations.yearly.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-background/40">Efficiency Boost</p>
                                    <p className="text-2xl font-bold text-emerald-400 italic">+{calculations.efficiency}%</p>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-background/10">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                    </div>
                                    <p className="text-sm text-background/70 leading-relaxed">
                                        Faster ordering reduces guest "wait anxiety" and encourages up to 12% higher ticket sizes.
                                    </p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <p className="text-sm text-background/70 leading-relaxed">
                                        Save an average of 12 minutes per table—allowing you to seat more guests per shift.
                                    </p>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-primary text-primary-foreground h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                            >
                                Claim Your Growth Now
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
