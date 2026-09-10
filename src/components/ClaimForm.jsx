import React, { useState } from 'react';
import { Brain, ShieldCheck, X } from 'lucide-react';

const CLAIM_TYPES = [
  { value: 'vehicle', label: 'Vehicle Damage' },
  { value: 'property', label: 'Property / Home Damage' },
];

const inputStyles = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none shadow-sm text-gray-800";

const Field = ({ label, required, error, children }) => (
  <div className="mb-5">
    <label className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
      <span>{label} {required && <span className="text-red-500">*</span>}</span>
      {error && <span className="text-red-500 font-medium animate-pulse">{error}</span>}
    </label>
    {children}
  </div>
);

function ClaimForm({ onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    claimType: '', description: '', policyNumber: '',
    contactPhone: '', incidentDate: '',
    modelImprovementConsent: false,
  });
  const [errors, setErrors] = useState({});
  const [showConsentModal, setShowConsentModal] = useState(false);

  const validate = () => {
    const e = {};
    if (!formData.claimType) e.claimType = 'Required';
    if (formData.description.length < 20) e.description = 'Need more detail (min 20 chars)';
    if (!formData.policyNumber) e.policyNumber = 'Required';
    if (!formData.incidentDate) e.incidentDate = 'Required';
    return e;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setShowConsentModal(true);
  };

  const submitWithConsent = (consent) => {
    const updated = { ...formData, modelImprovementConsent: consent };
    setFormData(updated);
    setShowConsentModal(false);
    onSubmit(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mt-4">
      <div className="space-y-2">
        <Field label="What kind of claim is this?" required error={errors.claimType}>
          <select
            value={formData.claimType}
            onChange={e => handleChange('claimType', e.target.value)}
            className={`${inputStyles} ${errors.claimType ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : ''}`}
          >
            <option value="">Select an option...</option>
            {CLAIM_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <Field label="Policy Number" required error={errors.policyNumber}>
            <input
              type="text"
              value={formData.policyNumber}
              onChange={e => handleChange('policyNumber', e.target.value)}
              placeholder="e.g. CS-99231"
              className={`${inputStyles} ${errors.policyNumber ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : ''}`}
            />
          </Field>

          <Field label="Date of Incident" required error={errors.incidentDate}>
            <input
              type="date"
              value={formData.incidentDate}
              onChange={e => handleChange('incidentDate', e.target.value)}
              className={`${inputStyles} ${errors.incidentDate ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : ''}`}
            />
          </Field>
        </div>

        <Field label="Detailed Description" required error={errors.description}>
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            rows={5}
            placeholder="Please describe exactly what happened..."
            className={`${inputStyles} resize-none ${errors.description ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : ''}`}
          />
          <div className="flex justify-between mt-2 px-1">
             <p className="text-xs text-gray-500 italic">Be as descriptive as possible for faster AI verification.</p>
             <p className={`text-xs font-mono font-medium ${formData.description.length < 20 ? 'text-orange-500' : 'text-green-600'}`}>
               {formData.description.length}/20
             </p>
          </div>
        </Field>

        <Field label="Contact Phone (Optional)">
          <input
            type="tel"
            value={formData.contactPhone}
            onChange={e => handleChange('contactPhone', e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={inputStyles}
          />
        </Field>

        <div className="pt-6 pb-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm uppercase tracking-widest font-bold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Analyzing AI Evidence...' : 'Verify My Claim'}
          </button>
        </div>
      </div>

      {showConsentModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-2xl">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Brain size={21} /></div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#09090b]">Help improve ClaimSnap</h2>
                  <p className="text-xs text-gray-500 mt-1">Optional model-improvement consent</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowConsentModal(false)} className="text-gray-400 hover:text-gray-800"><X size={20}/></button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm leading-6 text-gray-600">Your claim can be submitted without this permission. If you choose to allow it, your submitted video and related assessment information may be retained for research and future improvement of ClaimSnap's damage-detection model.</p>
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">Your claim assessment does not depend on this choice. Only consented and administrator-reviewed records can become eligible for future model-improvement export.</div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" onClick={() => submitWithConsent(false)} className="px-5 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold hover:bg-gray-50 transition">Not now &amp; submit</button>
                <button type="button" onClick={() => submitWithConsent(true)} className="px-5 py-3.5 rounded-xl bg-[#09090b] text-white font-semibold hover:bg-black transition flex items-center justify-center gap-2"><ShieldCheck size={17}/> Allow &amp; submit</button>
              </div>
              <p className="mt-4 text-[11px] text-gray-400 text-center">Consent version 1.0</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default ClaimForm;
