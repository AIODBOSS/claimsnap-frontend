import React, { useState } from 'react';

const CLAIM_TYPES = [
  { value: 'vehicle', label: 'Vehicle Damage' },
  { value: 'property', label: 'Property / Home Damage' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'other', label: 'Other' },
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
  });
  const [errors, setErrors] = useState({});

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
    onSubmit(formData);
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
    </form>
  );
}

export default ClaimForm;
