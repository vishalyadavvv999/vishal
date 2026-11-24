import { useRef, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  KeyRound,
  Save,
  Store,
  Trash2,
  Upload,
  UserCheck,
} from 'lucide-react';
import type { AdminSettings, CurrencyCode, PaymentGatewayProvider } from '../../types';
import { api } from '../../lib/api';

interface AdminSettingsTabProps {
  settings: AdminSettings;
  onUpdated: (settings: AdminSettings) => void;
}

async function createPortraitCropFile(sourceFile: File): Promise<File> {
  const bitmapUrl = URL.createObjectURL(sourceFile);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode selected image'));
      el.src = bitmapUrl;
    });

    // Pure rectangular pixel crop that trims magazine top header and right-side text column
    // without touching or altering the portrait face or natural appearance.
    const sx = Math.round(img.naturalWidth * 0.01);
    const sy = Math.round(img.naturalHeight * 0.12);
    const sw = Math.max(100, Math.round(img.naturalWidth * 0.61));
    const sh = Math.max(100, Math.round(img.naturalHeight * 0.84));

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceFile;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.94)
    );
    if (!blob) return sourceFile;
    return new File([blob], 'leadership_portrait_cropped.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export function AdminSettingsTab({ settings, onUpdated }: AdminSettingsTabProps) {
  const [publisherName, setPublisherName] = useState(settings.publisher_name);
  const [supportEmail, setSupportEmail] = useState(settings.support_email);
  const [supportPhone, setSupportPhone] = useState(settings.support_phone);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number);
  const [businessAddress, setBusinessAddress] = useState(settings.business_address);
  const [currency, setCurrency] = useState<CurrencyCode>(settings.currency);
  const [freeThreshold, setFreeThreshold] = useState(String(settings.free_shipping_threshold));
  const [standardFee, setStandardFee] = useState(String(settings.standard_shipping_fee));

  // Leadership Profile fields
  const [founderName, setFounderName] = useState(settings.founder_name || 'Dr. S.B. Saraswat');
  const [founderDesignation, setFounderDesignation] = useState(
    settings.founder_designation || 'Director & Managing Head · Bhagwati Publications'
  );
  const [founderCredentials, setFounderCredentials] = useState(settings.founder_credentials || '');
  const [founderBio, setFounderBio] = useState(settings.founder_bio || '');
  const [founderPhotoUrl, setFounderPhotoUrl] = useState(settings.founder_photo_url || '');
  const [trimMagazineColumn, setTrimMagazineColumn] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [codEnabled, setCodEnabled] = useState(settings.payment_cod_enabled);
  const [upiEnabled, setUpiEnabled] = useState(settings.payment_upi_enabled);
  const [upiId, setUpiId] = useState(settings.payment_upi_id);
  const [gatewayProvider, setGatewayProvider] = useState<PaymentGatewayProvider>(
    settings.payment_gateway_provider
  );
  const [gatewayMode, setGatewayMode] = useState<'test' | 'live'>(settings.payment_gateway_mode);
  const [gatewayPublicKey, setGatewayPublicKey] = useState(settings.payment_gateway_public_key);
  const [gatewaySecretKey, setGatewaySecretKey] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError('');
    setSavedNotice('');
    setUploadingPhoto(true);
    try {
      const fileToUpload = trimMagazineColumn
        ? await createPortraitCropFile(selected)
        : selected;
      const res = await api.adminUploadLeadershipPhoto(fileToUpload);
      setFounderPhotoUrl(res.founder_photo_url);
      setSavedNotice('Original leadership portrait uploaded and applied to homepage.');
      onUpdated(res.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload portrait image');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setError('');
    setSavedNotice('');
    setUploadingPhoto(true);
    try {
      const res = await api.adminDeleteLeadershipPhoto();
      setFounderPhotoUrl('');
      setSavedNotice('Leadership portrait removed.');
      onUpdated(res.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove portrait');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedNotice('');
    setSaving(true);

    try {
      const updated = await api.adminUpdateSettings({
        publisher_name: publisherName.trim() || 'Bhagwati Publications',
        support_email: supportEmail.trim(),
        support_phone: supportPhone.trim(),
        whatsapp_number: whatsappNumber.trim(),
        business_address: businessAddress.trim(),
        currency,
        free_shipping_threshold: Number(freeThreshold) || 0,
        standard_shipping_fee: Number(standardFee) || 0,
        founder_name: founderName.trim() || 'Dr. S.B. Saraswat',
        founder_designation: founderDesignation.trim(),
        founder_credentials: founderCredentials.trim(),
        founder_bio: founderBio.trim(),
        payment_cod_enabled: codEnabled,
        payment_upi_enabled: upiEnabled,
        payment_upi_id: upiId.trim(),
        payment_gateway_provider: gatewayProvider,
        payment_gateway_mode: gatewayMode,
        payment_gateway_public_key: gatewayPublicKey.trim(),
        payment_gateway_secret_key: gatewaySecretKey.trim() || undefined,
        current_admin_password: currentPassword || undefined,
        new_admin_password: newPassword || undefined,
      });
      setGatewaySecretKey('');
      setCurrentPassword('');
      setNewPassword('');
      setSavedNotice('Settings saved and applied to storefront.');
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md">
          {error}
        </div>
      )}

      {savedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Leadership & Founder Profile Configuration */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <UserCheck className="w-4 h-4 text-[#9F7918]" />
          <h2 className="font-serif text-lg font-bold text-[#0B192C]">
            Founder &amp; Leadership Homepage Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Portrait Uploader */}
          <div className="md:col-span-4 space-y-3">
            <div className="aspect-[4/5] w-full max-w-[220px] rounded-md overflow-hidden border border-slate-300 bg-[#0B192C] relative flex items-center justify-center">
              {founderPhotoUrl ? (
                <img
                  src={founderPhotoUrl}
                  alt={founderName}
                  referrerPolicy="no-referrer"
                  className={
                    founderPhotoUrl === '/assets/aistudio/images_117439bb.jpg'
                      ? 'absolute -left-[2.5%] -top-[21%] w-[167%] max-w-none h-auto select-none'
                      : 'w-full h-full object-cover object-top'
                  }
                />
              ) : (
                <span className="text-xs text-slate-300 px-4 text-center">
                  No portrait uploaded yet
                </span>
              )}
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={trimMagazineColumn}
                onChange={(e) => setTrimMagazineColumn(e.target.checked)}
                className="accent-[#0B192C] mt-0.5"
              />
              <span>
                Auto-crop right text column &amp; top margin on magazine scan (preserves face unaltered)
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
                id="leadership-photo-input"
              />
              <label
                htmlFor="leadership-photo-input"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#DFC166]" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Upload Portrait'}</span>
              </label>

              {founderPhotoUrl && (
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 px-2.5 py-2 border border-rose-200 text-rose-700 text-xs font-medium rounded-md hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* Name, Designation, Bio */}
          <div className="md:col-span-8 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Director / Founder Full Name
                </label>
                <input
                  type="text"
                  value={founderName}
                  onChange={(e) => setFounderName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Official Designation
                </label>
                <input
                  type="text"
                  value={founderDesignation}
                  onChange={(e) => setFounderDesignation(e.target.value)}
                  placeholder="e.g. Director & Managing Head"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Academic &amp; Professional Credentials
              </label>
              <input
                type="text"
                value={founderCredentials}
                onChange={(e) => setFounderCredentials(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Leadership Biography
              </label>
              <textarea
                rows={4}
                value={founderBio}
                onChange={(e) => setFounderBio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Storefront & Contact Configuration */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Store className="w-4 h-4 text-[#9F7918]" />
          <h2 className="font-serif text-lg font-bold text-[#0B192C]">
            Publisher Details &amp; Storefront Shipping
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Publisher Name
            </label>
            <input
              type="text"
              value={publisherName}
              onChange={(e) => setPublisherName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Support Email (Public Storefront)
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="contact@yourdomain.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Support Phone Number
            </label>
            <input
              type="text"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="e.g. +91 ..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              WhatsApp Business Number (digits with country code)
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="e.g. 9198XXXXXXXX"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Business / Office Address
            </label>
            <input
              type="text"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Enter verified publishing house address"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Store Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Standard Shipping Fee
              </label>
              <input
                type="number"
                min="0"
                value={standardFee}
                onChange={(e) => setStandardFee(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Free Shipping Over
              </label>
              <input
                type="number"
                min="0"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono tabular-nums"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Configurable Payment Gateway */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <CreditCard className="w-4 h-4 text-[#9F7918]" />
          <h2 className="font-serif text-lg font-bold text-[#0B192C]">
            Configurable Payment Gateway
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="accent-[#0B192C]"
              />
              <span className="font-medium text-slate-800">Enable Cash on Delivery (COD)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={upiEnabled}
                onChange={(e) => setUpiEnabled(e.target.checked)}
                className="accent-[#0B192C]"
              />
              <span className="font-medium text-slate-800">Enable Direct UPI Payment</span>
            </label>
          </div>

          {upiEnabled && (
            <div className="max-w-md">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Merchant UPI ID (VPA)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="merchant@upi"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Online Payment Gateway Provider
              </label>
              <select
                value={gatewayProvider}
                onChange={(e) => setGatewayProvider(e.target.value as PaymentGatewayProvider)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm"
              >
                <option value="none">Disabled (Offline / COD / UPI only)</option>
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
                <option value="custom">Custom Gateway Adapter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Gateway Environment Mode
              </label>
              <select
                value={gatewayMode}
                onChange={(e) => setGatewayMode(e.target.value as 'test' | 'live')}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm"
              >
                <option value="test">Test / Sandbox Mode</option>
                <option value="live">Live Production Mode</option>
              </select>
            </div>

            {gatewayProvider !== 'none' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Publishable / Key ID
                  </label>
                  <input
                    type="text"
                    value={gatewayPublicKey}
                    onChange={(e) => setGatewayPublicKey(e.target.value)}
                    placeholder="pk_test_... or rzp_test_..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Secret Key{' '}
                    {settings.has_payment_gateway_secret ? '(Configured — leave blank to keep)' : ''}
                  </label>
                  <input
                    type="password"
                    value={gatewaySecretKey}
                    onChange={(e) => setGatewaySecretKey(e.target.value)}
                    placeholder={
                      settings.has_payment_gateway_secret ? '••••••••••••' : 'Enter secret key'
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Admin Security Password Change */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <KeyRound className="w-4 h-4 text-[#9F7918]" />
          <h2 className="font-serif text-lg font-bold text-[#0B192C]">
            Change Owner Password (Optional)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors disabled:opacity-60 cursor-pointer"
        >
          <Save className="w-4 h-4 text-[#DFC166]" />
          <span>{saving ? 'Saving Settings...' : 'Save Configuration'}</span>
        </button>
      </div>
    </form>
  );
}
