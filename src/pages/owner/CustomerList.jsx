import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import CustomerTable from '../../components/crm/CustomerTable';
import CustomerDetail from './CustomerDetail';

const CustomerList = () => {
    const { user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [restaurantId, setRestaurantId] = useState(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        if (user?.restaurant) {
            setRestaurantId(typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant);
        }
    }, [user]);

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        setPage(1);
    }, [searchInput]);

    const { data, isLoading } = useQuery({
        queryKey: ['customers', restaurantId, page, search],
        queryFn: async () => {
            const params = new URLSearchParams({ restaurantId, page: page.toString(), limit: '20' });
            if (search) params.set('search', search);
            const res = await api.get(`/customers?${params}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
            <Sidebar
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Customers</h1>
                                <p className="text-sm text-muted-foreground">
                                    {data?.pagination?.total || 0} total customers
                                </p>
                            </div>
                        </div>

                        {selectedCustomer ? (
                            <CustomerDetail
                                customer={selectedCustomer}
                                restaurantId={restaurantId}
                                onBack={() => setSelectedCustomer(null)}
                            />
                        ) : (
                            <>
                                <CustomerTable
                                    customers={data?.customers || []}
                                    onSelect={setSelectedCustomer}
                                    loading={isLoading}
                                />

                                {data?.pagination?.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-1.5 bg-muted/50 rounded-lg text-xs font-bold disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-xs text-muted-foreground">
                                            Page {page} of {data.pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                                            disabled={page >= data.pagination.totalPages}
                                            className="px-3 py-1.5 bg-muted/50 rounded-lg text-xs font-bold disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerList;
