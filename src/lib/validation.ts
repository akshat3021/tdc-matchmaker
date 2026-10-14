import { z } from 'zod';

const id = z.string().regex(/^[a-z]_\d{3}$/i, 'invalid id');

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username').max(64),
  password: z.string().min(1, 'Enter your password').max(128),
});

export const insightSchema = z.object({ customerId: id, candidateId: id });

export const sendMatchSchema = z.object({
  customerId: id,
  candidateId: id,
  message: z.string().trim().min(20, 'Write a short note (at least 20 characters)').max(1800),
});

export const matchesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(12),
});
