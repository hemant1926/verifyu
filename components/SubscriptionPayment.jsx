import { useState, useEffect } from 'react';

const SubscriptionPayment = ({ plan, userCoins, onSuccess, onError }) => {
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(null);

  // Calculate payment summary when coins usage changes
  useEffect(() => {
    if (plan && plan.coin_value_ratio && plan.max_coin_redemption_percent > 0) {
      const maxDiscountAmount = (plan.price * plan.max_coin_redemption_percent) / 100;
      const maxCoinsAllowed = Math.floor(maxDiscountAmount / plan.coin_value_ratio);
      const actualCoinsToUse = Math.min(coinsToUse, userCoins, maxCoinsAllowed);
      const discount = actualCoinsToUse * plan.coin_value_ratio;
      const finalPrice = Math.max(0, plan.price - discount);

      setPaymentSummary({
        originalPrice: plan.price,
        coinsToUse: actualCoinsToUse,
        discount: discount,
        finalPrice: finalPrice,
        maxCoinsAllowed: maxCoinsAllowed,
        canUseCoins: plan.coin_value_ratio > 0 && plan.max_coin_redemption_percent > 0
      });
    }
  }, [plan, coinsToUse, userCoins]);

  const handlePurchase = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      // Create Razorpay order
      const response = await fetch('/api/mobile/payment/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId: plan.id,
          use_coins: useCoins,
          coins_to_use: coinsToUse,
          payment_method: 'razorpay'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.data.order.amount,
        currency: data.data.order.currency,
        name: 'Your App Name',
        description: data.data.plan.name,
        order_id: data.data.order.id,
        handler: async function (razorpayResponse) {
          await verifyPayment(razorpayResponse, data.data.paymentIntent.id);
        },
        prefill: {
          name: data.data.user.name,
          email: data.data.user.email,
        },
        theme: {
          color: '#9C4EDF'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (razorpayResponse, paymentIntentId) => {
    try {
      const response = await fetch('/api/mobile/payment/razorpay/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
        onSuccess?.(data.data.subscription);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      onError?.(error.message);
    }
  };

  if (!plan) {
    return <div>No plan selected</div>;
  }

  return (
    <div className="subscription-payment">
      <div className="plan-details">
        <h3>{plan.name}</h3>
        <p>{plan.description}</p>
        <p className="price">₹{plan.price}</p>
        <p className="duration">{plan.duration_days} days</p>
      </div>

      {paymentSummary?.canUseCoins && (
        <div className="coin-redemption">
          <label>
            <input
              type="checkbox"
              checked={useCoins}
              onChange={(e) => setUseCoins(e.target.checked)}
            />
            Use coins for payment
          </label>
          
          {useCoins && (
            <div className="coin-input">
              <label>
                Coins to use (max: {paymentSummary.maxCoinsAllowed}):
                <input
                  type="number"
                  min="0"
                  max={paymentSummary.maxCoinsAllowed}
                  value={coinsToUse}
                  onChange={(e) => setCoinsToUse(parseInt(e.target.value) || 0)}
                />
              </label>
              <p>Available coins: {userCoins}</p>
            </div>
          )}
        </div>
      )}

      {paymentSummary && (
        <div className="payment-summary">
          <h4>Payment Summary</h4>
          <div className="summary-line">
            <span>Original Price:</span>
            <span>₹{paymentSummary.originalPrice}</span>
          </div>
          
          {useCoins && paymentSummary.coinsToUse > 0 && (
            <>
              <div className="summary-line">
                <span>Coins Used:</span>
                <span>{paymentSummary.coinsToUse}</span>
              </div>
              <div className="summary-line">
                <span>Coin Discount:</span>
                <span>-₹{paymentSummary.discount}</span>
              </div>
            </>
          )}
          
          <div className="summary-line total">
            <span>Final Price:</span>
            <span>₹{paymentSummary.finalPrice}</span>
          </div>
        </div>
      )}

      <button
        onClick={handlePurchase}
        disabled={loading || (useCoins && paymentSummary?.finalPrice === 0)}
        className="purchase-button"
      >
        {loading ? 'Processing...' : 
         paymentSummary?.finalPrice === 0 ? 'Activate with Coins' : 
         `Pay ₹${paymentSummary?.finalPrice || plan.price}`}
      </button>

      {paymentSummary?.finalPrice === 0 && (
        <p className="coin-only-notice">
          This subscription will be activated using coins only.
        </p>
      )}
    </div>
  );
};

export default SubscriptionPayment;
