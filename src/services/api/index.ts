/**
 * Centralna eksportacja wszystkich serwisów API (REST)
 *
 * Eksportujemy singleton instancje każdego serwisu
 */

export { authService } from './AuthService';
export { userService } from './UserService';
export { appointmentService } from './AppointmentService';
export { availabilityService } from './AvailabilityService';
export { cartService } from './CartService';

// Re-export typów dla wygody
export type { IAuthService, IUserService, IAppointmentService, IAvailabilityService, ICartService } from '../IDataService';
