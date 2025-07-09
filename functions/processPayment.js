const functions = require('@google-cloud/functions-framework');
const axios = require('axios');

// PayMongo configuration - using environment variables
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY;
const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';

// Register HTTP function
functions.http('processPayment', async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount, currency = 'PHP', description, paymentMethod } = req.body;

    // Validate required fields
    if (!amount || !description || !paymentMethod) {
      res.status(400).json({ 
        error: 'Missing required fields: amount, description, paymentMethod' 
      });
      return;
    }

    // Convert amount to centavos (PayMongo expects amount in smallest currency unit)
    const amountInCentavos = Math.round(amount * 100);

    // Create payment intent
    const paymentIntentData = {
      data: {
        attributes: {
          amount: amountInCentavos,
          payment_method_allowed: [paymentMethod],
          payment_method_options: {
            card: {
              request_three_d_secure: 'automatic'
            }
          },
          currency: currency,
          description: description,
          capture_type: 'automatic'
        }
      }
    };

    const authHeader = 'Basic ' + Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64');

    const response = await axios.post(
      `${PAYMONGO_BASE_URL}/payment_intents`,
      paymentIntentData,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    // Return payment intent details
    res.json({
      success: true,
      paymentIntent: response.data.data,
      clientKey: response.data.data.attributes.client_key,
      publicKey: PAYMONGO_PUBLIC_KEY
    });

  } catch (error) {
    console.error('Payment processing error:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Payment processing failed',
      details: error.response?.data || error.message
    });
  }
}); 