# Razorpay Integration for Subscription Payments

## Overview

This guide explains how to integrate Razorpay payment gateway for subscription purchases with coin redemption support. The integration includes payment creation, verification, webhook handling, and automatic subscription activation.

## Prerequisites

### 1. Install Dependencies

```bash
npm install razorpay
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email Configuration (for notifications)
NODEMAILER_USERNAME=your_gmail_username
NODEMAILER_PASSWORD=your_gmail_app_password
```

### 3. Database Migration

Run the following command to update your database schema:

```bash
npx prisma db push
```

## API Endpoints

### 1. Create Razorpay Order

**Endpoint:** `POST /api/mobile/payment/razorpay/create-order`

Creates a Razorpay order for subscription payment with coin redemption support.

**Request Body:**
```json
{
  "planId": "plan-uuid",
  "use_coins": true,
  "coins_to_use": 100,
  "payment_method": "razorpay"
}
```

**Response:**
```json
{
  "message": "Payment order created successfully",
  "success": true,
  "data": {
    "order": {
      "id": "order_xyz",
      "amount": 2000,
      "currency": "INR",
      "receipt": "sub_user123_1234567890"
    },
    "paymentIntent": {
      "id": "payment-intent-uuid",
      "amount": 20.00,
      "currency": "INR",
      "coinDiscount": 5.00,
      "coinsUsed": 50
    },
    "plan": {
      "id": "plan-uuid",
      "name": "Premium Plan",
      "originalPrice": 25.00,
      "finalPrice": 20.00,
      "duration_days": 30
    }
  }
}
```

### 2. Verify Payment

**Endpoint:** `POST /api/mobile/payment/razorpay/verify`

Verifies Razorpay payment and creates subscription.

**Request Body:**
```json
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_abc",
  "razorpay_signature": "signature_hash",
  "payment_intent_id": "payment-intent-uuid"
}
```

**Response:**
```json
{
  "message": "Payment verified and subscription created successfully",
  "success": true,
  "data": {
    "subscription": {
      "id": "subscription-uuid",
      "status": "active",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-02-14T00:00:00.000Z",
      "paymentStatus": "paid",
      "coins_used": 50,
      "coin_discount": 5.00,
      "final_price": 20.00
    },
    "payment": {
      "id": "pay_abc",
      "amount": 2000,
      "currency": "INR",
      "status": "captured"
    }
  }
}
```

### 3. Webhook Handler

**Endpoint:** `POST /api/webhooks/razorpay`

Handles Razorpay webhook events for payment status updates.

**Supported Events:**
- `payment.captured` - Payment successfully captured
- `payment.failed` - Payment failed
- `order.paid` - Order payment completed
- `payment.authorized` - Payment authorized

## Frontend Integration

### 1. Create Payment Order

```javascript
// Create Razorpay order
const createOrder = async (planId, useCoins = false, coinsToUse = 0) => {
  const response = await fetch('/api/mobile/payment/razorpay/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      planId,
      use_coins: useCoins,
      coins_to_use: coinsToUse,
      payment_method: 'razorpay'
    })
  });

  const data = await response.json();
  return data;
};
```

### 2. Initialize Razorpay Checkout

```javascript
// Initialize Razorpay checkout
const initializeRazorpay = (orderData) => {
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: orderData.data.order.amount,
    currency: orderData.data.order.currency,
    name: 'Your App Name',
    description: orderData.data.plan.name,
    order_id: orderData.data.order.id,
    handler: async function (response) {
      // Verify payment on your backend
      await verifyPayment(response, orderData.data.paymentIntent.id);
    },
    prefill: {
      name: orderData.data.user.name,
      email: orderData.data.user.email,
    },
    theme: {
      color: '#9C4EDF'
    }
  };

  const razorpay = new Razorpay(options);
  razorpay.open();
};
```

### 3. Verify Payment

```javascript
// Verify payment
const verifyPayment = async (razorpayResponse, paymentIntentId) => {
  const response = await fetch('/api/mobile/payment/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
      payment_intent_id: paymentIntentId
    })
  });

  const data = await response.json();
  
  if (data.success) {
    // Payment successful, redirect to success page
    window.location.href = '/subscription/success';
  } else {
    // Payment failed, show error
    alert('Payment failed: ' + data.message);
  }
};
```

## Complete Frontend Example

