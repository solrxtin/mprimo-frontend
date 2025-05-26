export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };
  
    const response = await fetch(url, { 
      ...options, 
      headers,
      credentials: "include" // This ensures cookies are sent with the request
    });
  
    // If unauthorized (401) or forbidden (403), try refreshing token
    if (response.status === 401 || response.status === 403) {
      try {
        // Call your refresh endpoint
        const refreshResponse = await fetch("http://localhost:5800/api/v1/auth/refresh", { 
          method: "POST", 
          credentials: "include" // Include cookies in refresh request
        });
  
        if (refreshResponse.ok) {
          
          // Retry the original request (cookies will be sent automatically)
          return fetch(url, { 
            ...options, 
            headers,
            credentials: "include" 
          });
        } else {
          // Refresh failed, redirect to login
          console.error("Token refresh failed, redirecting to login...");
          window.location.href = "/login";
          return Promise.reject("Authentication failed. Please log in again.");
        }
      } catch (error) {
        console.error("Error during token refresh:", error);
        window.location.href = "/login";
        return Promise.reject("Authentication error. Please log in again.");
      }
    }
  
    return response;
  };
  