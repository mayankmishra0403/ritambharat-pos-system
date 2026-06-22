# Fix Auto KOT Print

## Problem
POSDashboard never receives `kds:new-order` socket events because it never calls `joinRestaurant(id)`, so its socket never joins the `restaurant:<id>` room.

## Changes

### 1. `src/pages/owner/POSDashboard.jsx`

**Line 23** — add `joinRestaurant` to destructuring:
```jsx
const { socket, joinRestaurant } = useSocket();
```

**Line 18** — fix extra indentation:
```jsx
import printKOT from '../../utils/printKOT';
```

**Lines 42-47** — add `joinRestaurant(id)` call:
```jsx
useEffect(() => {
    if (user?.restaurant) {
        const id = typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
        setRestaurantId(id);
        joinRestaurant(id);
    }
}, [user, joinRestaurant]);
```

**Lines 72-96** — add status filter (only print ACCEPTED orders), remove double-print, add error toast:
```jsx
useEffect(() => {
    if (!socket || !restaurantId || !printRestaurant) return;
    const handler = async ({ orderId }) => {
        try {
            const res = await api.get(`/orders/${orderId}`);
            if (!res.data.success) return;
            const order = res.data.data;
            if (order.status !== 'ACCEPTED') return;
            const html = printKOT(order, printRestaurant);
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:0;border:none';
            document.body.appendChild(iframe);
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();
            setTimeout(() => {
                try { iframe.contentWindow.print(); } catch(e) { console.error('KOT print failed:', e); }
                setTimeout(() => document.body.removeChild(iframe), 1000);
            }, 500);
        } catch (err) {
            console.error('Auto KOT print failed:', err);
            toast.error('KOT auto-print failed');
        }
    };
    socket.on('kds:new-order', handler);
    return () => { socket.off('kds:new-order', handler); };
}, [socket, restaurantId, printRestaurant]);
```

### 2. `src/utils/printKOT.js`

**Lines 132-139** — remove the inline `<script>` that also calls `window.print()` (causes double-print):

Remove:
```html
    <script>
    window.onload = function() {
        setTimeout(function() {
            window.print();
        }, 300);
        window.onafterprint = function() { window.close(); };
    };
    </script>
```
