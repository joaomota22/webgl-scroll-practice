/** Contrato da reserva, partilhado entre o formulário e a API. */

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 80;
export const EMAIL_MAX_LENGTH = 120;

/** Corpo enviado para POST /api/reservas. */
export type ReservationRequest = {
  nome: string;
  email: string;
  acabamento: string;
};

/** Resposta de sucesso da API. */
export type Reservation = ReservationRequest & { codigo: string };

/** Resposta de erro da API. */
export type ReservationError = { erro: string };
