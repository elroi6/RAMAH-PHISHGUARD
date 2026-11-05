import { z } from "zod";

export const scanUrlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required.")
    .max(2048, "URL must not exceed 2048 characters.")
}).strict();