// Tipe hasil Server Action. Dipisah dari file 'use server' karena file tersebut
// hanya boleh mengekspor fungsi async.
export type ActionResult = { ok: true } | { ok: false; error: string };
