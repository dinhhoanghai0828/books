// utils/authService.js
export async function getLoginRedirect(context) {
    // Check if the user is authenticated
    const token = context.req?.cookies?.token; // Example: token stored in cookies
  
    if (!token) {
      return false;
    }
  
    try {
      // You might want to verify the token here using your API
      // This example assumes a simple token check or validation
      return true; // Or make an API call to validate token if needed
    } catch (error) {
      return false;
    }
  }
  