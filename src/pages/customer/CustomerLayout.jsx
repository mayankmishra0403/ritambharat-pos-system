import { useState, useEffect } from 'react';
import { Outlet, useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Flag, Menu } from 'lucide-react';
import api from '../../config/api';
import { useCart } from '../../context/CartContext';
import CustomerSidebar from '../../components/customer/CustomerSidebar';
import FloatingActionMenu from '../../components/customer/FloatingActionMenu';
import RestaurantInfoModal from '../../components/customer/RestaurantInfoModal';
import PWAInstallPrompt from '../../components/common/PWAInstallPrompt';

const CustomerLayout = () => {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRestaurantInfoOpen, setIsRestaurantInfoOpen] = useState(false);

    // Extract parameters
    const { restaurantId: pathRestaurantId, tableId: pathTableId } = params;
    const queryTableId = searchParams.get('table');
    const qrToken = searchParams.get('token');

    // Effective IDs
    const restaurantId = pathRestaurantId || localStorage.getItem('ritam_bharat_pos_restaurant_id');
    const tableId = pathTableId || queryTableId || localStorage.getItem('ritam_bharat_pos_table_id');

    // Sync to localStorage
    useEffect(() => {
        if (pathRestaurantId) {
            localStorage.setItem('ritam_bharat_pos_restaurant_id', pathRestaurantId);
        }
        if (pathTableId || queryTableId) {
            localStorage.setItem('ritam_bharat_pos_table_id', pathTableId || queryTableId);
        }
        if (qrToken) {
            localStorage.setItem('ritam_bharat_pos_security_token', qrToken);
        }
    }, [pathRestaurantId, pathTableId, queryTableId, qrToken]);

    const navigate = useNavigate();
    // Fetch Restaurant Details
    const { data: restaurant, isLoading: restaurantLoading, isError: restaurantError, error: restError, refetch: refetchRest } = useQuery({
        queryKey: ['restaurant', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return null;
            const res = await api.get(`/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        retry: 1
    });

    // Fetch Table Details
    const { data: table, isLoading: tableLoading } = useQuery({
        queryKey: ['table', tableId],
        queryFn: async () => {
            if (!tableId) return null;
            const res = await api.get(`/tables/${tableId}`);
            return res.data.data;
        },
        enabled: !!tableId,
        retry: 1
    });

    const isLoading = restaurantLoading || tableLoading;
    const isError = restaurantError;
    const error = restError;
    const refetch = refetchRest;

    if (isLoading) return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
            <p className="animate-pulse text-sm font-medium text-gray-400 tracking-widest uppercase">Connecting to Kitchen...</p>
        </div>
    );

    if (isError || (!isLoading && !restaurant && restaurantId)) return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <Flag size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Connection Issue</h2>
            <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                {error?.response?.status === 404
                    ? "We couldn't find this restaurant. Please check the QR code."
                    : "Having trouble connecting to the server. Please check your internet or try again."
                }
            </p>
            <button
                onClick={() => refetch()}
                className="btn-primary w-full max-w-xs py-4 px-8 rounded-xl font-bold transition-all active:scale-95"
            >
                Try Again
            </button>
        </div>
    );

    if (!restaurant) return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
            <p className="text-gray-400 mb-8">Please scan a table QR code to view the menu.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-black">
            {/* Sidebar */}
            <CustomerSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                restaurant={restaurant}
            />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 pr-4 pl-4 h-14 sm:h-16 flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-white/70 hover:text-white transition-colors active:scale-90"
                    >
                        <Menu size={24} />
                    </button>

                    <div
                        className="flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-all"
                        onClick={() => setIsRestaurantInfoOpen(true)}
                    >
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-black border border-white/10 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all overflow-hidden">
                            {restaurant.logo ? (
                                <img src={restaurant.logo} alt="logo" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                                restaurant.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <h1 className="font-bold text-sm leading-tight text-white group-hover:text-primary transition-colors">{restaurant.name}</h1>
                            {tableId && <span className="text-secondary text-[10px] sm:text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Table Attached</span>}
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-20 px-4">
                <Outlet context={{
                    restaurant,
                    tableId,
                    openRestaurantInfo: () => setIsRestaurantInfoOpen(true),
                }} />
            </main>

            <PWAInstallPrompt />

            {/* Unified Floating Action Menu */}
            <FloatingActionMenu
                restaurant={restaurant}
                tableId={tableId}
            />

            {/* Global Restaurant Info Modal */}
            <RestaurantInfoModal
                isOpen={isRestaurantInfoOpen}
                onClose={() => setIsRestaurantInfoOpen(false)}
                restaurant={restaurant}
            />

        </div>
    );
};


export default CustomerLayout;
