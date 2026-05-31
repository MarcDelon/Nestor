'use client';
import { useLanguage } from './LanguageProvider';

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
      <button
        onClick={() => setLocale('fr')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: locale === 'fr' ? 900 : 500, color: locale === 'fr' ? '#0B6B41' : 'rgba(0,0,0,0.45)', textDecoration: locale === 'fr' ? 'underline' : 'none', padding: '2px 4px', fontSize: '0.72rem' }}
      >FR</button>
      <span style={{ color: 'rgba(0,0,0,0.25)' }}>|</span>
      <button
        onClick={() => setLocale('en')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: locale === 'en' ? 900 : 500, color: locale === 'en' ? '#0B6B41' : 'rgba(0,0,0,0.45)', textDecoration: locale === 'en' ? 'underline' : 'none', padding: '2px 4px', fontSize: '0.72rem' }}
      >EN</button>
    </div>
  );
}
