/** Mock checkout is for local dev; hide in production builds unless explicitly enabled (e.g. staging). */
export const showMockCheckout =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_CHECKOUT === 'true';
