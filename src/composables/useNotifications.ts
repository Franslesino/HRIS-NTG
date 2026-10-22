import { ref, computed } from 'vue';

export interface NotificationItem {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  time: string;
  timestamp: string;
  read: boolean;
  badge?: string;
}

const notifications = ref<NotificationItem[]>([
  {
    id: 'notif-init-1',
    type: 'warning',
    category: 'Jadwal Shift',
    title: 'Pengingat Shift Pagi',
    message: 'Jadwal shift Anda dimulai pukul 08:00 WIB. Toleransi keterlambatan maksimal 15 menit (08:15 WIB).',
    time: '07:30 WIB',
    timestamp: 'Hari ini',
    read: false,
    badge: 'Shift 08:00'
  },
  {
    id: 'notif-init-2',
    type: 'urgent',
    category: 'Sistem Kehadiran',
    title: 'Validasi Geofence Aktif',
    message: 'Radius penugasan kerja 100m dari koordinat Menara 1 BTN sedang dipantau secara real-time.',
    time: '06:00 WIB',
    timestamp: 'Hari ini',
    read: true,
    badge: 'Geofence'
  },
  {
    id: 'notif-init-3',
    type: 'warning',
    category: 'Riwayat Kemarin',
    title: 'Peringatan Terlambat Shift',
    message: 'Keterlambatan 30 menit tercatat pada riwayat shift kerja.',
    time: '08:30 WIB',
    timestamp: 'Kemarin',
    read: true,
    badge: 'Terlambat 30m'
  }
]);

export function useNotifications() {
  const addNotification = (item: Omit<NotificationItem, 'id' | 'read'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: 'notif-' + Date.now(),
      read: false
    };
    notifications.value.unshift(newItem);
  };

  const markAllAsRead = (type?: 'urgent' | 'warning') => {
    notifications.value.forEach(n => {
      if (!type || n.type === type || (type === 'warning' && n.type === 'info')) {
        n.read = true;
      }
    });
  };

  const markAsRead = (id: string) => {
    const found = notifications.value.find(n => n.id === id);
    if (found) found.read = true;
  };

  const redNotifications = computed(() =>
    notifications.value.filter(n => n.type === 'urgent')
  );

  const yellowNotifications = computed(() =>
    notifications.value.filter(n => n.type === 'warning' || n.type === 'info')
  );

  const unreadRedCount = computed(() =>
    redNotifications.value.filter(n => !n.read).length
  );

  const unreadYellowCount = computed(() =>
    yellowNotifications.value.filter(n => !n.read).length
  );

  return {
    notifications,
    redNotifications,
    yellowNotifications,
    unreadRedCount,
    unreadYellowCount,
    addNotification,
    markAllAsRead,
    markAsRead
  };
}
