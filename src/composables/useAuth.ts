import { ref, computed } from 'vue';
import type { UserAccount } from '../types/auth';
import { mockUsers } from '../data/authData';

const STORAGE_KEY = 'bmis_user';

// Mengambil sesi user dari localStorage
const getInitialUser = (): UserAccount | null => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const found = mockUsers.find(
        (u) =>
          u.id === parsed.id ||
          u.email === parsed.email ||
          u.nip === parsed.nip ||
          u.nama.toLowerCase() === (parsed.name || parsed.nama || '').toLowerCase()
      );
      if (found) {
        return {
          ...found,
          role: parsed.role || found.role,
          roleLabel: parsed.roleLabel || found.roleLabel,
        };
      }
      return {
        id: parsed.id || (parsed.role === 'employee' ? 'usr-employee-asep' : 'usr-admin-1'),
        nama: parsed.name || parsed.nama || 'Asep Milo',
        email: parsed.email || (parsed.role === 'employee' ? 'asep@bmis.id' : 'admin@bmis.id'),
        password: '',
        nip: parsed.nip || (parsed.role === 'employee' ? 'CS.50101' : 'ADM.001'),
        role: parsed.role || 'employee',
        roleLabel: parsed.roleLabel || (parsed.role === 'employee' ? 'Karyawan / Engineering' : 'Building Admin'),
        divisi: parsed.divisi || (parsed.role === 'employee' ? 'Engineering' : 'Manajemen Operasional'),
        jabatan: parsed.jabatan || 'Pegawai',
        kantor: 'Menara 1 BTN',
        avatarInitials: parsed.initials || 'AM',
        avatarBg: 'bg-slate-800',
      };
    } catch {
      return null;
    }
  }
  return null;
};

const currentUser = ref<UserAccount | null>(getInitialUser());

export function useAuth() {
  const isAuthenticated = computed(() => !!currentUser.value);
  const isAdmin = computed(() => currentUser.value?.role === 'admin');
  const isEmployee = computed(() => currentUser.value?.role === 'employee' || currentUser.value?.role === 'user');

  const refreshUser = () => {
    currentUser.value = getInitialUser();
  };

  const setUser = (user: UserAccount | null) => {
    currentUser.value = user;
    if (user) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          username: user.email ? user.email.split('@')[0] : 'user',
          name: user.nama,
          initials: user.avatarInitials,
          role: user.role,
          roleLabel: user.roleLabel,
          superadmin: user.role === 'admin' ? 1 : 0,
          id: user.id,
          nip: user.nip,
          divisi: user.divisi,
        })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = (identifier: string, pass: string): { success: boolean; user?: UserAccount; message?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const user = mockUsers.find(
      u => (u.email.toLowerCase() === cleanId || u.nip.toLowerCase() === cleanId) && u.password === pass
    );

    if (user) {
      setUser(user);
      return { success: true, user };
    }
    return { success: false, message: 'Email/NIP atau kata sandi tidak cocok. Gunakan password demo: admin123 / user123.' };
  };

  const loginAs = (user: UserAccount) => {
    setUser(user);
  };

  const switchUser = (userId: string) => {
    const target = mockUsers.find(u => u.id === userId);
    if (target) {
      setUser(target);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return {
    currentUser,
    mockUsers,
    isAuthenticated,
    isAdmin,
    isEmployee,
    refreshUser,
    login,
    loginAs,
    switchUser,
    logout,
  };
}
