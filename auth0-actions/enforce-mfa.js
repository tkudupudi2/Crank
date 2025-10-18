/**
 * Auth0 Action: Enforce MFA for Crank Finance App
 * 
 * This action enforces Multi-Factor Authentication (MFA) for all users
 * attempting to log into the Crank Finance application.
 * 
 * Setup Instructions:
 * 1. Go to Auth0 Dashboard → Actions → Flows
 * 2. Select "Login" flow
 * 3. Create a new Action
 * 4. Copy this code into the Action
 * 5. Deploy the Action
 * 6. Add the Action to the Login flow
 */

exports.onExecutePostLogin = async (event, api) => {
  // Check if this is a login attempt for the Crank Finance app
  if (event.client.client_id === event.secrets.CRANK_CLIENT_ID) {
    
    // Option 1: Enforce MFA for all users (recommended for production)
    api.multifactor.enable('email');
    
    // Option 2: Enforce MFA only for users who have it enabled
    // Uncomment the lines below and comment out the line above
    /*
    if (event.user.app_metadata?.mfa_enabled === true) {
      api.multifactor.enable('email');
    }
    */
    
    // Option 3: Enforce MFA based on user role or other conditions
    // Uncomment and modify as needed
    /*
    const userRoles = event.user.app_metadata?.roles || [];
    if (userRoles.includes('admin') || userRoles.includes('user')) {
      api.multifactor.enable('email');
    }
    */
  }
};

/**
 * Optional: Handle MFA enrollment
 * This can be used to automatically enroll users in MFA
 */
exports.onContinuePostLogin = async (event, api) => {
  // This runs after MFA is completed
  console.log('MFA completed for user:', event.user.email);
  
  // You can add additional logic here, such as:
  // - Logging MFA events
  // - Updating user metadata
  // - Sending notifications
};
