import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { User } from "@/types/user.type";
import { toastConfigError } from "@/app/config/toast.config";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import {IVendor} from "@/types/vendor.type";
import ICryptoWallet from "@/types/wallet.type";
import { getApiUrl } from "@/config/api";

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string
  phoneNumber: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface verificationData {
  code: string;
}

interface SignUpResponse {
  message: string;
  user: User;
}

const signUpUser = async (
  data: SignUpData
): Promise<{ message: string; user: User; accessToken?: string; refreshToken?: string }> => {
  const response = await fetch(getApiUrl("auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message, toastConfigError);
    throw new Error(errorData.message);
  }

  const responseData = await response.json();
  
  // Store tokens in localStorage if provided
  if (responseData.accessToken) {
    localStorage.setItem('accessToken', responseData.accessToken);
  }
  if (responseData.refreshToken) {
    localStorage.setItem('refreshToken', responseData.refreshToken);
  }

  return responseData;
};

export const useSignUp = () => {
  return useMutation<SignUpResponse, Error, SignUpData>({
    mutationFn: signUpUser,
  });
};

const verifyData = async (
  data: verificationData
): Promise<{ message: string; user: User }> => {
  const response = await fetch(getApiUrl("auth/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: verifyData,
  });
};

const resendVerification = async (
  email: string
): Promise<{ message: string }> => {
  const response = await fetch(
    getApiUrl("auth/resend-verification"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: resendVerification,
  });
};

const loginUser = async (
  data: LoginData
): Promise<{
  message: string;
  user: User;
  vendor: IVendor;
  has2faEnabled: boolean;
  accessToken?: string;
  refreshToken?: string;
}> => {
  try {
    const response = await fetch(getApiUrl("auth/login"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(errorData.message, toastConfigError);
      throw new Error(errorData.message);
    }

    const responseData = await response.json();
    
    // Store tokens in localStorage if provided
    if (responseData.accessToken) {
      localStorage.setItem('accessToken', responseData.accessToken);
    }
    if (responseData.refreshToken) {
      localStorage.setItem('refreshToken', responseData.refreshToken);
    }

    return responseData;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      toast.error('Unable to connect to server. Please check your connection.', toastConfigError);
      throw new Error('Unable to connect to server');
    }
    throw error;
  }
};

export const useLoginUser = () => {
  return useMutation({
    mutationFn: loginUser,
  });
};

const logoutUser = async (): Promise<{ message: string }> => {
  const response = await fetchWithAuth(
    getApiUrl("auth/logout"),
    {
      method: "POST",
    }
  );

  const data = await response.json();
  console.log("Logout data is: ", data);

  if (!response.ok) {
    toast.error(data.message);
    throw new Error(data.message);
  }

  // Clear tokens from localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  return data;
};

export const useLogoutUser = () => {
  return useMutation({
    mutationFn: logoutUser,
  });
};

const verifyPasswordResetToken = async (data: {
  code: string;
}): Promise<{ message: string }> => {
  const response = await fetch(
    getApiUrl("auth/verify-password-reset-token"),
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useVerifyEmailForPasswordChange = () => {
  return useMutation({
    mutationFn: verifyPasswordResetToken,
  });
};

const resendPasswordResentToken = async (data: {
  email: string;
}): Promise<{ message: string }> => {
  const response = await fetch(
    getApiUrl("auth/resend-password-reset-token"),
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useResendPasswordResetToken = () => {
  return useMutation({
    mutationFn: resendPasswordResentToken,
  });
};

const subscribeToPushNotification = async (subscription: {
  subscription: any; 
  deviceId?: string | null
}): Promise<{ message: string, deviceId: any }> => {
  const response = await fetchWithAuth(
    getApiUrl("push/subscribe"),
    {
      method: "POST",
      body: JSON.stringify(subscription),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.log(errorData);
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useSubscribeToPush = () => {
  return useMutation({
    mutationFn: subscribeToPushNotification,
  });
};


const unsubscribeFromPushNotification = async (deviceId: string): Promise<{ message: string }> => {
  const response = await fetchWithAuth(
    getApiUrl(`push/unsubscribe/${deviceId}`),
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useUnsubscribeFromPush = () => {
  return useMutation({
    mutationFn: unsubscribeFromPushNotification,
  });
};

const createWallet = async (): Promise<{wallet: ICryptoWallet}> => {
  const response = await fetchWithAuth(
    getApiUrl("wallets/crypto/create-wallet"),
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
}

export const useCreateWallet = () => {
  return useMutation({
    mutationFn: createWallet,
  });
}


const saveDraft = async (draft: any): Promise<{ message: string }> => {
  const response = await fetchWithAuth(
    getApiUrl("products/drafts"),
    {
      method: "POST",
      body: JSON.stringify(draft),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to save draft");
  }

  return response.json();
};

export const useSaveDraft = () => {
  return useMutation({
    mutationFn: saveDraft,
  });
};

const deleteDraft = async (id: string): Promise<{ message: string }> => {
  const response = await fetchWithAuth(
    getApiUrl(`products/drafts/${id}`),
    {method: "DELETE"}
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete draft");
  }

  return response.json();
};

export const useDeleteDraft = (): UseMutationResult<
  { message: string }, 
  Error,               
  string               
> => {
  return useMutation({
    mutationFn: deleteDraft,
    onSettled: () => {
      console.log("Delete draft mutation settled");
    }
  });
};

// Toggle helpful mutation
const toggleHelpful = async ({ productId, reviewId }: { productId: string; reviewId: string }) => {
  const response = await fetchWithAuth(
    getApiUrl(`product/${productId}/review/${reviewId}/helpful`),
    { method: 'PATCH' }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
  return response.json();
};

export const useToggleHelpful = () => {
  return useMutation({
    mutationFn: toggleHelpful,
  });
};

// Add vendor response mutation
const addVendorResponse = async ({ 
  productId, 
  reviewId, 
  vendorId,
  response
}: { 
  productId: string; 
  reviewId: string; 
  vendorId: string;
  response: string; 
}) => {
  const res = await fetchWithAuth(
    getApiUrl(`product/${productId}/review/${reviewId}/response`),
    {

      method: 'POST',
      body: JSON.stringify({ response, vendorId }),
    }
  );
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message);
  }
  return res.json();
};

export const useAddVendorResponse = () => {
  return useMutation({
    mutationFn: addVendorResponse,
  });
};


const makeBid = async (
  productId: string,
  amount: number
): Promise<{ success: boolean; message: string; bidAmountUSD: number }> => {
  const response = await fetchWithAuth(getApiUrl(`products/${productId}/bids`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useMakeBid = () => {
  return useMutation({
    mutationFn: ({ productId, amount }: { productId: string; amount: number }) =>
      makeBid(productId, amount),
  });
};

// Update draft mutation
const updateDraft = async ({ id, draft }: { id: string; draft: any }): Promise<{ message: string }> => {
  const response = await fetchWithAuth(
    getApiUrl(`products/drafts/${id}`),
    {
      method: "PUT",
      body: JSON.stringify(draft),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update draft");
  }

  return response.json();
};

export const useUpdateDraft = () => {
  return useMutation({
    mutationFn: updateDraft,
  });
};

// Create product mutation
const createProduct = async (productData: any): Promise<{ product: any; message: string }> => {
  const response = await fetchWithAuth(
    getApiUrl("products"),
    {
      method: "POST",
      body: JSON.stringify(productData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create product");
  }

  return response.json();
};

export const useCreateProduct = () => {
  return useMutation({
    mutationFn: createProduct,
  });
};


const createAdvertisement = async (data: {
  vendorId: string;
  productId: string;
  title: string;
  description: string;
  imageUrl: string;
  adType: string;
}) => {
  const { vendorId, ...body } = data;
  const response = await fetchWithAuth(getApiUrl(`advertisements/${vendorId}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create advertisement');
  }
  return response.json();
};

export const useCreateAdvertisement = () => {
  return useMutation({
    mutationFn: createAdvertisement,
  });
};

// Stripe Elements mutations
const createPaymentIntent = async (data: {
  vendorId: string;
  priceId: string;
}) => {
  const response = await fetchWithAuth(getApiUrl("stripe/create-payment-intent"), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create payment intent');
  }
  return response.json();
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: createPaymentIntent,
  });
};

// Add payment method mutation (updated for Stripe)
const addPaymentMethod = async (data: {
  type: 'card' | 'bank_transfer' | 'mobile_money';
  metadata?: {
    last4?: string;
    brand?: string;
    bankName?: string;
    accountNumber?: string;
  };
  isDefault: boolean;
  paymentMethodId?: string;
  paystackAuthorizationCode?: string;
}) => {
  const response = await fetchWithAuth(getApiUrl('wallets/payment-methods'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add payment method');
  }
  return response.json();
};

export const useAddPaymentMethod = () => {
  return useMutation({
    mutationFn: addPaymentMethod,
  });
};

// Wallet top-up mutation
const initiateTopUp = async (data: {
  amount: number;
  method: 'card' | 'bank_transfer';
  paymentMethodId?: string;
}) => {
  const response = await fetchWithAuth(getApiUrl('wallets/topup'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to initiate top-up');
  }
  return response.json();
};

export const useInitiateTopUp = () => {
  return useMutation({
    mutationFn: initiateTopUp,
  });
};

// Create setup intent for payment method
const createSetupIntent = async () => {
  const response = await fetchWithAuth(getApiUrl('wallets/setup-intent'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create setup intent');
  }
  return response.json();
};

export const useCreateSetupIntent = () => {
  return useMutation({
    mutationFn: createSetupIntent,
  });
};

// Buy Now mutations
const buyNow = async (data: {
  productId: string;
  variantId: string;
  optionId?: string;
  quantity?: number;
}) => {
  const response = await fetchWithAuth(getApiUrl('checkout/buy-now'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to initiate buy now');
  }
  return response.json();
};

export const useBuyNow = () => {
  return useMutation({
    mutationFn: buyNow,
  });
};

const createBuyNowPaymentIntent = async (data: {
  productId: string;
  variantId: string;
  optionId?: string;
  quantity?: number;
  paymentMethod: string;
  tokenType?: string;
}) => {
  const response = await fetchWithAuth(getApiUrl('checkout/buy-now/payment-intent'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create payment intent');
  }
  return response.json();
};

export const useCreateBuyNowPaymentIntent = () => {
  return useMutation({
    mutationFn: createBuyNowPaymentIntent,
  });
};

// Delete payment method mutation
const deletePaymentMethod = async (paymentMethodId: string) => {
  const response = await fetchWithAuth(getApiUrl(`wallets/payment-methods/${paymentMethodId}`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete payment method');
  }
  return response.json();
};

export const useDeletePaymentMethod = () => {
  return useMutation({
    mutationFn: deletePaymentMethod,
  });
};

// Create order from buy now
const createBuyNowOrder = async (data: {
  validatedItems: Array<{
    productId: string;
    variantId?: string;
    optionId?: string;
    quantity?: number;
  }>;
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
    userCurrency?: string;
  };
  paymentData: any;
  address: any;
  isBuyNow?: boolean;
}) => {
  const response = await fetchWithAuth(getApiUrl('orders/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...data, isBuyNow: true })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create order');
  }
  return response.json();
};

export const useCreateBuyNowOrder = () => {
  return useMutation({
    mutationFn: createBuyNowOrder,
  });
};

// Update shipping status mutation
const updateShippingStatus = async (data: {
  orderId: string;
  shippingStatus: string;
  shipmentId?: string;
}) => {
  const response = await fetchWithAuth(getApiUrl(`orders/${data.orderId}/status`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      shippingStatus: data.shippingStatus,
      shipmentId: data.shipmentId
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update shipping status');
  }
  return response.json();
};

export const useUpdateShippingStatus = () => {
  return useMutation({
    mutationFn: updateShippingStatus,
  });
};