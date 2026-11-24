import { Award, Building2, GraduationCap } from 'lucide-react';
import type { StoreConfig } from '../types';
import { useLanguage } from '../lib/i18n';

interface LeadershipSectionProps {
  storeConfig: StoreConfig;
}

export function LeadershipSection({ storeConfig }: LeadershipSectionProps) {
  const { language, t } = useLanguage();

  const founderName = storeConfig.founder_name || 'Dr. S.B. Saraswat';
  const founderDesignation =
    storeConfig.founder_designation || 'Director & Managing Head · Bhagwati Publications';
  const founderCredentials =
    storeConfig.founder_credentials ||
    'Ph.D. · B.E. (Electrical & Industrial Engineering) · PG in ADR, Public Administration & Materials Management';
  const founderBio =
    storeConfig.founder_bio ||
    'Dr. S.B. Saraswat brings decades of international industrial leadership, institutional governance, and technical scholarship to Bhagwati Publications. He serves as Resident Director at Danieli Corus (Netherlands) and previously held senior executive appointments as Joint Director (Technical/Materials) at Steel Authority of India Limited (SAIL) and Director of Supply Chain Management at Global Steel Sofia (Europe).';

  const photoUrl = storeConfig.founder_photo_url || '/assets/aistudio/images_117439bb.jpg';
  const isOriginalMagazinePortrait = photoUrl === '/assets/aistudio/images_117439bb.jpg';

  const initials = founderName
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'SS';

  const bioParagraphs = founderBio
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section
      id="leadership-section"
      aria-labelledby="leadership-heading"
      className="py-16 bg-[#0B192C] text-white border-b border-[#1D3557]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white text-[#0B192C] rounded-lg border border-[#C59B27]/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Portrait Frame (Navy, Gold & Crisp Portrait Display) */}
          <div className="lg:col-span-5 bg-[#07111E] p-6 sm:p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#C59B27]/25">
            <div className="w-full max-w-[320px] space-y-4">
              <div className="aspect-[4/5] w-full rounded-md overflow-hidden border border-[#C59B27]/60 bg-[#0B192C] relative flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`${founderName}, ${founderDesignation}`}
                    referrerPolicy="no-referrer"
                    className={
                      isOriginalMagazinePortrait
                        ? 'absolute -left-[2.5%] -top-[21%] w-[167%] max-w-none h-auto select-none'
                        : 'w-full h-full object-cover object-top'
                    }
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#0E2038] to-[#07111E] space-y-4">
                    <div className="w-24 h-24 rounded-full border border-[#C59B27]/60 bg-[#0B192C] flex items-center justify-center">
                      <span className="font-serif text-3xl font-bold text-[#DFC166] tracking-wider">
                        {initials}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-serif text-base font-semibold text-white">
                        {founderName}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-[#DFC166]">
                        {founderDesignation}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-[220px]">
                      {language === 'hi'
                        ? 'मूल छायाचित्र अपलोड करने के लिए एडमिन पैनल → Store & Leadership का उपयोग करें।'
                        : 'Upload the original portrait image in Admin → Store & Leadership to display it here.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Official Nameplate Plaque */}
              <div className="pt-2 border-t border-white/15 text-center sm:text-left">
                <p className="font-serif text-xl font-bold text-white leading-snug">
                  {founderName}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#DFC166] mt-1">
                  {founderDesignation}
                </p>
              </div>
            </div>
          </div>

          {/* Right Editorial Leadership Profile */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-6 bg-white">
            <div className="space-y-3">
              <div className="w-12 h-px bg-[#C59B27]" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9F7918]">
                {t('leadershipEyebrow')}
              </p>
              <h2
                id="leadership-heading"
                className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] leading-tight"
              >
                {t('leadershipHeading')}
              </h2>
            </div>

            {/* Dedicated Name, Designation & Academic Credentials Band */}
            <div className="py-4 border-y border-slate-200 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0B192C]">
                  {founderName}
                </h3>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                  {founderDesignation}
                </span>
              </div>
              {founderCredentials && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {founderCredentials}
                </p>
              )}
            </div>

            {/* Executive Biography */}
            <div className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              {bioParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Factual Career & Academic Milestones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs text-[#0B192C]">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#9F7918] font-semibold">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === 'hi' ? 'अंतर्राष्ट्रीय नेतृत्व' : 'Global Leadership'}</span>
                </div>
                <p className="text-slate-600 leading-snug">
                  Resident Director, Danieli Corus (Netherlands)
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#9F7918] font-semibold">
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === 'hi' ? 'प्रमुख पद' : 'Executive Appointments'}</span>
                </div>
                <p className="text-slate-600 leading-snug">
                  Former Joint Director, SAIL &amp; Director SCM, Global Steel Sofia
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#9F7918] font-semibold">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === 'hi' ? 'शैक्षणिक योग्यता' : 'Academic & Technical'}</span>
                </div>
                <p className="text-slate-600 leading-snug">
                  Ph.D., B.E. (Electrical &amp; Industrial Engg.), ISO-9000 Certified
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
