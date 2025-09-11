let isRefreshing = false;

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };
  
    const response = await fetch(url, { 
      ...options, 
      headers,
      credentials: "include"
    });
  
    // If unauthorized (401) or forbidden (403), try refreshing token
    if ((response.status === 401 || response.status === 403) && !isRefreshing) {
      isRefreshing = true;
      
      try {
        const refreshResponse = await fetch("http://localhost:5800/api/v1/auth/refresh", { 
          method: "POST", 
          credentials: "include"
        });
  
        if (refreshResponse.ok) {
          isRefreshing = false;
          // Retry the original request
          return fetch(url, { 
            ...options, 
            headers,
            credentials: "include" 
          });
        } else {
          isRefreshing = false;
          // Only redirect if we're not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = "/login";
          }
          return Promise.reject("Authentication failed. Please log in again.");
        }
      } catch (error) {
        isRefreshing = false;
        if (!window.location.pathname.includes('/login')) {
          window.location.href = "/login";
        }
        return Promise.reject("Authentication error. Please log in again.");
      }
    }
  
    return response;
  };
  