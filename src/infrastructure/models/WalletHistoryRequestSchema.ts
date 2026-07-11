import { z } from 'zod';

export const WalletHistoryRequestSchema = z.object({
    amount: z.number().positive('El monto debe ser mayor a 0'),
    senderId: z.string().uuid('ID de usuario inválido'),
    receiverId: z.string().uuid('ID de usuario inválido'),
    status: z.string()
});
export type WalletHistoryRequest = z.infer<typeof WalletHistoryRequestSchema>;