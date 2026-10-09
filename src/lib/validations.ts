import { z } from 'zod';

// Batas panjang mengikuti data dictionary SMK Nusantara.
const person = {
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(50, 'Name must be at most 50 characters.'),
  gender: z.enum(['Male', 'Female'], 'Gender must be Male or Female.'),
  dateOfBirth: z.iso.date('Date of birth must be a valid date.'),
  phoneNumber: z.string().regex(/^\d{1,12}$/, 'Phone number must be 1-12 digits.'),
};

export const studentSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(1, 'Student ID is required.')
    .max(8, 'Student ID must be at most 8 characters.'),
  ...person,
  address: z
    .string()
    .trim()
    .min(1, 'Address is required.')
    .max(150, 'Address must be at most 150 characters.'),
});

export const teacherSchema = z.object({
  teacherId: z
    .string()
    .trim()
    .min(1, 'Teacher ID is required.')
    .max(8, 'Teacher ID must be at most 8 characters.'),
  ...person,
  address: z
    .string()
    .trim()
    .min(1, 'Address is required.')
    .max(100, 'Address must be at most 100 characters.'),
});

// Kebijakan password (akun baru, ganti password). Disimpan sebagai hash bcrypt, jadi
// batas 10 karakter di ERD lama tidak berlaku; 72 adalah batas masukan bcrypt.
export const passwordPolicy = z
  .string()
  .min(8, 'New password must be at least 8 characters.')
  .max(72, 'New password must be at most 72 characters.')
  .regex(/[a-z]/, 'New password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'New password must contain an uppercase letter.')
  .regex(/\d/, 'New password must contain a number.')
  .regex(/[^A-Za-z0-9]/, 'New password must contain a symbol.');

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required.').max(72),
    newPassword: passwordPolicy,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword !== v.oldPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the old password.',
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Confirm password does not match.',
  });
