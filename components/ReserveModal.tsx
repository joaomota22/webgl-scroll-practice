'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import FinishPicker from './FinishPicker';
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  type Reservation,
  type ReservationError,
  type ReservationRequest,
} from '@/lib/reservation';
import { FINISHES, type Finish } from '@/lib/story';

type Props = {
  open: boolean;
  onClose: () => void;
  finish: Finish;
  onFinishChange: (finish: Finish) => void;
  price: string;
  reservation: Reservation | null;
  onReserved: (reservation: Reservation) => void;
};

const GENERIC_ERROR = 'Não foi possível concluir a reserva. Tente novamente.';
const NETWORK_ERROR = 'Sem ligação ao servidor. Tente novamente.';

const fieldClass =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-fg placeholder:text-white/30 transition-colors focus:border-accent focus:bg-white/10';
const labelClass = 'mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted';
const primaryClass =
  'w-full rounded-full bg-fg py-3.5 text-[15px] font-medium text-black transition-[scale,opacity] hover:scale-[1.02] disabled:scale-100 disabled:opacity-60';

async function createReservation(request: ReservationRequest): Promise<Reservation> {
  let response: Response;
  try {
    response = await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (data as ReservationError | null)?.erro;
    throw new Error(typeof message === 'string' ? message : GENERIC_ERROR);
  }
  return data as Reservation;
}

export default function ReserveModal({ open, onClose, finish, onFinishChange, price, reservation, onReserved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // <dialog> nativo: foco confinado, tecla Esc e ::backdrop sem código extra.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    setError('');
    try {
      const created = await createReservation({
        nome: String(form.get('nome') ?? ''),
        email: String(form.get('email') ?? ''),
        acabamento: finish.id,
      });
      onReserved(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR);
    } finally {
      setSending(false);
    }
  }

  const reservedFinish = reservation ? FINISHES.find((f) => f.id === reservation.acabamento) : undefined;

  return (
    <dialog
      ref={dialogRef}
      data-lenis-prevent
      aria-labelledby="reserva-titulo"
      onClose={handleClose}
      // Um clique diretamente no <dialog> é um clique no fundo, fora do conteúdo.
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
      className="glass-strong m-auto max-h-[92dvh] w-[min(92vw,27rem)] overflow-y-auto rounded-[28px] p-0 text-fg backdrop:bg-black/55 backdrop:backdrop-blur-md open:animate-pop motion-reduce:open:animate-none"
    >
      <div className="relative p-7 sm:p-8">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-lg leading-none text-muted transition-colors hover:bg-white/15 hover:text-fg"
        >
          <span aria-hidden>×</span>
        </button>

        {reservation ? (
          <div className="text-center">
            <div
              aria-hidden
              className="mx-auto grid size-14 place-items-center rounded-full border border-accent/40 bg-accent/15 text-2xl text-accent"
            >
              ✓
            </div>
            <h2 id="reserva-titulo" className="mt-5 text-2xl font-semibold tracking-tight">
              Reserva confirmada
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              {reservation.nome.split(' ')[0]}, o seu ORBE One
              {reservedFinish ? ` em ${reservedFinish.name}` : ''} está garantido. Guarde o código abaixo.
            </p>
            <p className="mt-6 rounded-2xl border border-white/15 bg-white/5 py-4 font-mono text-2xl tracking-[0.2em]">
              {reservation.codigo}
            </p>
            <p className="mt-3 text-xs text-white/40">{reservation.email}</p>
            <button type="button" onClick={handleClose} className={`mt-7 ${primaryClass}`}>
              Concluir
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Reserva</p>
            <h2 id="reserva-titulo" className="mt-3 text-2xl font-semibold tracking-tight">
              Garanta o seu ORBE One
            </h2>
            <p className="mt-2 text-[15px] text-muted">{price} · sem qualquer pagamento agora.</p>

            <div className="mt-7">
              <span className={labelClass}>Acabamento — {finish.name}</span>
              <FinishPicker name="acabamento-reserva" value={finish} onChange={onFinishChange} className="gap-3" />
            </div>

            <label className="mt-6 block">
              <span className={labelClass}>Nome</span>
              <input
                name="nome"
                required
                minLength={NAME_MIN_LENGTH}
                maxLength={NAME_MAX_LENGTH}
                autoComplete="name"
                placeholder="O seu nome"
                className={fieldClass}
              />
            </label>

            <label className="mt-4 block">
              <span className={labelClass}>E-mail</span>
              <input
                name="email"
                type="email"
                required
                maxLength={EMAIL_MAX_LENGTH}
                autoComplete="email"
                placeholder="nome@exemplo.pt"
                className={fieldClass}
              />
            </label>

            <p role="alert" className="mt-4 min-h-5 text-sm text-red-300">
              {error}
            </p>

            <button type="submit" disabled={sending} className={`mt-2 ${primaryClass}`}>
              {sending ? 'A enviar…' : 'Confirmar reserva'}
            </button>
            <p className="mt-4 text-center text-[11px] text-white/35">
              O ORBE One é um produto conceptual — não é efetuada qualquer compra.
            </p>
          </form>
        )}
      </div>
    </dialog>
  );
}
