import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import { getTaxInfo, calculateTax, calculateGstBreakdown } from '../utils/taxHelper.js';
import { sendWhatsAppToStaff } from '../services/whatsapp.service.js';
import { buildOrderItem } from '../utils/buildOrderItem.js';

// Simple NLP parser for voice orders
const parseVoiceTranscript = (transcript, menuItems) => {
    const parsedItems = [];
    const lowerTranscript = transcript.toLowerCase();

    // Extract quantities and item names
    // Patterns: "two burgers", "add three pizzas", "one cola", etc.
    const quantityWords = {
        'one': 1, 'a': 1, 'an': 1,
        'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };

    // Create a map of menu item names for fuzzy matching
    const menuItemMap = new Map();
    menuItems.forEach(item => {
        menuItemMap.set(item.name.toLowerCase(), item);
    });

    // Split transcript into potential items
    const words = lowerTranscript.split(/\s+/);

    for (let i = 0; i < words.length; i++) {
        const word = words[i];

        // Check if word is a quantity
        if (quantityWords[word]) {
            const quantity = quantityWords[word];

            // Look ahead for menu item name
            let matched = false;
            for (let j = i + 1; j < Math.min(i + 5, words.length); j++) {
                const potentialItemName = words.slice(i + 1, j + 1).join(' ');

                // Fuzzy match against menu items
                for (const [menuName, menuItem] of menuItemMap) {
                    if (menuName.includes(potentialItemName) || potentialItemName.includes(menuName)) {
                        parsedItems.push({
                            menuItem: menuItem._id,
                            quantity,
                            confidence: menuName === potentialItemName ? 1.0 : 0.7
                        });
                        i = j; // Skip processed words
                        matched = true;
                        break;
                    }
                }
                if (matched) break;
            }
            if (matched) continue;
        }
    }

    return parsedItems;
};

// @desc    Process voice order
// @route   POST /api/voice/order
// @access  Public
export const processVoiceOrder = async (req, res, next) => {
    try {
        const { transcript, restaurant, table, customerName, customerPhone } = req.body;

        if (!transcript) {
            return res.status(400).json({
                success: false,
                message: 'Voice transcript is required'
            });
        }

        // Validate restaurant and voice ordering feature
        const restaurantDoc = await Restaurant.findById(restaurant);
        if (!restaurantDoc || !restaurantDoc.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant not found or inactive'
            });
        }

        if (!restaurantDoc.features.voiceOrderingEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Voice ordering is not enabled for this restaurant'
            });
        }

        // Get available menu items
        const menuItems = await MenuItem.find({
            restaurant,
            isAvailable: true,
            isDeleted: false
        });

        if (menuItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No menu items available'
            });
        }

        // Parse voice transcript
        const parsedItems = parseVoiceTranscript(transcript, menuItems);

        if (parsedItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Could not identify any menu items from the transcript',
                suggestion: 'Please try again with clearer item names'
            });
        }

        // Calculate order totals
        let subtotal = 0;
        const orderItems = [];

        for (const item of parsedItems) {
            const menuItem = menuItems.find(m => m._id.toString() === item.menuItem.toString());
            if (menuItem) {
                const built = buildOrderItem(menuItem, item);
                const itemTotal = built.price * item.quantity;
                subtotal += itemTotal;
                orderItems.push(built);
            }
        }

        const taxInfo = await getTaxInfo(restaurant, restaurantDoc);
        const tax = calculateTax(subtotal, taxInfo.slabRate);
        const gstBreakdown = calculateGstBreakdown(subtotal, taxInfo.cgstRate, taxInfo.sgstRate, taxInfo.igstRate);
        const total = subtotal + tax;

        const order = await Order.create({
            restaurant,
            table,
            items: orderItems,
            subtotal,
            tax,
            total,
            gstBreakdown: {
                cgst: gstBreakdown.cgst,
                sgst: gstBreakdown.sgst,
                igst: gstBreakdown.igst,
                taxSlab: taxInfo.taxSlabId
            },
            customerName,
            customerPhone,
            specialInstructions: `Voice order: "${transcript}"`,
            orderSource: 'VOICE'
        });

        await order.populate('table');

        // Emit real-time event
        const io = req.app.get('io');
        if (io) io.to(`restaurant:${restaurant}`).emit('order:created', {
            order,
            message: `New voice order #${order.orderNumber}`
        });

        const frontendUrl = process.env.FRONTEND_URL || 'https://pos.ritambharat.software';
        sendWhatsAppToStaff(restaurant, `🆕 New Order${order.table?.name ? ` – Table ${order.table.name}` : ''}`, ['OWNER', 'WAITER'], `${frontendUrl}/accept/${order._id}`);

        res.status(201).json({
            success: true,
            message: 'Voice order created successfully',
            data: {
                order,
                parsedItems: orderItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity
                })),
                originalTranscript: transcript
            }
        });
    } catch (error) {
        next(error);
    }
};
