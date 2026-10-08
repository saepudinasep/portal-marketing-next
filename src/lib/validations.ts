import { z } from 'zod';

// Batas panjang mengikuti data dictionary SMK Nusantara.
const person = {
  name: z.string().trim().min(1, 'Name is required.').max(50, 'Name must be at most 50 characters.'),
  gender: z.enum(['Male', 'Female'], 'Gender must be Male or Female.'),
  dateOfBirth: z.iso.date('Date of birth must be a valid date.'),
  phoneNumber: z.string().regex(/^\d{1,12}$/, 'Phone number must be 1-12 digits.'),
};

export const studentSchema = z.object({
  studentId: z.string().trim().min(1, 'Student ID is required.').max(8, 'Student ID must be at most 8 characters.'),
  ...person,
  address: z.string().trim().min(1, 'Address is required.').max(150, 'Address must be at most 150 characters.'),
});

export const teacherSchema = z.object({
  teacherId: z.string().trim().min(1, 'Teacher ID is required.').max(8, 'Teacher ID must be at most 8 characters.'),
  ...person,
  address: z.string().trim().min(1, 'Address is required.').max(100, 'Address must be at most 100 characters.'),
});
