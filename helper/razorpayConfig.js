import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Creates a Razorpay instance with configuration
 * @returns {Object} Razorpay instance
 */
export function createRazorpayInstance() {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

/**
 * Verifies Razorpay payment signature
 * @param {string} razorpay_order_id - Order ID from Razorpay
 * @param {string} razorpay_payment_id - Payment ID from Razorpay
 * @param {string} razorpay_signature - Signature from Razorpay
 * @returns {boolean} - True if signature is valid
 */
export function verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        return expectedSignature === razorpay_signature;
    } catch (error) {
        console.error("Payment signature verification error:", error);
        return false;
    }
}

/**
 * Creates a Razorpay order for subscription payment
 * @param {Object} options - Order creation options
 * @param {number} options.amount - Amount in paise (smallest currency unit)
 * @param {string} options.currency - Currency code (default: INR)
 * @param {string} options.receipt - Receipt identifier
 * @param {Object} options.notes - Additional notes
 * @returns {Promise<Object>} - Razorpay order object
 */
export async function createRazorpayOrder(options) {
    try {
        const razorpay = createRazorpayInstance();
        
        const orderOptions = {
            amount: options.amount,
            currency: options.currency || "INR",
            receipt: options.receipt,
            notes: options.notes || {},
        };

        const order = await razorpay.orders.create(orderOptions);
        return {
            success: true,
            order: order,
        };
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Fetches Razorpay payment details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} - Payment details
 */
export async function fetchPaymentDetails(paymentId) {
    try {
        const razorpay = createRazorpayInstance();
        const payment = await razorpay.payments.fetch(paymentId);
        return {
            success: true,
            payment: payment,
        };
    } catch (error) {
        console.error("Razorpay payment fetch error:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Refunds a Razorpay payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in paise
 * @param {string} notes - Refund notes
 * @returns {Promise<Object>} - Refund details
 */
export async function refundPayment(paymentId, amount, notes = "Subscription refund") {
    try {
        const razorpay = createRazorpayInstance();
        const refund = await razorpay.payments.refund(paymentId, {
            amount: amount,
            notes: {
                reason: notes,
            },
        });
        return {
            success: true,
            refund: refund,
        };
    } catch (error) {
        console.error("Razorpay refund error:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Converts amount to paise (Razorpay's smallest currency unit)
 * @param {number} amount - Amount in currency units
 * @returns {number} - Amount in paise
 */
export function convertToPaise(amount) {
    return Math.round(amount * 100);
}

/**
 * Converts paise to currency units
 * @param {number} paise - Amount in paise
 * @returns {number} - Amount in currency units
 */
export function convertFromPaise(paise) {
    return paise / 100;
}
