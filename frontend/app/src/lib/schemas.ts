import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Enter your email').email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

export const registerSchema = z.object({
  username: z
    .string()
    .min(1, 'Enter a username')
    .max(40, 'Use 40 characters or fewer'),
  email: z.string().min(1, 'Enter your email').email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
})

export const forgotSchema = z.object({
  email: z.string().min(1, 'Enter your email').email('Enter a valid email'),
})

export const resetSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm_password: z.string().min(1, 'Confirm your password'),
  })
  .refine((value) => value.password === value.confirm_password, {
    path: ['confirm_password'],
    message: 'Password does not match',
  })

export const contactSchema = z.object({
  name: z.string().min(1, 'Enter your name'),
  email: z.string().min(1, 'Enter your email').email('Enter a valid email'),
  message: z.string().min(1, 'Enter a message'),
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotValues = z.infer<typeof forgotSchema>
export type ResetValues = z.infer<typeof resetSchema>
export type ContactValues = z.infer<typeof contactSchema>

export const playlistSuggestSchema = z.object({
  url: z.string().min(1, 'Paste a YouTube playlist link'),
  note: z
    .string()
    .min(1, 'Tell us why it fits here')
    .max(500, 'Use 500 characters or fewer'),
  email: z
    .string()
    .email('Enter a valid email')
    .optional()
    .or(z.literal('')),
})

export type PlaylistSuggestValues = z.infer<typeof playlistSuggestSchema>
