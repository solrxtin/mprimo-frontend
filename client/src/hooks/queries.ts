
// Example query using TanStack Query (React Query)
import { toastConfigError } from '@/app/config/toast.config';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const googleLogin = async () => {
  const response = await fetch('http://localhost:5800/api/v1/auth/google', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    toast.error('Google authentication failed!', toastConfigError);
    // throw new Error('Network response was not ok');
    return null;
  }
  return response.json();
};

export const useGoogleLogin = () => {
  return useQuery({
    queryKey: ['google'],
    queryFn: googleLogin,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    enabled: false,
    retry: false
  });
};

// Fetch categories
const fetchCategories = async () => {
  const response = await fetchWithAuth('http://localhost:5800/api/v1/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  const data = await response.json();
  console.log("Raw API response:", data);
  return data; // Return the entire response object
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 1 day
    refetchOnWindowFocus: false,
    retry: 1
  });
};

const fetchUserSubscriptions = async () => {
  const response = await fetchWithAuth('http://localhost:5800/api/v1/push/user');
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions');
  }
  const data = await response.json();
  console.log("User subscriptions:", data);
  return data;
};

export const useUserSubscriptions = () => {
  return useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: fetchUserSubscriptions,
    refetchOnWindowFocus: false,
    retry: 1
  });
};

const fetchProductBySlug = async (slug: string) => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/products/slug/${slug}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  const data = await response.json();
  console.log("Product data:", data);
  return data;
};

export const useFetchProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
    refetchOnWindowFocus: false,
    retry: 1
  });
};

const fetchProductAnalytics = async (
  entityType: string,
  entityId: string,
  timeframe = "daily"
) => {
  const response = await fetchWithAuth(
    `http://localhost:5800/api/v1/analytics/${entityType}/${entityId}?timeframe=${timeframe}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch product analytics");
  }
  const data = await response.json();
  console.log("Product analytics:", data);
  return data;
};

export const useFetchProductAnalytics = (
  entityId: string,
  timeframe = "daily"
) => {
  return useQuery({
    queryKey: ["product-analytics", entityId, timeframe],
    queryFn: () => fetchProductAnalytics("product", entityId, timeframe),
    enabled: !!entityId,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};


const fetchVendorProducts = async (vendorId: string) => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/products/vendor/${vendorId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions');
  }
  const data = await response.json();
  console.log("Vendor products:", data);
  return data.products;
};

export const useVendorProducts = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorProducts', vendorId],
    queryFn: () => fetchVendorProducts(vendorId),
    enabled: !!vendorId, // ensures it won't run if vendorId is undefined/null
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchVendorAnalytics= async (vendorId: string, range="7days") => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/dashboard/vendors/${vendorId}/analytics?range=${range}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions');
  }
  const data = await response.json();
  console.log("Vendor analytics:", data);
  return data;
};

export const useVendorAnalytics= (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorAnalytics', vendorId],
    queryFn: () => fetchVendorAnalytics(vendorId),
    enabled: !!vendorId, // ensures it won't run if vendorId is undefined/null
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchUserNotifications = async() => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/notifications`);
  if (!response.ok) {
    throw new Error('Failed to fetch user notifications');
  }
  const data = await response.json();
  return data.notifications;
};

export const useUserNotifications = () => {
  return useQuery({
    queryKey: ['userNotifications'],
    queryFn: fetchUserNotifications,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchVendorOrders = async (vendorId: string) => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/orders/vendors/${vendorId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor orders');
  }
  const data = await response.json();
  return data;
};

export const useVendorOrders = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorOrders', vendorId],
    queryFn: () => fetchVendorOrders(vendorId),
    refetchOnWindowFocus: false,
    retry: 1,
  });
};