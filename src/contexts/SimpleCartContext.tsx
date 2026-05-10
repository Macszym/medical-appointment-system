/**
 * Context API - Zarządzanie koszykiem wizyt
 */

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from './SimpleAuthContext';

/**
 * Interfejs elementu koszyka (zgodny z backend Cart model)
 */
export interface CartItem {
  _id: string; // MongoDB ID
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  type: 'consultation' | 'checkup' | 'procedure' | 'followup';
  patientFirstName: string;
  patientLastName: string;
  patientGender: 'male' | 'female' | 'other';
  patientAge: number;
  patientNotes?: string;
  price: number;
  addedAt: Date;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  loading: boolean;
  addToCart: (item: Omit<CartItem, '_id' | 'doctorName' | 'doctorSpecialization' | 'endTime' | 'price' | 'addedAt'>) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { isAuthenticated, currentUser } = useAuth();

  // Wczytaj koszyk z API przy inicjalizacji (jeśli zalogowany)
  // WAŻNE: Dependency array zawiera currentUser?.id aby odświeżać koszyk gdy zmienia się użytkownik
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      // Wyczyść koszyk jeśli nie zalogowany
      setItems([]);
      setTotalPrice(0);
    }
  }, [isAuthenticated, currentUser?.id]);

  const refreshCart = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await apiClient.get('/cart');
      if (response.data.success) {
        const cartData = response.data.data;
        // Parsuj daty
        const parsedItems = cartData.items.map((item: any) => ({
          ...item,
          startTime: new Date(item.startTime),
          endTime: new Date(item.endTime),
          addedAt: new Date(item.addedAt),
        }));
        setItems(parsedItems);
        setTotalPrice(cartData.totalPrice);
      }
    } catch (error: any) {
      console.error('Failed to load cart:', error);
      // Jeśli 401, koszyk zostanie wyczyszczony przez useEffect gdy isAuthenticated zmieni się na false
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item: Omit<CartItem, '_id' | 'doctorName' | 'doctorSpecialization' | 'endTime' | 'price' | 'addedAt'>) => {
    if (!isAuthenticated) {
      console.error('Must be authenticated to add to cart');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/cart', {
        doctorId: item.doctorId,
        startTime: item.startTime.toISOString(),
        duration: item.duration,
        type: item.type,
        patientFirstName: item.patientFirstName,
        patientLastName: item.patientLastName,
        patientGender: item.patientGender,
        patientAge: item.patientAge,
        patientNotes: item.patientNotes,
      });

      if (response.data.success) {
        const cartData = response.data.data;
        const parsedItems = cartData.items.map((item: any) => ({
          ...item,
          startTime: new Date(item.startTime),
          endTime: new Date(item.endTime),
          addedAt: new Date(item.addedAt),
        }));
        setItems(parsedItems);
        setTotalPrice(cartData.totalPrice);
      }
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!isAuthenticated) {
      console.error('Must be authenticated to remove from cart');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.delete(`/cart/${itemId}`);

      if (response.data.success) {
        const cartData = response.data.data;
        const parsedItems = cartData.items.map((item: any) => ({
          ...item,
          startTime: new Date(item.startTime),
          endTime: new Date(item.endTime),
          addedAt: new Date(item.addedAt),
        }));
        setItems(parsedItems);
        setTotalPrice(cartData.totalPrice);
      }
    } catch (error: any) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      console.error('Must be authenticated to clear cart');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.delete('/cart');

      if (response.data.success) {
        setItems([]);
        setTotalPrice(0);
      }
    } catch (error: any) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: CartContextType = {
    items,
    itemCount: items.length,
    totalPrice,
    loading,
    addToCart,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
