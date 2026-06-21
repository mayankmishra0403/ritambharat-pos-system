import { motion } from "framer-motion";
import { QrCode, Mail } from "lucide-react";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Link } from "react-router-dom";
import Logo from "../common/Logo";

const footerLinks = {
    product: [
        { name: "Features", href: "#features", isHash: true },
        { name: "ROI Calculator", href: "#roi", isHash: true },
        { name: "Pricing", href: "#pricing", isHash: true },
        { name: "Demo", href: "#demo", isHash: true },
    ],
    legal: [
        { name: "Privacy", href: "/privacy", isHash: false },
        { name: "Terms", href: "/terms", isHash: false },
        { name: "Cookies", href: "#", isHash: true },
    ],
};

export const Footer = ({ onOpenContactModal }) => {
    return (
        <footer id="contact" className="bg-foreground text-background relative overflow-hidden">
            {/* CTA Section */}
            <div className="border-b border-background/10">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
                    <AnimatedSection className="text-center">
                        <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 italic">
                            Scale Your <span className="text-primary italic">Restaurant</span> Today
                        </h2>
                        <p className="text-background/60 text-lg max-w-xl mx-auto mb-8 italic font-medium">
                            Join high-growth restaurants using Ritam Bharat POS to automate operations,
                            reduce waste, and maximize revenue.
                        </p>
                        <div className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link to="/register" className="btn-primary text-sm sm:text-base h-11 sm:h-12 px-6 sm:px-8 inline-flex items-center justify-center whitespace-nowrap">
                                    Start Free Trial
                                </Link>
                            </motion.div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onOpenContactModal}
                                className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl border border-background/20 text-sm sm:text-base hover:bg-background/5 transition-colors inline-flex items-center justify-center whitespace-nowrap"
                            >
                                Contact
                            </motion.button>
                        </div>
                    </AnimatedSection>
                </div>
            </div>

            {/* Main Footer (Minimal) */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Brand & Copyright */}
                    <div className="flex items-center gap-4">
                        <Link to="/" className="block group">
                            <Logo className="w-auto h-8" iconOnly={true} />
                        </Link>
                        <p className="text-background/40 text-sm">
                            © {new Date().getFullYear()} Ritam Bharat POS. All rights reserved.
                        </p>
                    </div>

                    {/* Legal Links */}
                    <div className="flex items-center gap-8">
                        {footerLinks.legal.map((link) => (
                            <Link
                                key={link.name}
                                to={link.href}
                                className="text-background/40 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};
