import { z } from 'zod';

export const WalletInitRequestSchema = z.object({
    id: z.string().uuid().optional(),
    availableBalance: z.number().positive('El monto debe ser mayor a 0'),
    accountingBalance: z.number().positive('El monto debe ser mayor a 0'),
    usersId: z.string().uuid('ID de usuario inválido'),
    version: z.number().optional(),
});
export type WalletInitRequest = z.infer<typeof WalletInitRequestSchema>;