```javascript
// Complete subscription purchase flow
const purchaseSubscription = async (planId, useCoins = false, coinsToUse = 0) => {
  try {
    // Step 1: Create Razorpay order
    const orderResponse = await createOrder(planId, useCoins, coinsToUse);
    
    if (!orderResponse.success) {
      throw new Error(orderResponse.message);
    }

    // Step 2: Initialize Razorpay checkout
    initializeRazorpay(orderResponse);
    
  } catch (error) {
    console.error('Subscription purchase error:', error);
    alert('Error: ' + error.message);
  }
};

// Usage
purchaseSubscription('plan-uuid', true, 100); // With 100 coins
purchaseSubscription('plan-uuid', false, 0); // Without coins
```

## Coin Redemption Integration

### 1. Calculate Coin Discount

```javascript
// Calculate how much discount coins can provide
const calculateCoinDiscount = (planPrice, availableCoins, coinValueRatio, maxRedemptionPercent) => {
  const maxDiscountAmount = (planPrice * maxRedemptionPercent) / 100;
  const maxCoinsAllowed = Math.floor(maxDiscountAmount / coinValueRatio);
  const coinsToUse = Math.min(availableCoins, maxCoinsAllowed);
  const discount = coinsToUse * coinValueRatio;
  const finalPrice = Math.max(0, planPrice - discount);
  
  return {
    coinsToUse,
    discount,
    finalPrice,
    maxCoinsAllowed
  };
};
```

### 2. Display Payment Summary

```javascript
// Show payment summary with coin discount
const showPaymentSummary = (plan, userCoins, coinValueRatio) => {
  const calculation = calculateCoinDiscount(
    plan.price, 
    userCoins, 
    coinValueRatio, 
    plan.max_coin_redemption_percent
  );
  
  return `
    <div class="payment-summary">
      <h3>Payment Summary</h3>
      <p>Plan: ${plan.name}</p>
      <p>Original Price: ₹${plan.price}</p>
      <p>Coins Used: ${calculation.coinsToUse}</p>
      <p>Coin Discount: ₹${calculation.discount}</p>
      <p><strong>Final Price: ₹${calculation.finalPrice}</strong></p>
    </div>
  `;
};
```

## Webhook Configuration

### 1. Razorpay Dashboard Setup

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Create a new webhook
3. Set the webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
4. Select events: `payment.captured`, `payment.failed`, `order.paid`, `payment.authorized`
5. Copy the webhook secret and add it to your environment variables

### 2. Webhook Security

The webhook handler includes signature verification to ensure requests are from Razorpay:

```javascript
// Signature verification is automatically handled
const expectedSignature = crypto
  .createHmac("sha256", webhookSecret)
  .update(body)
  .digest("hex");
```

## Error Handling

### Common Error Scenarios

1. **Payment Failed**
   - User cancels payment
   - Insufficient funds
   - Network issues

2. **Verification Failed**
   - Invalid signature
   - Amount mismatch
   - Payment not captured

3. **Subscription Already Exists**
   - User already has active subscription
   - Duplicate payment attempt

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "data": {
    "error_code": "PAYMENT_FAILED",
    "details": "Additional error details"
  }
}
```

## Testing

### 1. Test Cards (Razorpay Test Mode)

```
Success: 4111 1111 1111 1111
Failure: 4000 0000 0000 0002
```

### 2. Test Webhook

Use Razorpay's webhook testing tool or ngrok for local testing:

```bash
ngrok http 3000
# Use the ngrok URL in Razorpay webhook settings
```

## Production Checklist

- [ ] Set up Razorpay production account
- [ ] Configure production webhook URL
- [ ] Update environment variables with production keys
- [ ] Test payment flow end-to-end
- [ ] Set up monitoring and logging
- [ ] Configure email notifications for failed payments
- [ ] Set up refund handling

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **Always verify payment signatures** on backend
3. **Use HTTPS** for all webhook endpoints
4. **Validate webhook signatures** to prevent fraud
5. **Store payment intents** for audit trails
6. **Implement rate limiting** for payment endpoints

## Monitoring and Analytics

Track the following metrics:
- Payment success rate
- Average payment processing time
- Coin redemption usage
- Failed payment reasons
- Subscription conversion rate

This integration provides a complete subscription payment system with Razorpay, including coin redemption support and automatic subscription activation.
