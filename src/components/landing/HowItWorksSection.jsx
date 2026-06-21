import { motion } from "framer-motion";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui/animated-section";
import { QrCode, ClipboardList, LayoutDashboard, LineChart, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
    {
        icon: ClipboardList,
        step: "01",
        title: "Import Your Assets",
        description: "Upload your current menu items. Our AI helps auto-categorize and optimize descriptions for upselling.",
    },
    {
        icon: QrCode,
        step: "02",
        title: "Deploy Floor Plan",
        description: "Map your tables and generate unique QR codes for each location in just a few clicks.",
    },
    {
        icon: LayoutDashboard,
        step: "03",
        title: "Go Live Instantly",
        description: "Launch your Kitchen Display System (KDS) and start receiving orders with zero hardware cost.",
    },
    {
        icon: LineChart,
        step: "04",
        title: "Optimize & Scale",
        description: "Use real-time analytics to identify high-margin items and reduce operational waste.",
    },
];

export const HowItWorksSection = ({ onOpenContactModal }) => {
    return (
        <section id="how-it-works" className="section-padding bg-foreground text-background relative overflow-hidden">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-12 sm:mb-16 lg:mb-20">
                    <span className="inline-block text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                        The Onboarding Path
                    </span>
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                        Zero Friction <span className="text-primary italic">Implementation</span>
                    </h2>
                    <p className="text-background/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium italic">
                        Most POS transitions take weeks. With Ritam Bharat POS, you can be up and running
                        before your next shift starts.
                    </p>
                </AnimatedSection>

                {/* Mobile/Tablet: Carousel | Desktop: Grid */}
                <div className="relative mb-12 sm:mb-16 lg:mb-20">
                    {/* Mobile/Tablet Carousel */}
                    <div className="lg:hidden -mx-4 sm:-mx-6">
                        <div
                            className="overflow-x-auto carousel-scrollbar snap-x snap-mandatory
                                     flex gap-6 sm:gap-8 px-4 sm:px-6 pb-4
                                     scroll-smooth touch-pan-x"
                        >
                            {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.15 }}
                                    whileHover={{ y: -5 }}
                                    className="snap-center snap-always flex-none
                                             w-[80vw] sm:w-[42vw]
                                             min-w-0 relative group"
                                >
                                    {/* Step Number */}
                                    <div className="absolute -top-4 left-0 font-display text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                                        {step.step}
                                    </div>

                                    <div className="relative pt-8">
                                        {/* Icon */}
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-primary/30">
                                            <step.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
                                        </div>

                                        <h3 className="font-display text-lg sm:text-xl font-semibold mb-2 sm:mb-3 leading-snug">{step.title}</h3>
                                        <p className="text-background/60 leading-relaxed text-sm sm:text-base">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Grid */}
                    <div className="hidden lg:block relative">
                        {/* Connection Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />

                        <div className="grid grid-cols-4 gap-8 lg:gap-6">
                            {steps.map((step, index) => (
                                <AnimatedSection key={index} delay={index * 0.15}>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="relative group"
                                    >
                                        {/* Step Number */}
                                        <div className="absolute -top-4 left-0 font-display text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                                            {step.step}
                                        </div>

                                        <div className="relative pt-8">
                                            {/* Icon */}
                                            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                                                <step.icon className="w-8 h-8 text-primary-foreground" />
                                            </div>

                                            <h3 className="font-display text-xl font-semibold mb-3 leading-snug">{step.title}</h3>
                                            <p className="text-background/60 leading-relaxed">{step.description}</p>
                                        </div>
                                    </motion.div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Visual */}
                <AnimatedSection delay={0.5} className="mt-12 sm:mt-16 lg:mt-20">
                    <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-background/5 backdrop-blur-sm border border-background/10 rounded-3xl p-6 sm:p-8 md:p-10"
                    >
                        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-4 leading-tight">
                                    Ready to Transform Your Restaurant?
                                </h3>
                                <p className="text-background/60 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
                                    Join 89+ restaurants already using Ritam Bharat POS to delight their customers
                                    and streamline operations.
                                </p>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
                                    {[
                                        "No hardware needed",
                                        "Setup in 10 minutes",
                                        "Free 14-day trial",
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                            <span className="text-xs sm:text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-row gap-3 sm:gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        to="/register"
                                        className="btn-primary text-sm sm:text-base px-5 sm:px-7 py-3 whitespace-nowrap inline-flex items-center justify-center rounded-xl"
                                    >
                                        Start Free Trial
                                    </Link>
                                </motion.div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onOpenContactModal}
                                    className="border border-background/20 bg-background/10 hover:bg-background/20 text-background text-sm sm:text-base px-5 sm:px-7 py-3 rounded-xl transition-all whitespace-nowrap"
                                >
                                    Contact Team
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </AnimatedSection>
            </div>


        </section>
    );
};
