export const buildOrderItem = (menuItem, item) => {
    let itemPrice = menuItem.price;
    let itemName = menuItem.name;
    let variant = null;
    let modifiers = [];

    if (item.variant) {
        const match = menuItem.variants?.find(v => v.name === item.variant.name);
        if (match) {
            itemPrice = match.price;
            itemName = `${menuItem.name} (${match.name})`;
            variant = { name: match.name, price: match.price };
        }
    }

    if (item.modifiers && item.modifiers.length > 0) {
        modifiers = item.modifiers.map(m => {
            const match = menuItem.modifiers?.find(mod => mod.name === m.name);
            const modPrice = match ? match.price : (m.price || 0);
            return { name: m.name, price: modPrice };
        });
        const modTotal = modifiers.reduce((sum, m) => sum + m.price, 0);
        itemPrice += modTotal;
        itemName += ` +${modifiers.map(m => m.name).join(' +')}`;
    }

    return {
        menuItem: menuItem._id,
        name: itemName,
        price: itemPrice,
        quantity: item.quantity,
        variant,
        modifiers: modifiers.length > 0 ? modifiers : undefined,
        specialInstructions: item.specialInstructions || ''
    };
};
