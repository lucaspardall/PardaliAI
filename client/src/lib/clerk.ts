
export const clerkConfig = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  
  get isConfigured() {
    return !!this.publishableKey && this.publishableKey !== 'pk_test_your_publishable_key_here';
  },
  
  get errorMessage() {
    if (!this.publishableKey) {
      return 'VITE_CLERK_PUBLISHABLE_KEY não configurado';
    }
    if (this.publishableKey === 'pk_test_your_publishable_key_here') {
      return 'Configure uma chave Clerk válida';
    }
    return null;
  }
};
