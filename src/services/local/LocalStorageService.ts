/**
 * Lokalna implementacja storage używająca localStorage i JSON
 *
 * Implementacja korzystająca z localStorage, która:
 * - Przechowuje dane w localStorage przeglądarki
 * - Ładuje początkowe dane z pliku mockData.json
 * - Symuluje opóźnienia sieciowe (jak prawdziwe API)
 * - Implementuje te same interfejsy co prawdziwy backend
 *
 * UWAGA: Dane są persystowane tylko w localStorage.
 * Po wyczyszczeniu localStorage dane wrócą do stanu początkowego z mockData.json
 */

import type {
  User,
  Appointment,
  Availability,
  Absence,
  Cart,
  CartItem,
} from '../../models';

/**
 * Rating interface dla lokalnego storage
 */
interface LocalRating {
  _id: string;
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  rating: number;
  comment?: string;
  doctorReply?: string;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Struktura danych w localStorage
 */
interface LocalData {
  users: User[];
  availabilities: Availability[];
  absences: Absence[];
  appointments: Appointment[];
  carts: Cart[];
  ratings: LocalRating[];
}

// Serwis lokalnego storage (localStorage)
class LocalStorageService {
  private readonly STORAGE_KEY = 'medical_app_data';
  private readonly VERSION_KEY = 'medical_app_data_version';
  private readonly CURRENT_VERSION = '3.0'; // Zwiększ to gdy mockData.json się zmieni
  private data: LocalData | null = null;

  /**
   * Inicjalizuje storage - ładuje dane z localStorage lub mockData.json
   */
  async initialize(): Promise<void> {
    const storedVersion = localStorage.getItem(this.VERSION_KEY);
    const storedData = localStorage.getItem(this.STORAGE_KEY);

    // Jeśli wersja się nie zgadza lub brak danych, przeładuj z mockData.json
    if (storedData && storedVersion === this.CURRENT_VERSION) {
      // Dane są aktualne
      this.data = JSON.parse(storedData);
      this.parseDates();
    } else {
      // Przeładuj dane z mockData.json (nowa wersja lub brak danych)
      console.log('Reloading data from mockData.json (version mismatch or missing data)');
      await this.loadMockData();
    }
  }

  /**
   * Ładuje początkowe dane z pliku mockData.json
   */
  private async loadMockData(): Promise<void> {
    try {
      const response = await fetch('/data/mockData.json');
      this.data = await response.json();
      this.parseDates();
      this.save();
    } catch (error) {
      console.error('Failed to load mock data:', error);
      // Fallback - puste dane
      this.data = {
        users: [],
        availabilities: [],
        absences: [],
        appointments: [],
        carts: [],
        ratings: [],
      };
      this.save();
    }
  }

