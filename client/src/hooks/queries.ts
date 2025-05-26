
// Example query using TanStack Query (React Query)
import { toastConfigError } from '@/app/config/toast.config';
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

