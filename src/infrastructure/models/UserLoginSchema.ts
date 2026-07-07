import { z } from 'zod';

// Esquema para un formulario de registro
export const UserLoginSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(12, "La contraseña debe tener al maximo 12 caracteres"),
});

// Inferencia automática del tipo TypeScript
export type UserLogin = z.infer<typeof UserLoginSchema>;