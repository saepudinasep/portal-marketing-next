// Penerjemah antara nilai di database (enum huruf kecil, tanggal Date, field opsional)
// dan bentuk yang dipakai komponen UI (Male/Female, 'YYYY-MM-DD', string kosong).

export const genderToUi = (g: 'male' | 'female'): 'Male' | 'Female' => (g === 'male' ? 'Male' : 'Female');
export const genderToDb = (g: 'Male' | 'Female'): 'male' | 'female' => (g === 'Male' ? 'male' : 'female');

export const dateToUi = (d: Date | null): string => (d ? d.toISOString().slice(0, 10) : '');
export const dateToDb = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);
