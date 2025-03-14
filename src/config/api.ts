// API configuration
const getApiBaseUrl = () => {
  // In a production environment, you might want to use a different URL
  // For local development, use the current hostname with the API port
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

export const API_BASE_URL = getApiBaseUrl();
