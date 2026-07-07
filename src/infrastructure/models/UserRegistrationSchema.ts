import { z } from 'zod';

// Esquema para un formulario de registro
export const UserRegistrationSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "Mínimo 3 caracteres"),
  surName: z.string().min(3, "Mínimo 3 caracteres"),
  typeDocumentID: z.string().min(2, "Mínimo 2 caracteres"),
  documentID: z.string().min(6, "Mínimo 6 caracteres"),
  email: z.string().email("Formato de email inválido"),
  telephone: z.string().min(6, "Formato de teléfono inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(12, "La contraseña debe tener al maximo 12 caracteres"),
  imgClients: z.string().optional(),
  active: z.boolean(),
  rolesId: z.coerce.string().min(1, "Rol es obligatorio"),
});

// Inferencia automática del tipo TypeScript
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;