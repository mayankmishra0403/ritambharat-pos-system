import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // Context provider for shopping cart functionality
    // Initialize cart from localStorage if available
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('ritam_bharat_pos_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (err) {
            return [];
        }
    });

    // Save to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('ritam_bharat_pos_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, quantity = 1, specialInstructions = '') => {
        let action = '';
        setCart(prev => {
            const existingItemIndex = prev.findIndex(cartItem =>
                cartItem._id === item._id &&
                cartItem.specialInstructions === specialInstructions
            );

            if (existingItemIndex > -1) {
                action = 'updated';
                const newCart = [...prev];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            } else {
                action = 'added';
                return [...prev, { ...item, quantity, specialInstructions }];
            }
        });

        // Toast outside the reducer
        // Note: 'action' variable won't work reliably here because setCart is async/batched but the 
        // reducer runs synchronously during render/commit? No, setState updater runs later.
        // Actually, for a simple click handler, reading 'cart' state directly is usually safe enough 
        // to decide the toast, OR just toast "Cart updated".
        // Let's rely on checking the cart state *before* the update for the message, 
        // but perform the update functionally for safety.

        const existingItem = cart.find(cartItem =>
            cartItem._id === item._id &&
            cartItem.specialInstructions === specialInstructions
        );

        if (existingItem) {
            toast.success(`Updated quantity for ${item.name}`);
        } else {
            toast.success(`Added ${item.name} to cart`);
        }
    };

    const removeFromCart = (itemId, specialInstructions) => {
        setCart(prev => prev.filter(item =>
            !(item._id === itemId && item.specialInstructions === specialInstructions)
        ));
        toast.success("Item removed");
    };

    const updateQuantity = (itemId, specialInstructions, change) => {
        setCart(prev => prev.map(item => {
            if (item._id === itemId && item.specialInstructions === specialInstructions) {
                const newQty = item.quantity + change;
                if (newQty < 1) return item; // Don't remove, just stop at 1. User use remove button for 0.
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('ritam_bharat_pos_cart');
    };

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
