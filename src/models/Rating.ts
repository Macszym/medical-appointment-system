/**
 * Model oceny/opinii lekarza
 *
 * Pacjent może ocenić lekarza po odbyciu wizyty.
 * Lekarz może odpowiedzieć na ocenę.
 */

export interface Rating {
  _id: string;
  doctorId: string;
  patientId: string | {
    _id: string;
    firstName: string;
    lastName: string;
  };
  appointmentId?: string;
  rating: number; // 1-5
  comment?: string;
  doctorReply?: string;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO dla dodawania oceny
 */
export interface CreateRatingDTO {
  doctorId: string;
  rating: number;
  comment?: string;
}

/**
 * DTO dla odpowiedzi lekarza na ocenę
 */
export interface ReplyToRatingDTO {
  reply: string;
}
