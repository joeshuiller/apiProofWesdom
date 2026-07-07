import { z } from 'zod';

// Esquema para un formulario de registro
export const RolRegistrationSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  active: z.boolean(),
});

// Inferencia automática del tipo TypeScript
export type RolRegistration = z.infer<typeof RolRegistrationSchema>;