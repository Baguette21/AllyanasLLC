// PayMongo API Configuration
export const paymongoConfig = {
  // Environment: 'test' for development, 'live' for production
  environment: 'test',
  
  // API Keys - replace with your actual keys
  publicKey: import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || 'pk_test_YOUR_PUBLIC_KEY_HERE',
  // Secret key should be stored in Google Cloud Secret Manager for security
  
  // API Base URLs
  baseUrl: 'https://api.paymongo.com/v1',
  
  // Supported payment methods
  paymentMethods: {
    cards: ['visa', 'mastercard', 'jcb'],
    ewallets: ['gcash', 'grab_pay'],
    onlineBanking: ['bpi', 'bdo', 'unionbank', 'metrobank', 'rcbc', 'chinabank'],
    otc: ['7eleven', 'cebuana', 'mlhuillier', 'palawan']
  },
  
  // Default currency
  currency: 'PHP',
  
  // Merchant info
  merchantInfo: {
    id: 'org_mEwjNsgvbBpK2ZouNuLXGit7',
    name: 'Allyanas Restaurant'
  }
};

// Helper function to get authorization header
export const getAuthHeader = (secretKey: string) => {
  return `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;
}; 