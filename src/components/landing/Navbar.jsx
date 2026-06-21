import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../common/Logo";
import ThemeToggle from "../common/ThemeToggle";

const navLinks = [
    { name: "Features", href: "#features", isHash: true },
    { name: "ROI", href: "#roi", isHash: true },
    { name: "Demo", href: "#demo", isHash: true },

    { name: "Contact", href: "#contact", isHash: true },
];

export const Navbar = ({ onOpenContactModal }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                    ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
                    : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/" className="group">
                            <Logo className="w-auto h-12" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                link.isHash ? (
                                    <motion.a
                                        key={link.name}
                                        href={link.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm font-medium relative group"
                                        whileHover={{ y: -2 }}
                                    >
                                        {link.name}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                                    </motion.a>
                                ) : (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm font-medium relative group"
                                    >
                                        <motion.span whileHover={{ y: -2 }} className="block">
                                            {link.name}
                                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                                        </motion.span>
                                    </Link>
                                )
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center gap-4">
                            <ThemeToggle className="mr-2" />

                            <Link to="/login" className="font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Sign In
                            </Link>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Link to="/register" className="btn-primary px-6 py-2">
                                    Get Started
                                </Link>
                            </motion.div>
                        </div>

                        {/* Mobile Menu Button */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-x-0 top-20 z-40 bg-background/95 backdrop-blur-xl border-b border-border md:hidden"
                        >
                            <div className="px-6 py-8 space-y-6">
                                {navLinks.map((link, index) => (
                                    link.isHash ? (
                                        <motion.a
                                            key={link.name}
                                            href={link.href}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block text-lg font-medium text-foreground hover:text-primary transition-colors"
                                        >
                                            {link.name}
                                        </motion.a>
                                    ) : (
                                        <Link
                                            key={link.name}
                                            to={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block text-lg font-medium text-foreground hover:text-primary transition-colors"
                                        >
                                            <motion.span
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                {link.name}
                                            </motion.span>
                                        </Link>
                                    )
                                ))}
                                <div className="flex flex-col gap-3 pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Appearance</span>
                                        <ThemeToggle />
                                    </div>
                                    <a
                                        href="#contact"
                                        className="px-6 py-2 text-center border border-border rounded-xl hover:bg-muted transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Contact
                                    </a>
                                    <Link to="/login" className="px-6 py-2 text-center border border-border rounded-xl hover:bg-muted transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                                        Sign In
                                    </Link>
                                    <Link to="/register" className="btn-primary text-center" onClick={() => setIsMobileMenuOpen(false)}>
                                        Get Started
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
