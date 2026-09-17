import { randomUUID } from 'node:crypto';
import { writeOutbox } from './dev-outbox';

export interface VideoRooms {
  createRoom(a: { appointmentId: string; startsAt: string; durationMinutes: number }): Promise<{ roomId: string }>;
  mintJoinToken(a: {
    roomId: string;
    userId: string;
    role: 'patient' | 'provider';
    ttlSeconds: number;
  }): Promise<{ token: string; expiresAt: string }>;
}

/** Returns a local echo room — enough to render "join" UI and thread a room
 * id through appointments without a real 100ms account (D-013, D-025). */
export class StubVideoRooms implements VideoRooms {
  async createRoom(a: { appointmentId: string; startsAt: string; durationMinutes: number }) {
    const roomId = `stub_room_${a.appointmentId}`;
    await writeOutbox('video', { kind: 'room_created', roomId, appointmentId: a.appointmentId });
    return { roomId };
  }

  async mintJoinToken(a: { roomId: string; userId: string; role: 'patient' | 'provider'; ttlSeconds: number }) {
    // join tokens are never persisted (architecture.md §10) — the stub
    // mirrors that by minting fresh, unlogged values on every call.
    const token = `stub_token_${randomUUID()}`;
    const expiresAt = new Date(Date.now() + a.ttlSeconds * 1000).toISOString();
    return { token, expiresAt };
  }
}
