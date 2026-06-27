// @desc    WhatsApp Webhook Verification (Meta requirement)
// @route   GET /api/whatsapp/webhook
// @access  Public
export const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
};

// @desc    Send a WhatsApp message (internal/test)
// @route   POST /api/whatsapp/send
// @access  Private (Admin/Staff)
export const sendMessage = async (req, res, next) => {
    try {
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).json({ success: false, message: 'to and message required' });
        }

        const phone = to.startsWith('+') ? to.slice(1) : to;
        const url = `https://graph.facebook.com/v22.0/${process.env.META_PHONE_ID}/messages`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phone,
                text: { body: message }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).json({ success: false, message: err });
        }

        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        next(error);
    }
};

// @desc    Handle incoming WhatsApp messages
// @route   POST /api/whatsapp/webhook
// @access  Public
export const handleIncomingMessage = async (req, res, next) => {
    try {
        const body = req.body;

        // Check if this is an event from a WhatsApp API
        if (body.object) {
            const change = body.entry?.[0]?.changes?.[0]?.value;

            // Log delivery status updates
            if (change?.statuses?.[0]) {
                const status = change.statuses[0];
                console.log(`WhatsApp status: ${status.status} | id: ${status.id} | recipient: ${status.recipient_id} | timestamp: ${status.timestamp}`);
                if (status.errors) {
                    console.error(`WhatsApp delivery ERROR:`, JSON.stringify(status.errors));
                }
                return res.sendStatus(200);
            }

            if (
                change?.messages?.[0]
            ) {
                const phoneNumberId = change.metadata?.phone_number_id;
                const from = change.messages[0].from;
                const msgBody = change.messages[0].text?.body || '';

                console.log(`WhatsApp message from ${from}: ${msgBody}`);

                // AI Chatbot Integration Point
                // 1. Check user state (e.g., is ordering?)
                // 2. Send to OpenAI / Dialogflow
                // 3. Process intent (See Menu, Order Item, Status)

                // For now, simple echo via console (Mock response logic would go here)

                // Live Chat: emit socket event for dashboard (requires phone->restaurant mapping)
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
};
