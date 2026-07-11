import { z } from 'zod';

export const WalletInitRequestSchema = z.object({
    id: z.string().uuid().optional(),
    availableBalance: z.number().int().positive('El monto debe ser mayor a 0'),
    accountingBalance: z.number().int().nonnegative({
        message: "El saldo contable debe ser 0 o un número positivo"
    }),
    usersId: z.string().uuid('ID de usuario inválido'),
    version: z.number().int().optional(),
});
export type WalletInitRequest = z.infer<typeof WalletInitRequestSchema>;