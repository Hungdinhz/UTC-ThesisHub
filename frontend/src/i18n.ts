import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './locales/vi.json';

// Cố định ngôn ngữ giao diện là Tiếng Việt
i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
    },
    lng: 'vi',
    fallbackLng: 'vi',
    supportedLngs: ['vi'],
    interpolation: {
      escapeValue: false,
    },
  });

// Xóa ngôn ngữ cũ trong localStorage nếu có
try {
  localStorage.setItem('i18nextLng', 'vi');
} catch {
  // Ignore localStorage access errors
}

export default i18n;
