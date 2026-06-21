import { motion } from "framer-motion";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui/animated-section";
import {
    Zap,
    Sparkles,
    CreditCard,
    BarChart3,
    Package,
    Brain
} from "lucide-react";

const revenueFeatures = [
    {
        icon: Zap,
        title: "High-Velocity Ordering",
        description: "Reduce order-to-table time by 40%. Our streamlined QR interface removes friction and increases turn rates.",
    },
    {
        icon: Sparkles,
        title: "AI-Powered Upselling",
        description: "Chef AI suggests perfectly paired items and beverages, increasing average check size by up to 18%.",
    },
    {
        icon: CreditCard,
        title: "Instant Digital Close",
        description: "No more waiting for the machine. Guests pay instantly via phone. Free your staff for higher-value service.",
    },
];

const efficiencyFeatures = [
    {
        icon: BarChart3,
        title: "Forecasting Analytics",
        description: "Predict peak times and staff accordingly. Stop overstaffing slow hours and losing money.",
    },
    {
        icon: Package,
        title: "Zero-Waste Inventory",
        description: "Automated stock tracking ensures you never run out of best-sellers and never waste expiring items.",
    },
    {
        icon: Brain,
        title: "Kitchen Control Hub",
        description: "Real-time ticket prioritization reduces error margins to near-zero and calms the back-of-house chaos.",
    },
];

export const FeaturesSection = () => {
    return (
        <section id="features" className="section-padding relative overflow-hidden bg-background">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-20">
                    <span className="inline-block text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                        Core Ecosystem
                    </span>
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                        Engineered for <span className="text-gradient italic">Total Mastery</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic font-medium">
                        Standard POS systems just track sales. Ritam Bharat POS manages your entire business logic
                        to maximize every square inch of your restaurant.
                    </p>
                </AnimatedSection>

                {/* Outcome 1: Revenue */}
                <div className="mb-32">
                    <AnimatedSection delay={0.1} className="mb-14 flex items-center gap-6">
                        <div className="h-px bg-border flex-1" />
                        <h3 className="font-display text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
                            Accelerate <span className="text-primary italic font-black">Revenue</span>
                        </h3>
                        <div className="h-px bg-border flex-1" />
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-3 gap-8">
                        {revenueFeatures.map((feature, index) => (
                            <StaggerItem key={index}>
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    className="group relative p-8 h-full rounded-[2.5rem] glass-card border-border/50 hover:border-primary/30 transition-all shadow-xl shadow-primary/5"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <feature.icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <h4 className="font-display text-xl font-bold mb-3 italic">{feature.title}</h4>
                                    <p className="text-muted-foreground leading-relaxed text-sm font-medium">{feature.description}</p>
                                </motion.div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>

                {/* Outcome 2: Efficiency */}
                <div className="mb-10">
                    <AnimatedSection delay={0.1} className="mb-14 flex items-center gap-6">
                        <div className="h-px bg-border flex-1" />
                        <h3 className="font-display text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
                            Eliminate <span className="text-accent italic font-black">Waste</span>
                        </h3>
                        <div className="h-px bg-border flex-1" />
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-3 gap-8">
                        {efficiencyFeatures.map((feature, index) => (
                            <StaggerItem key={index}>
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    className="group relative p-8 h-full rounded-[2.5rem] glass-card border-border/50 hover:border-accent/30 transition-all shadow-xl shadow-accent/5"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <feature.icon className="w-8 h-8 text-accent" />
                                    </div>
                                    <h4 className="font-display text-xl font-bold mb-3 italic">{feature.title}</h4>
                                    <p className="text-muted-foreground leading-relaxed text-sm font-medium">{feature.description}</p>
                                </motion.div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </div>
        </section>
    );
};

