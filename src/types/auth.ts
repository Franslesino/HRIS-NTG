export type UserRole = 'admin' | 'employee' | 'user';

export interface UserAccount {
  id: string;
  nama: string;
  email: string;
  password: string;
  nip: string;
  role: UserRole;
  roleLabel: string;
  divisi: string;
  jabatan: string;
  kantor: string;
  avatarInitials: string;
  avatarBg: string;
}
