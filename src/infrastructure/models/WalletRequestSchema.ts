import { z } from 'zod';

export const WalletRequestSchema = z.object({
    id: z.string().uuid().optional(),
    amount: z.number().positive('El monto debe ser mayor a 0'),
    senderId: z.string().uuid('ID de usuario inválido'),
    receiverId: z.string().uuid('ID de usuario inválido'),
});
export type WalletRequest = z.infer<typeof WalletRequestSchema>;