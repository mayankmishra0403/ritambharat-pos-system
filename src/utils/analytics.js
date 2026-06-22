/**
 * Google Analytics 4 Integration
 * Add your GA4 Measurement ID to .env as VITE_GA_MEASUREMENT_ID
 */

// Initialize GA4
export const initGA = () => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

    if (!measurementId) {
        console.warn('GA4 Measurement ID not found. Analytics disabled.');
        return;
    }

    // Load gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId, {
        send_page_view: false // We'll manually track page views
    });
};

// Track page view
export const trackPageView = (path) => {
    if (window.gtag) {
        window.gtag('event', 'page_view', {
            page_path: path,
            page_title: document.title
        });
    }
};

// Track custom events
export const trackEvent = (eventName, eventParams = {}) => {
    if (window.gtag) {
        window.gtag('event', eventName, eventParams);
    }
};

// Track errors
export const trackError = (error, errorInfo) => {
    if (window.gtag) {
        window.gtag('event', 'exception', {
            description: error.toString(),
            fatal: false,
            ...errorInfo
        });
    }
};

// Track user login
export const trackLogin = (method = 'email') => {
    trackEvent('login', { method });
};

// Track order placement
export const trackOrder = (orderId, total) => {
    trackEvent('purchase', {
        transaction_id: orderId,
        value: total,
        currency: 'INR'
    });
};
