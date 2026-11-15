import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  type Reservation,
  type ReservationError,
} from '@/lib/reservation';
import { FINISHES } from '@/lib/story';

// Escreve em disco, por isso precisa do runtime Node (não funciona no Edge).
export const runtime = 'nodejs';

/**
 * As reservas ficam em data/reservas.json (fora do git).
 * Serve para correr localmente ou num servidor próprio; em alojamento serverless
 * o disco não persiste — nesse caso, troque `persist` por uma base de dados.
 */
const STORE_PATH = path.join(process.cwd(), 'data', 'reservas.json');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type StoredReservation = Reservation & { criadaEm: string };

// Fila simples: impede que duas escritas simultâneas se sobreponham.
let writeQueue: Promise<void> = Promise.resolve();

async function readStore(): Promise<StoredReservation[]> {
  try {
    return JSON.parse(await readFile(STORE_PATH, 'utf8'));
  } catch (error) {
    // Ficheiro ainda inexistente = lista vazia; qualquer outro erro é real.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

function persist(reservation: StoredReservation): Promise<void> {
  const task = writeQueue.then(async () => {
    await mkdir(path.dirname(STORE_PATH), { recursive: true });
    const all = await readStore();
    all.push(reservation);
    await writeFile(STORE_PATH, JSON.stringify(all, null, 2), 'utf8');
  });
  // Uma escrita falhada não pode bloquear as seguintes.
  writeQueue = task.catch(() => {});
  return task;
}

const fail = (erro: string, status = 400) => Response.json({ erro } satisfies ReservationError, { status });

const asTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('Pedido inválido.');
  }
  if (typeof body !== 'object' || body === null) return fail('Pedido inválido.');

  const input = body as Record<string, unknown>;
  const nome = asTrimmedString(input.nome);
  const email = asTrimmedString(input.email).toLowerCase();
  const finish = FINISHES.find((f) => f.id === input.acabamento);

  if (nome.length < NAME_MIN_LENGTH || nome.length > NAME_MAX_LENGTH) {
    return fail(`Indique o seu nome (${NAME_MIN_LENGTH} a ${NAME_MAX_LENGTH} caracteres).`);
  }
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    return fail('Indique um endereço de e-mail válido.');
  }
  if (!finish) return fail('Escolha um acabamento válido.');

  const reservation: Reservation = {
    codigo: `ORB-${randomUUID().slice(0, 6).toUpperCase()}`,
    nome,
    email,
    acabamento: finish.id,
  };

  try {
    await persist({ ...reservation, criadaEm: new Date().toISOString() });
  } catch (error) {
    console.error('Falha ao guardar a reserva:', error);
    return fail('Não foi possível registar a reserva. Tente novamente.', 500);
  }

  return Response.json(reservation, { status: 201 });
}