  /**
   * Parsuje stringi dat na obiekty Date
   */
  private parseDates(): void {
    if (!this.data) return;

    // Parse dates in users
    this.data.users = this.data.users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
    }));

    // Parse dates in availabilities
    this.data.availabilities = this.data.availabilities.map((avail: any) => ({
      ...avail,
      startDate: avail.startDate ? new Date(avail.startDate) : undefined,
      endDate: avail.endDate ? new Date(avail.endDate) : undefined,
      specificDate: avail.specificDate ? new Date(avail.specificDate) : undefined,
      createdAt: new Date(avail.createdAt),
      updatedAt: new Date(avail.updatedAt),
    }));

    // Parse dates in absences
    this.data.absences = this.data.absences.map((absence: any) => ({
      ...absence,
      startDate: new Date(absence.startDate),
      endDate: new Date(absence.endDate),
      createdAt: new Date(absence.createdAt),
      updatedAt: new Date(absence.updatedAt),
    }));

    // Parse dates in appointments
    this.data.appointments = this.data.appointments.map((app: any) => ({
      ...app,
      startTime: new Date(app.startTime),
      endTime: new Date(app.endTime),
      createdAt: new Date(app.createdAt),
      updatedAt: new Date(app.updatedAt),
      cancelledAt: app.cancelledAt ? new Date(app.cancelledAt) : undefined,
    }));

    // Parse dates in carts
    this.data.carts = this.data.carts.map((cart: any) => ({
      ...cart,
      items: cart.items.map((item: any) => ({
        ...item,
        startTime: new Date(item.startTime),
        endTime: new Date(item.endTime),
        addedAt: new Date(item.addedAt),
      })),
      updatedAt: new Date(cart.updatedAt),
    }));

    // Parse dates in ratings
    this.data.ratings = (this.data.ratings || []).map((rating: any) => ({
      ...rating,
      createdAt: new Date(rating.createdAt),
      updatedAt: new Date(rating.updatedAt),
      repliedAt: rating.repliedAt ? new Date(rating.repliedAt) : undefined,
    }));
  }

  /**
   * Zapisuje dane do localStorage
   */
  private save(): void {
    if (!this.data) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
  }

  /**
   * Symuluje opóźnienie sieciowe (50-200ms)
   */
  private async simulateDelay(): Promise<void> {
    const delay = Math.random() * 150 + 50;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Zapewnia że dane są załadowane
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.data) {
      await this.initialize();
    }
  }

  /**
   * Generuje unikalny ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================
  // USERS
  // ============================================================

  async getUsers(): Promise<User[]> {
    await this.ensureInitialized();
    await this.simulateDelay();
    return [...this.data!.users];
  }

  async getUserById(id: string): Promise<User | undefined> {
    await this.ensureInitialized();
    await this.simulateDelay();
    return this.data!.users.find((u) => u.id === id);
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureInitialized();
    await this.simulateDelay();
    return this.data!.users;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const newUser: User = {
      ...user,
      id: this.generateId('user'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.users.push(newUser);
    this.save();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const index = this.data!.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;

    this.data!.users[index] = {
      ...this.data!.users[index],
      ...updates,
      updatedAt: new Date(),
    };

    this.save();
    return this.data!.users[index];
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const index = this.data!.users.findIndex((u) => u.id === id);
    if (index === -1) return false;

    this.data!.users.splice(index, 1);
    this.save();
    return true;
  }

  // ============================================================
  // AVAILABILITIES
  // ============================================================

  async getAvailabilitiesByDoctor(doctorId: string): Promise<Availability[]> {
    await this.ensureInitialized();
    await this.simulateDelay();
    return this.data!.availabilities.filter((a) => a.doctorId === doctorId);
  }

  async createAvailability(
    availability: Omit<Availability, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Availability> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const newAvailability: Availability = {
      ...availability,
      id: this.generateId('avail'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.availabilities.push(newAvailability);
    this.save();
    return newAvailability;
  }

  async deleteAvailability(id: string): Promise<boolean> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const index = this.data!.availabilities.findIndex((a) => a.id === id);
    if (index === -1) return false;

    this.data!.availabilities.splice(index, 1);
    this.save();
    return true;
  }

  // ============================================================
  // ABSENCES
  // ============================================================

  async getAbsencesByDoctor(doctorId: string): Promise<Absence[]> {
    await this.ensureInitialized();
    await this.simulateDelay();
    return this.data!.absences.filter((a) => a.doctorId === doctorId);
  }

  async createAbsence(absence: Omit<Absence, 'id' | 'createdAt' | 'updatedAt'>): Promise<Absence> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const newAbsence: Absence = {
      ...absence,
      id: this.generateId('abs'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.absences.push(newAbsence);
    this.save();
    return newAbsence;
  }

  async deleteAbsence(id: string): Promise<boolean> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const index = this.data!.absences.findIndex((a) => a.id === id);
    if (index === -1) return false;

    this.data!.absences.splice(index, 1);
    this.save();
    return true;
  }

  // ============================================================
  // APPOINTMENTS
  // ============================================================

  async getAppointments(filters?: {
    doctorId?: string;
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Appointment[]> {
    await this.ensureInitialized();
    await this.simulateDelay();

    let results = [...this.data!.appointments];

    if (filters) {
      if (filters.doctorId) {
        results = results.filter((a) => a.doctorId === filters.doctorId);
      }
      if (filters.patientId) {
        results = results.filter((a) => a.patientId === filters.patientId);
      }
      if (filters.startDate) {
        results = results.filter((a) => a.startTime >= filters.startDate!);
      }
      if (filters.endDate) {
        results = results.filter((a) => a.endTime <= filters.endDate!);
      }
    }

    return results;
  }

  async createAppointment(
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const newAppointment: Appointment = {
      ...appointment,
      id: this.generateId('app'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.appointments.push(newAppointment);
    this.save();
    return newAppointment;
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const index = this.data!.appointments.findIndex((a) => a.id === id);
    if (index === -1) return undefined;

    this.data!.appointments[index] = {
      ...this.data!.appointments[index],
      ...updates,
      updatedAt: new Date(),
    };

    this.save();
    return this.data!.appointments[index];
  }

  async deleteAppointment(id: string): Promise<boolean> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const index = this.data!.appointments.findIndex((a) => a.id === id);
    if (index === -1) return false;

    this.data!.appointments.splice(index, 1);
    this.save();
    return true;
  }

  // ============================================================
  // CARTS
  // ============================================================

  async getCart(userId: string): Promise<Cart> {
    await this.ensureInitialized();
    await this.simulateDelay();

    let cart = this.data!.carts.find((c) => c.userId === userId);

    if (!cart) {
      cart = {
        userId,
        items: [],
        totalPrice: 0,
        itemCount: 0,
        updatedAt: new Date(),
      };
      this.data!.carts.push(cart);
      this.save();
    }

    return cart;
  }

  async addToCart(userId: string, item: Omit<CartItem, 'id' | 'addedAt'>): Promise<Cart> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const cart = await this.getCart(userId);

    const newItem: CartItem = {
      ...item,
      id: this.generateId('cart-item'),
      addedAt: new Date(),
    };

    cart.items.push(newItem);
    cart.itemCount = cart.items.length;
    cart.totalPrice = cart.items.reduce((sum, i) => sum + i.price, 0);
    cart.updatedAt = new Date();

    this.save();
    return cart;
  }

  async removeFromCart(userId: string, itemId: string): Promise<Cart> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const cart = await this.getCart(userId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.itemCount = cart.items.length;
    cart.totalPrice = cart.items.reduce((sum, i) => sum + i.price, 0);
    cart.updatedAt = new Date();

    this.save();
    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    await this.ensureInitialized();
    await this.simulateDelay();

    const cart = await this.getCart(userId);
    cart.items = [];
    cart.itemCount = 0;
    cart.totalPrice = 0;
    cart.updatedAt = new Date();

    this.save();
  }

  // ============================================================
  // RATINGS
  // ============================================================

  async rateDoctor(
    doctorId: string,
    patientId: string,
    rating: number,
    comment?: string
  ): Promise<LocalRating> {
    await this.ensureInitialized();
    await this.simulateDelay();

    // Walidacja
    if (rating < 1 || rating > 5) {
      throw new Error('Ocena musi być w zakresie 1-5');
    }

    // Sprawdź czy to lekarz
    const doctor = this.data!.users.find((u) => u.id === doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      throw new Error('Lekarz nie znaleziony');
    }

    // Sprawdź czy pacjent miał wizytę u tego lekarza
    const pastAppointment = this.data!.appointments.find(
      (a) =>
        a.doctorId === doctorId &&
        a.patientId === patientId &&
        a.status !== 'cancelled' &&
        a.startTime < new Date()
    );

    if (!pastAppointment) {
      throw new Error('Możesz oceniać tylko lekarzy, u których byłeś na wizycie');
    }

    // Sprawdź czy pacjent już ocenił tego lekarza (zapobiegaj duplikatom)
    const existingRating = this.data!.ratings.find(
      (r) => r.patientId === patientId && r.doctorId === doctorId
    );

    if (existingRating) {
      throw new Error('Już oceniłeś tego lekarza');
    }

    // Utwórz ocenę
    const newRating: LocalRating = {
      _id: this.generateId('rating'),
      doctorId,
      patientId,
      rating,
      comment: comment || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.ratings.push(newRating);

    // Zaktualizuj statystyki lekarza
    doctor.doctorRating.totalRating += rating;
    doctor.doctorRating.numberOfRatings += 1;
    doctor.doctorRating.averageRating =
      doctor.doctorRating.totalRating / doctor.doctorRating.numberOfRatings;

    this.save();
    return newRating;
  }

  async getDoctorRatings(doctorId: string): Promise<LocalRating[]> {
    await this.ensureInitialized();
    await this.simulateDelay();

    // Sprawdź czy to lekarz
    const doctor = this.data!.users.find((u) => u.id === doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      throw new Error('Lekarz nie znaleziony');
    }

    // Pobierz oceny i posortuj od najnowszych
    const ratings = this.data!.ratings
      .filter((r) => r.doctorId === doctorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return ratings;
  }

  async replyToRating(
    doctorId: string,
    ratingId: string,
    reply: string,
    currentUserId: string,
    currentUserRole: string
  ): Promise<LocalRating> {
    await this.ensureInitialized();
    await this.simulateDelay();

    // Walidacja
    if (!reply || reply.trim().length === 0) {
      throw new Error('Odpowiedź nie może być pusta');
    }

    if (reply.length > 500) {
      throw new Error('Odpowiedź nie może być dłuższa niż 500 znaków');
    }

    // Sprawdź czy to lekarz i czy to jego profil
    if (currentUserRole !== 'doctor' && currentUserRole !== 'admin') {
      throw new Error('Tylko lekarze mogą odpowiadać na oceny');
    }

    if (currentUserRole === 'doctor' && currentUserId !== doctorId) {
      throw new Error('Możesz odpowiadać tylko na oceny w swoim profilu');
    }

    // Znajdź ocenę
    const rating = this.data!.ratings.find((r) => r._id === ratingId && r.doctorId === doctorId);
    if (!rating) {
      throw new Error('Ocena nie znaleziona');
    }

    // Dodaj odpowiedź
    rating.doctorReply = reply;
    rating.repliedAt = new Date();
    rating.updatedAt = new Date();

    this.save();
    return rating;
  }

  /**
   * Resetuje storage do stanu początkowego (usuwa wszystkie dane)
   */
  async reset(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    this.data = null;
    await this.initialize();
  }

  /**
   * Eksportuje dane jako JSON (do debugowania)
   */
  exportData(): LocalData | null {
    return this.data ? { ...this.data } : null;
  }
}

// Singleton
export const localStorageService = new LocalStorageService();
export default localStorageService;
