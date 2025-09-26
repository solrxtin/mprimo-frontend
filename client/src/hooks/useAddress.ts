import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface Address {
  _id?: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
}

const BASE_URL = 'http://localhost:5800/api/v1';

export const useAddress = () => {
  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);

  const addAddress = async (addressData: Address) => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/users/address`, {
        method: 'POST',
        body: JSON.stringify(addressData)
      });
      const data = await response.json();
      if (data.success) {
        setAddress(data.data);
      }
    } catch (error) {
      console.error('Error adding address:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async (addressData: Address) => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/users/address`, {
        method: 'PATCH',
        body: JSON.stringify(addressData)
      });
      const data = await response.json();
      if (data.success) {
        setAddress(data.data);
      }
    } catch (error) {
      console.error('Error updating address:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/users/address`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setAddress({
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          phoneNumber: '',
        });
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    address,
    loading,
    addAddress,
    updateAddress,
    deleteAddress,
    setAddress
  };
};