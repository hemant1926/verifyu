# User API with Related Collections

## Overview

The User API has been enhanced to include data from related collections, allowing you to fetch comprehensive user information in a single request. This reduces the need for multiple API calls and improves performance.

## API Endpoint

```
GET /api/mobile/user
```

## Query Parameters

You can control which related collections to include using query parameters. All parameters default to `true` (include the data) unless explicitly set to `false`.

| Parameter | Description | Default | Related Collection |
|-----------|-------------|---------|-------------------|
| `includeSteps` | Include user steps and coin data | `true` | `userSteps` |
| `includeSubscriptions` | Include active subscriptions with plan details | `true` | `userSubscriptions` + `subscriptionPlan` |
| `includeRedemptions` | Include pending/approved coin redemptions | `true` | `coinRedemptions` |
| `includeHistory` | Include steps history (last 30 entries) | `true` | `stepsHistory` |
| `includeEmergency` | Include emergency contact details | `true` | `emergencyDetails` |
| `includeChildren` | Include child details | `true` | `childDetails` |
| `includeSupport` | Include customer support tickets | `true` | `customerSupport` |
| `includeFace` | Include AWS face recognition data | `true` | `awsFace` |

## Usage Examples

### 1. Get All User Data (Default)
```javascript
GET /api/mobile/user
```
Returns all user data with all related collections included.

### 2. Get Only Basic User Info
```javascript
GET /api/mobile/user?includeSteps=false&includeSubscriptions=false&includeRedemptions=false&includeHistory=false&includeEmergency=false&includeChildren=false&includeSupport=false&includeFace=false
```
Returns only the basic user information without any related collections.

### 3. Get User with Steps and Subscriptions Only
```javascript
GET /api/mobile/user?includeRedemptions=false&includeHistory=false&includeEmergency=false&includeChildren=false&includeSupport=false&includeFace=false
```
Returns user data with only steps and subscription information.

### 4. Get User with Coin-Related Data Only
```javascript
GET /api/mobile/user?includeSubscriptions=false&includeHistory=false&includeEmergency=false&includeChildren=false&includeSupport=false&includeFace=false
```
Returns user data with steps and coin redemptions only.

## Response Structure

```json
{
  "message": "User details fetched successfully",
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "mobileno": "+1234567890",
      // ... other user fields
      
      // Related collections (included based on query parameters)
      "userSteps": {
        "total_steps": 50000,
        "available_coins": 250,
        "redeemed_coins": 100,
        // ... other step fields
      },
      "userSubscriptions": [
        {
          "id": "subscription-uuid",
          "status": "active",
          "coins_used": 50,
          "coin_discount": 5.00,
          "final_price": 15.00,
          "plan": {
            "name": "Premium Plan",
            "price": 20.00,
            "features": ["feature1", "feature2"]
          }
        }
      ],
      "coinRedemptions": [
        {
          "id": "redemption-uuid",
          "coins_requested": 100,
          "amount_requested": 10.00,
          "status": "pending"
        }
      ],
      "stepsHistory": [
        {
          "date": "2024-01-15",
          "steps": 12000,
          "coins_earned": 6
        }
      ],
      "emergencyDetails": [
        {
          "name": "Emergency Contact",
          "phoneNumber": "+1234567890"
        }
      ],
      "childDetails": [
        {
          "firstname": "Child Name",
          "dateofbirth": "2010-01-01"
        }
      ],
      "customerSupport": [
        {
          "subjects": "Support Request",
          "message": "Need help with...",
          "status": 1
        }
      ],
      "awsFace": {
        "faceIds": ["face-id-1", "face-id-2"]
      }
    },
    "includedData": {
      "steps": true,
      "subscriptions": true,
      "redemptions": true,
      "history": true,
      "emergency": true,
      "children": true,
      "support": true,
      "face": true
    }
  }
}
```

## Related Collections Details

### 1. User Steps (`userSteps`)
Contains user's step tracking and coin data:
- `total_steps`: Total steps ever recorded
- `current_steps`: Current day's steps
- `total_coins`: Total coins earned
- `available_coins`: Coins available for redemption
- `redeemed_coins`: Coins already redeemed
- `is_redeem_blocked`: Whether redemption is blocked
- `last_redeem_at`: Last redemption timestamp

### 2. User Subscriptions (`userSubscriptions`)
Active subscriptions with plan details:
- `status`: Subscription status (active, expired, cancelled)
- `coins_used`: Number of coins used for this subscription
- `coin_discount`: Discount amount from coins
- `final_price`: Final price after coin discount
- `plan`: Complete plan information including coin redemption settings

### 3. Coin Redemptions (`coinRedemptions`)
Pending and approved coin redemption requests:
- `coins_requested`: Number of coins requested
- `amount_requested`: Cash amount requested
- `status`: Redemption status (pending, approved, rejected)
- `request_type`: Type of redemption (cash, gift_card, etc.)

### 4. Steps History (`stepsHistory`)
Last 30 days of step tracking:
- `date`: Date of the steps
- `steps`: Steps taken on that date
- `coins_earned`: Coins earned on that date

### 5. Emergency Details (`emergencyDetails`)
Emergency contact information:
- `name`: Contact person's name
- `relation`: Relationship to user
- `phoneNumber`: Emergency contact number

### 6. Child Details (`childDetails`)
User's children information:
- `firstname`, `lastname`: Child's name
- `dateofbirth`: Child's birth date
- `photo`: Child's photo path

### 7. Customer Support (`customerSupport`)
Support tickets and inquiries:
- `subjects`: Support ticket subject
- `message`: Support message
- `status`: Ticket status

### 8. AWS Face (`awsFace`)
Face recognition data:
- `faceIds`: Array of face recognition IDs

## Performance Considerations

1. **Selective Loading**: Use query parameters to load only needed data
2. **Pagination**: Some collections (like `stepsHistory`) are limited to recent entries
3. **Filtering**: Active subscriptions and pending redemptions are filtered for relevance
4. **Caching**: Consider implementing caching for frequently accessed data

## Error Handling

The API handles various error scenarios:
- Invalid JWT token
- User not found
- Database connection issues
- Missing related data (gracefully handled with null values)

## Best Practices

1. **Use Query Parameters**: Only include data you need to reduce response size
2. **Handle Null Values**: Some related collections might be null if not available
3. **Check Included Data**: Use the `includedData` object to know what data is available
4. **Cache Responses**: Consider caching user data for better performance
5. **Error Handling**: Always check the `success` field in the response

## Migration Notes

- The old hardcoded `setupData` has been removed
- Real `userSteps` data is now fetched from the database
- All related collections are now properly included
- Query parameters allow for flexible data fetching
