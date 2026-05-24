import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72)
});

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72)
});

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(8).max(72)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });
