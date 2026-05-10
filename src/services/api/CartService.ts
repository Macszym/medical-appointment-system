/**
 * Serwis koszyka - implementacja REST API
 *
 * Odpowiada za:
 * - Pobieranie koszyka użytkownika
 * - Dodawanie wizyt do koszyka
 * - Usuwanie wizyt z koszyka
 * - Czyszczenie koszyka
 * - Finalizację (checkout) - symulacja płatności i potwierdzenie wizyt
 */

import apiClient, { handleApiError } from '../apiClient';
import type { ICartService } from '../IDataService';
import type { Cart, AddToCartDTO, CheckoutResult } from '../../models';

class CartService implements ICartService {
  /**
   * Pobiera koszyk użytkownika
   *
   * @param userId - ID użytkownika
   * @returns Koszyk z listą pozycji
   */
  async getCart(userId: string): Promise<Cart> {
    try {
      const response = await apiClient.get<Cart>(`/cart/${userId}`);
      return this.parseCartDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Dodaje wizytę do koszyka
   *
   * WAŻNE: Wizyta zostaje tymczasowo "zarezerwowana" (status: reserved)
   * ale nie jest ostatecznie potwierdzona do czasu checkout
   *
   * @param userId - ID użytkownika
   * @param item - Dane wizyty do dodania
   * @returns Zaktualizowany koszyk
   */
  async addToCart(userId: string, item: AddToCartDTO): Promise<Cart> {
    try {
      const response = await apiClient.post<Cart>(`/cart/${userId}/items`, item);
      return this.parseCartDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Usuwa wizytę z koszyka
   *
   * WAŻNE: Usunięcie z koszyka zwalnia slot czasowy
   * (zmiana statusu z "reserved" na "available")
   *
   * @param userId - ID użytkownika
   * @param itemId - ID pozycji w koszyku
   * @returns Zaktualizowany koszyk
   */
  async removeFromCart(userId: string, itemId: string): Promise<Cart> {
    try {
      const response = await apiClient.delete<Cart>(`/cart/${userId}/items/${itemId}`);
      return this.parseCartDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Czyści cały koszyk
   *
   * @param userId - ID użytkownika
   */
  async clearCart(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/cart/${userId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Finalizuje koszyk - symulacja płatności i potwierdzenie wizyt
   *
   * PROCES:
   * 1. Symulacja płatności (zawsze sukces w tym projekcie)
   * 2. Zmiana statusu wizyt z "reserved" na "confirmed"
   * 3. Wyczyszczenie koszyka
   * 4. Zwrócenie informacji o potwierdzonych wizytach
   *
   * UWAGA: Mogą wystąpić konflikty jeśli w międzyczasie:
   * - Inny pacjent zarezerwował ten sam slot
   * - Lekarz dodał absencję
   * W takim przypadku te wizyty nie zostaną potwierdzone
   *
   * @param userId - ID użytkownika
   * @returns Wynik checkout z listą potwierdzonych wizyt i ewentualnymi błędami
   */
  async checkout(userId: string): Promise<CheckoutResult> {
    try {
      const response = await apiClient.post<CheckoutResult>(`/cart/${userId}/checkout`);

      // Parsowanie dat w potwierdzonych wizytach
      return {
        ...response.data,
        confirmedAppointments: response.data.confirmedAppointments.map((appointment) => ({
          ...appointment,
          startTime: new Date(appointment.startTime),
          endTime: new Date(appointment.endTime),
          createdAt: new Date(appointment.createdAt),
          updatedAt: new Date(appointment.updatedAt),
        })),
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pomocnicza metoda - parsuje stringi dat w koszyku
   */
  private parseCartDates(cart: any): Cart {
    return {
      ...cart,
      items: cart.items.map((item: any) => ({
        ...item,
        startTime: new Date(item.startTime),
        endTime: new Date(item.endTime),
        addedAt: new Date(item.addedAt),
      })),
      updatedAt: new Date(cart.updatedAt || cart.lastUpdated),
      createdAt: cart.createdAt ? new Date(cart.createdAt) : undefined,
    };
  }

  /**
   * Oblicza całkowitą cenę koszyka (helper method)
   * Używany lokalnie, nie wymaga zapytania do API
   */
  calculateTotalPrice(cart: Cart): number {
    return cart.items.reduce((total, item) => total + item.price, 0);
  }

  /**
   * Sprawdza czy wizyta jest już w koszyku (helper method)
   * Używany lokalnie do walidacji przed dodaniem
   */
  isInCart(cart: Cart, doctorId: string, startTime: Date): boolean {
    return cart.items.some(
      (item) =>
        item.doctorId === doctorId &&
        item.startTime.getTime() === startTime.getTime()
    );
  }
}

// Singleton
export const cartService = new CartService();
export default cartService;
