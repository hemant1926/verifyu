# Coin Redemption System for Subscription Plans

## Overview

The coin redemption system allows users to use their earned coins to pay for subscription plans, either partially or fully. This system provides flexibility in payment methods while maintaining proper validation and tracking.

## Database Schema Changes

### SubscriptionPlan Model
Added the following fields to support coin redemption:

- `coins_required` (Int?, nullable): Minimum number of coins required for this plan
- `max_coin_redemption_percent` (Float, default: 100.0): Maximum percentage of price that can be paid with coins
- `coin_value_ratio` (Float?, nullable): Value of 1 coin in currency units (e.g., 0.01 USD per coin)

### UserSubscription Model
Added fields to track coin usage in subscriptions:

- `coins_used` (Int?, default: 0): Number of coins used for this subscription
- `coin_discount` (Float?, default: 0): Discount amount from coins
- `final_price` (Float?): Final price after coin discount

## API Endpoints

### 1. Admin Subscription Plans API (`/api/admin/subscription-plans`)

**Updated Fields for Coin Redemption:**
- `coins_required`: Optional minimum coins required
- `max_coin_redemption_percent`: Percentage of price that can be paid with coins (0-100)
- `coin_value_ratio`: Value of one coin in the plan's currency

**Example Request:**
```json
{
  "name": "Premium Plan",
  "description": "Full access to all features",
  "price": 29.99,
  "currency": "USD",
  "duration_days": 30,
  "features": ["feature1", "feature2"],
  "coins_required": 100,
  "max_coin_redemption_percent": 50.0,
  "coin_value_ratio": 0.01
}
```

### 2. Mobile Subscription API (`/api/mobile/subscription`)

**New Parameters for Coin Redemption:**
- `use_coins` (boolean): Whether to use coins for payment
- `coins_to_use` (integer): Number of coins to use (optional)

**Example Request:**
```json
{
  "planId": "plan-uuid",
  "use_coins": true,
  "coins_to_use": 150,
  "paymentMethod": "card"
}
```

### 3. Coin Redemption Calculator API (`/api/mobile/coin-redemption/calculator`)

**GET Request:**
- Calculate coin redemption possibilities for all plans or a specific plan
- Returns user's coin balance and redemption calculations

**POST Request:**
- Test specific coin redemption scenarios
- Validate coin requirements and calculate final prices

**Example GET Request:**
```
GET /api/mobile/coin-redemption/calculator?planId=plan-uuid&currency=USD
```

**Example POST Request:**
```json
{
  "planId": "plan-uuid",
  "coins_to_use": 200
}
```

## How Coin Redemption Works

### 1. Plan Configuration
- **coins_required**: If set, users must use at least this many coins
- **max_coin_redemption_percent**: Limits how much of the price can be paid with coins
- **coin_value_ratio**: Defines the monetary value of each coin

### 2. Redemption Calculation
```javascript
// Maximum discount from coins
const maxDiscountAmount = (plan.price * plan.max_coin_redemption_percent) / 100;

// Maximum coins allowed
const maxCoinsAllowed = Math.floor(maxDiscountAmount / plan.coin_value_ratio);

// Actual coins to use (limited by user's available coins)
const coinsToUse = Math.min(requestedCoins, userAvailableCoins, maxCoinsAllowed);

// Calculate discount and final price
const coinDiscount = coinsToUse * plan.coin_value_ratio;
const finalPrice = Math.max(0, plan.price - coinDiscount);
```

### 3. Payment Methods
- **"coins"**: Full payment with coins (final_price = 0)
- **"coins_and_card"**: Partial payment with coins + card
- **"card"**: No coins used

### 4. User Coin Balance Updates
When coins are used for subscription:
```javascript
await prisma.userSteps.update({
  where: { userId: userId },
  data: {
    redeemed_coins: { increment: coinsToUse },
    available_coins: { decrement: coinsToUse },
    last_redeem_at: new Date()
  }
});
```

## Usage Examples

### Example 1: Plan with 50% Coin Redemption
```json
{
  "name": "Basic Plan",
  "price": 20.00,
  "max_coin_redemption_percent": 50.0,
  "coin_value_ratio": 0.01
}
```
- User can pay up to $10 (50%) with coins
- Maximum 1000 coins can be used (1000 * 0.01 = $10)

### Example 2: Plan Requiring Minimum Coins
```json
{
  "name": "Premium Plan",
  "price": 50.00,
  "coins_required": 200,
  "max_coin_redemption_percent": 100.0,
  "coin_value_ratio": 0.01
}
```
- User must use at least 200 coins
- Can pay up to $50 (100%) with coins
- Maximum 5000 coins can be used

### Example 3: Subscription with Coin Redemption
```json
{
  "planId": "premium-plan-uuid",
  "use_coins": true,
  "coins_to_use": 1000,
  "paymentMethod": "card"
}
```
- User wants to use 1000 coins
- System calculates discount and final price
- Updates user's coin balance automatically

## Error Handling

### Common Error Scenarios:
1. **Insufficient coins**: User doesn't have enough coins
2. **Below minimum requirement**: Plan requires more coins than user wants to use
3. **Exceeds maximum**: User wants to use more coins than allowed
4. **Plan doesn't support coins**: Plan has no coin redemption configuration

### Error Responses:
```json
{
  "success": false,
  "message": "This plan requires at least 200 coins for redemption",
  "data": {
    "required_coins": 200,
    "available_coins": 150
  }
}
```

## Best Practices

### For Admins:
1. Set reasonable `coin_value_ratio` (e.g., 0.01 USD per coin)
2. Use `max_coin_redemption_percent` to control revenue (e.g., 50% max)
3. Set `coins_required` for premium plans to encourage coin usage
4. Monitor coin redemption patterns

### For Users:
1. Check coin balance before subscribing
2. Use the calculator API to test different scenarios
3. Understand minimum coin requirements for specific plans
4. Consider partial coin redemption for better value

## Security Considerations

1. **Validation**: All coin amounts are validated against user's available balance
2. **Atomic Operations**: Coin deduction and subscription creation happen in the same transaction
3. **Audit Trail**: All coin redemptions are tracked in userSteps and subscription records
4. **Rate Limiting**: Consider implementing rate limits for coin redemption requests

## Monitoring and Analytics

Track the following metrics:
- Total coins redeemed per plan
- Average coin discount per subscription
- Most popular coin redemption amounts
- Revenue impact of coin redemptions
- User engagement with coin features

This system provides a flexible and user-friendly way to integrate coin redemption with subscription plans while maintaining proper validation and tracking.
