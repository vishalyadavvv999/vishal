import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AppLanguage = 'en' | 'hi';

const LANG_STORAGE_KEY = 'bhagwati_publications_lang_v1';

const TRANSLATIONS = {
  en: {
    brandName: 'Bhagwati Publications',
    navCatalog: 'Catalog',
    navNewReleases: 'New Releases',
    navAuthors: 'Authors',
    navUpdates: 'Updates',
    navWishlist: 'Wishlist',
    navSupport: 'Support',
    navAdmin: 'Admin',
    navBag: 'Bag',

    heroEyebrow: 'Bhagwati Publications · Official Storefront',
    heroTitle: 'Authoritative books crafted for scholars, institutions, and readers.',
    heroSubtitle:
      'Bhagwati Publications publishes and distributes verified editions across academic humanities, architecture, business strategy, and literature. Preview interactive chapters and order directly from the publisher.',
    heroExploreCatalog: 'Explore Book Catalog',
    heroNewReleases: 'New Releases',

    aboutEyebrow: 'About Bhagwati Publications',
    aboutHeading: 'A modern publishing house built on editorial integrity and direct reader access.',
    aboutBody:
      'Bhagwati Publications brings together rigorous editorial standards, durable book production, and transparent digital distribution. Every title in our catalog is accompanied by verified ISBN metadata, interactive sample previews, real-time stock availability, and direct inquiry support for individual readers and institutional buyers.',
    aboutPoint1: 'Verified ISBN-13 Catalog Editions',
    aboutPoint2: 'Interactive Digital Preview & Sample PDFs',
    aboutPoint3: 'Direct Cart, Buy Now & Order Tracking',
    aboutPoint4: 'WhatsApp & Institutional Bulk Desk',

    recentPublications: 'Recent Publications',
    newReleasesTitle: 'New Releases',
    viewAllNewReleases: 'View All New Releases',

    editorialRoster: 'Editorial Roster',
    ourAuthorsTitle: 'Our Authors & Editors',
    exploreAllAuthors: 'Explore All Authors',
    viewProfile: 'View Profile →',

    leadershipEyebrow: 'Leadership & Vision',
    leadershipHeading: 'About the Founder & Leadership',

    updatesEyebrow: 'Editorial Dispatch',
    updatesTitle: 'News & Publication Updates',
    viewAllUpdates: 'All Updates',
    updatesPageHeading: 'News & Publication Updates',
    updatesPageSubtitle:
      'Official announcements, new print editions, institutional adoption notices, and digital platform updates from Bhagwati Publications.',

    catalogTitle: 'Complete Book Catalog',
    newReleasesCatalogTitle: 'New Releases Catalog',
    searchPlaceholder: 'Search title, author, ISBN, or topic...',
    allSubjects: 'All Subjects',
    allLanguages: 'All Languages',
    allBindings: 'All Bindings',
    inStockOnly: 'In Stock Only',
    minPrice: 'Min Price',
    maxPrice: 'Max Price',
    advancedFilters: 'Filters',
    resetFilters: 'Reset Filters',
    sortNewest: 'Sort: Newest First',
    sortPriceAsc: 'Price: Low to High',
    sortPriceDesc: 'Price: High to Low',
    sortTitle: 'Title: A to Z',
    sortRating: 'Top Rated',

    addToBag: 'Add to Bag',
    addToCart: 'Add to Cart',
    addedToBag: 'Added to Bag',
    buyNow: 'Buy Now',
    unavailable: 'Unavailable',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    samplePreview: 'Preview',
    previewSamplePdf: 'Interactive Book Preview',
    inquireWhatsapp: 'Inquire on WhatsApp',
    saveWishlist: 'Save to Wishlist',
    savedWishlist: 'Saved in Wishlist',
    backToCatalog: 'Back to Catalog',
    aboutEdition: 'About This Edition',
    bibliographicSpecs: 'Bibliographic Specifications',
    recommendedTitle: 'Recommended for Your Library',
    moreFromPublisher: 'Recommended Editions',

    wishlistTitle: 'My Wishlist',
    wishlistSubtitle:
      'Your saved editions are stored locally in this browser so you can revisit sample previews and order whenever ready.',
    wishlistEmptyTitle: 'Your wishlist is empty',
    wishlistEmptyDesc:
      'Tap the heart icon on any book card or details page to save favorite editions here for later.',
    addAllAvailable: 'Add All Available',
    clearWishlist: 'Clear Wishlist',
    browseCatalog: 'Browse Book Catalog',
    continueBrowsing: 'Continue Browsing Catalog →',

    supportHeading: 'Customer Contact & Order Tracking',
    supportSubtitle:
      'Send an inquiry directly to the Bhagwati Publications team, initiate a WhatsApp book query, or track the live fulfillment timeline of your order.',
    trackOrderHeading: 'Track Your Order',
    trackOrderHelp:
      'Enter your order reference number (e.g. BP-...) and the email address or phone number used at checkout.',
    sendMessageHeading: 'Send a Message',

    footerPartner: 'Supporting Digital Partner:',
    footerPublications: 'Publications',
    footerPublisherDesk: 'Publisher Desk',
    footerTrackOrder: 'Customer Support & Order Tracking',
    footerAdminPortal: 'Owner Admin Portal',
    footerDevelopedBy: 'Website Developed & Managed by',
  },
  hi: {
    brandName: 'भगवती पब्लिकेशंस',
    navCatalog: 'पुस्तक सूची',
    navNewReleases: 'नए प्रकाशन',
    navAuthors: 'लेखक',
    navUpdates: 'समाचार व अपडेट',
    navWishlist: 'पसंदीदा',
    navSupport: 'सहायता व ऑर्डर',
    navAdmin: 'एडमिन',
    navBag: 'बैग',

    heroEyebrow: 'भगवती पब्लिकेशंस · आधिकारिक स्टोरफ़्रंट',
    heroTitle: 'विद्वानों, संस्थानों और पाठकों के लिए प्रामाणिक व उच्च-स्तरीय पुस्तकें।',
    heroSubtitle:
      'भगवती पब्लिकेशंस शैक्षणिक मानविकी, वास्तुकला, व्यवसाय रणनीति और साहित्य में प्रमाणित संस्करण प्रकाशित और वितरित करता है। इंटरैक्टिव अध्याय पूर्वावलोकन पढ़ें और सीधे प्रकाशक से ऑर्डर करें।',
    heroExploreCatalog: 'पुस्तक सूची देखें',
    heroNewReleases: 'नए प्रकाशन',

    aboutEyebrow: 'भगवती पब्लिकेशंस के बारे में',
    aboutHeading: 'संपादकीय निष्ठा और पाठकों तक सीधी पहुँच पर आधारित आधुनिक प्रकाशन गृह।',
    aboutBody:
      'भगवती पब्लिकेशंस उत्कृष्ट संपादकीय मानकों, टिकाऊ मुद्रण और पारदर्शी डिजिटल वितरण का संगम है। हमारी सूची की प्रत्येक पुस्तक के साथ प्रमाणित ISBN विवरण, इंटरैक्टिव सैंपल पूर्वावलोकन, लाइव स्टॉक स्थिति और व्यक्तिगत व संस्थागत खरीदारों के लिए सीधी पूछताछ सुविधा उपलब्ध है।',
    aboutPoint1: 'प्रमाणित ISBN-13 सूची संस्करण',
    aboutPoint2: 'इंटरैक्टिव डिजिटल प्रीव्यू व सैंपल PDF',
    aboutPoint3: 'डायरेक्ट कार्ट, बाय नाउ व ऑर्डर ट्रैकिंग',
    aboutPoint4: 'व्हाट्सएप और संस्थागत थोक सहायता डेस्क',

    recentPublications: 'नवीनतम प्रकाशन',
    newReleasesTitle: 'नए प्रकाशन',
    viewAllNewReleases: 'सभी नए प्रकाशन देखें',

    editorialRoster: 'संपादकीय मंडल',
    ourAuthorsTitle: 'हमारे लेखक व संपादक',
    exploreAllAuthors: 'सभी लेखक देखें',
    viewProfile: 'प्रोफ़ाइल देखें →',

    leadershipEyebrow: 'नेतृत्व एवं दृष्टिकोण',
    leadershipHeading: 'संस्थापक एवं नेतृत्व परिचय',

    updatesEyebrow: 'प्रकाशन समाचार',
    updatesTitle: 'समाचार एवं प्रकाशन अपडेट',
    viewAllUpdates: 'सभी अपडेट देखें',
    updatesPageHeading: 'समाचार एवं प्रकाशन अपडेट',
    updatesPageSubtitle:
      'भगवती पब्लिकेशंस की ओर से नए संस्करण, विश्वविद्यालय पाठ्यक्रम सूचनाएँ और आधिकारिक प्रकाशन घोषणाएँ।',

    catalogTitle: 'संपूर्ण पुस्तक सूची',
    newReleasesCatalogTitle: 'नए प्रकाशन सूची',
    searchPlaceholder: 'शीर्षक, लेखक, ISBN या विषय खोजें...',
    allSubjects: 'सभी विषय',
    allLanguages: 'सभी भाषाएँ',
    allBindings: 'सभी बाइंडिंग',
    inStockOnly: 'केवल स्टॉक में उपलब्ध',
    minPrice: 'न्यूनतम मूल्य',
    maxPrice: 'अधिकतम मूल्य',
    advancedFilters: 'फ़िल्टर',
    resetFilters: 'फ़िल्टर रीसेट करें',
    sortNewest: 'क्रम: नवीनतम पहले',
    sortPriceAsc: 'मूल्य: कम से अधिक',
    sortPriceDesc: 'मूल्य: अधिक से कम',
    sortTitle: 'शीर्षक: A से Z',
    sortRating: 'सर्वश्रेष्ठ रेटेड',

    addToBag: 'बैग में जोड़ें',
    addToCart: 'कार्ट में जोड़ें',
    addedToBag: 'बैग में जोड़ा गया',
    buyNow: 'अभी खरीदें',
    unavailable: 'अनुपलब्ध',
    inStock: 'स्टॉक में उपलब्ध',
    outOfStock: 'स्टॉक समाप्त',
    samplePreview: 'प्रीव्यू',
    previewSamplePdf: 'इंटरैक्टिव पुस्तक प्रीव्यू',
    inquireWhatsapp: 'व्हाट्सएप पर पूछताछ करें',
    saveWishlist: 'पसंदीदा में सहेजें',
    savedWishlist: 'पसंदीदा में सहेजा गया',
    backToCatalog: 'सूची पर वापस जाएँ',
    aboutEdition: 'इस संस्करण के बारे में',
    bibliographicSpecs: 'ग्रंथसूची विवरण',
    recommendedTitle: 'आपके पुस्तकालय के लिए अनुशंसित',
    moreFromPublisher: 'अनुशंसित पुस्तकें',

    wishlistTitle: 'मेरी पसंदीदा सूची',
    wishlistSubtitle:
      'आपकी सहेजी गई पुस्तकें इस ब्राउज़र में सुरक्षित हैं ताकि आप कभी भी सैंपल पढ़ सकें और ऑर्डर कर सकें।',
    wishlistEmptyTitle: 'आपकी पसंदीदा सूची खाली है',
    wishlistEmptyDesc:
      'बाद में देखने के लिए किसी भी पुस्तक कार्ड या विवरण पृष्ठ पर दिल के आइकन पर क्लिक करें।',
    addAllAvailable: 'सभी उपलब्ध जोड़ें',
    clearWishlist: 'सूची साफ़ करें',
    browseCatalog: 'पुस्तक सूची देखें',
    continueBrowsing: 'पुस्तक सूची देखना जारी रखें →',

    supportHeading: 'ग्राहक संपर्क एवं ऑर्डर ट्रैकिंग',
    supportSubtitle:
      'भगवती पब्लिकेशंस टीम को सीधे संदेश भेजें, व्हाट्सएप पूछताछ शुरू करें, या अपने ऑर्डर की लाइव स्थिति ट्रैक करें।',
    trackOrderHeading: 'अपना ऑर्डर ट्रैक करें',
    trackOrderHelp:
      'अपना ऑर्डर संदर्भ नंबर (जैसे BP-...) और चेकआउट के समय उपयोग किया गया ईमेल या फ़ोन नंबर दर्ज करें।',
    sendMessageHeading: 'संदेश भेजें',

    footerPartner: 'सहयोगी डिजिटल पार्टनर:',
    footerPublications: 'प्रकाशन',
    footerPublisherDesk: 'प्रकाशक डेस्क',
    footerTrackOrder: 'ग्राहक सहायता व ऑर्डर ट्रैकिंग',
    footerAdminPortal: 'स्वामी एडमिन पोर्टल',
    footerDevelopedBy: 'वेबसाइट डेवलप व प्रबंधित:',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') return saved;
    } catch {
      // ignore storage errors
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // ignore storage errors
    }
  }, [language]);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey): string => TRANSLATIONS[language][key] || TRANSLATIONS.en[key];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: 'en' as AppLanguage,
      setLanguage: () => {},
      t: (key: TranslationKey) => TRANSLATIONS.en[key],
    };
  }
  return ctx;
}

export function LanguageToggle({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Interface language selector"
      className={`inline-flex items-center p-0.5 rounded-md border text-xs font-semibold shrink-0 ${
        variant === 'dark'
          ? 'bg-[#07111E] border-white/20 text-slate-300'
          : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={`px-2.5 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
          language === 'en'
            ? variant === 'dark'
              ? 'bg-[#C59B27] text-[#07111E]'
              : 'bg-[#0B192C] text-white'
            : variant === 'dark'
              ? 'hover:text-white'
              : 'hover:text-[#0B192C]'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        aria-pressed={language === 'hi'}
        className={`px-2.5 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
          language === 'hi'
            ? variant === 'dark'
              ? 'bg-[#C59B27] text-[#07111E]'
              : 'bg-[#0B192C] text-white'
            : variant === 'dark'
              ? 'hover:text-white'
              : 'hover:text-[#0B192C]'
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}
