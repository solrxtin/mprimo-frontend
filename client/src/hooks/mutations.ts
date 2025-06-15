import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { User } from "@/types/user.type";
import { toastConfigError } from "@/app/config/toast.config";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import Vendor from "@/types/vendor.type";
import ICryptoWallet from "@/types/wallet.type";

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
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
): Promise<{ message: string; user: User }> => {
  const response = await fetch("http://localhost:5800/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message, toastConfigError);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useSignUp = () => {
  return useMutation<SignUpResponse, Error, SignUpData>({
    mutationFn: signUpUser,
  });
};

const verifyData = async (
  data: verificationData
): Promise<{ message: string; user: User }> => {
  const response = await fetch("http://localhost:5800/api/v1/auth/verify", {
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
    "http://localhost:5800/api/v1/auth/resend-verification",
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
  vendor: Vendor;
  has2faEnabled: boolean;
}> => {
  const response = await fetch("http://localhost:5800/api/v1/auth/login", {
    method: "POST",
    credentials: "include",
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

export const useLoginUser = () => {
  return useMutation({
    mutationFn: loginUser,
  });
};

const logoutUser = async (): Promise<{ message: string }> => {
  const response = await fetchWithAuth(
    "http://localhost:5800/api/v1/auth/logout",
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
    "http://localhost:5800/api/v1/auth/verify-password-reset-token",
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
    `http://localhost:5800/api/v1/auth/resend-password-reset-token`,
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
    "http://localhost:5800/api/v1/push/subscribe",
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
    `http://localhost:5800/api/v1/push/unsubscribe/${deviceId}`,
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
    `http://localhost:5800/api/v1/wallets/crypto/create-wallet`,
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
    "http://localhost:5800/api/v1/products/drafts",
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
    `http://localhost:5800/api/v1/products/drafts/${id}`,
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