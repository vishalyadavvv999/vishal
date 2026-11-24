import { ArrowRight, BookOpen, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { StoreConfig } from '../types';
import { LanguageToggle, useLanguage } from '../lib/i18n';
import type { AppView } from './Navbar';
import { LeadershipSection } from './LeadershipSection';

interface AboutViewProps {
  storeConfig: StoreConfig;
  onNavigate: (view: AppView) => void;
}

export function AboutView({ storeConfig, onNavigate }: AboutViewProps) {
  const { language, t } = useLanguage();
  const publisherName = storeConfig.publisher_name || 'Bhagwati Publications';

  return (
    <div className="bg-[#F9FAFB]">
      {/* Page Header */}
      <section className="bg-[#0B192C] text-white py-12 sm:py-16 border-b border-[#1D3557]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="w-12 h-px bg-[#C59B27]" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#DFC166]">
              {t('aboutEyebrow')}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {language === 'hi'
                ? 'भगवती पब्लिकेशंस — परिचय एवं प्रबंधन'
                : `About ${publisherName}`}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {t('aboutHeading')}
            </p>
          </div>
          <LanguageToggle variant="dark" />
        </div>
      </section>

      {/* Editorial Mission & Publishing Standards */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
              {language === 'hi' ? 'संपादकीय दृष्टिकोण' : 'Publishing Philosophy'}
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] leading-snug">
              {language === 'hi'
                ? 'विश्वसनीय शोध, उत्कृष्ट मुद्रण और पाठकों तक पारदर्शी पहुँच'
                : 'Scholarship, archival print quality, and direct institutional distribution.'}
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {t('aboutBody')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-sm text-[#0B192C]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                <span>{t('aboutPoint1')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                <span>{t('aboutPoint2')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                <span>{t('aboutPoint3')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                <span>{t('aboutPoint4')}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#F9FAFB] border border-slate-200 rounded-lg p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-[#0B192C] text-[#DFC166] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#0B192C]">
                  {language === 'hi' ? 'प्रत्यक्ष पुस्तक वितरण' : 'Direct Publisher Catalog'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {language === 'hi'
                    ? 'प्रत्येक संस्करण के लिए ऑनलाइन सैंपल अध्याय, प्रमाणित ISBN विवरण और त्वरित ऑर्डर ट्रैकिंग उपलब्ध है।'
                    : 'Every edition includes verified bibliographic specifications, sample previews, and live order fulfillment tracking.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t border-slate-200">
              <div className="w-10 h-10 rounded-md bg-[#0B192C] text-[#DFC166] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#0B192C]">
                  {language === 'hi' ? 'सहयोगी डिजिटल भागीदार' : 'Supporting Digital Partner'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {language === 'hi'
                    ? 'डिजिटल संचालन और ई-कॉमर्स अवसंरचना Global E-Auction के सहयोग से समर्थित है।'
                    : 'Digital commerce infrastructure and distribution support provided in partnership with Global E-Auction.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Leadership / Management Section */}
      <LeadershipSection storeConfig={storeConfig} />

      {/* Explore Catalog CTA */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0B192C]">
              {language === 'hi'
                ? 'हमारी प्रकाशित पुस्तकें और लेखक देखें'
                : 'Explore Our Published Catalog & Authors'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {language === 'hi'
                ? 'नए संस्करण देखें, सैंपल PDF पढ़ें या थोक व संस्थागत ऑर्डर के लिए संपर्क करें।'
                : 'Browse verified titles, read interactive excerpts, or connect with our publisher desk.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors cursor-pointer"
            >
              <span>{t('heroExploreCatalog')}</span>
              <ArrowRight className="w-4 h-4 text-[#DFC166]" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('support')}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-[#0B192C] text-sm font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>{t('navSupport')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
