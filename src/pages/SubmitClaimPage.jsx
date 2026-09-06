import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoRecorder from '../components/VideoRecorder';
import ClaimForm from '../components/ClaimForm';
import { Check, Video, FileText, Loader2, ArrowLeft } from 'lucide-react';

const STEPS = { VIDEO: 'video', FORM: 'form', SUBMITTING: 'submitting' };

export default function SubmitClaimPage() {
  const [step, setStep] = useState(STEPS.VIDEO);
  const [videoBlob, setVideoBlob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleVideoReady = (blob) => {
    setVideoBlob(blob);
    setStep(STEPS.FORM);
  };

  const handleFormSubmit = async (formData) => {
    if (!videoBlob) return;
    setIsSubmitting(true);
    setStep(STEPS.SUBMITTING);

    try {
      const data = new FormData();
      data.append('video', videoBlob, 'claim-video.webm');
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/claims`, {
        method: 'POST',
        body: data
      });

      if (!response.ok) throw new Error('Submission failed');
      const result = await response.json();
      navigate(`/status/${result.claimId}`);
    } catch {
      alert('Submission failed. Ensure backend is running.');
      setIsSubmitting(false);
      setStep(STEPS.FORM);
    }
  };

  const stepLabels = ['Record Video', 'Claim Details', 'Processing'];
  const stepKeys = [STEPS.VIDEO, STEPS.FORM, STEPS.SUBMITTING];
  const currentIndex = stepKeys.indexOf(step);

  return (
    <div className="w-full max-w-3xl mx-auto py-12 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-[#09090b] mb-3">Submit a Claim</h1>
        <p className="text-gray-600">Record a video of the damage, then fill in the details.</p>
      </div>

      <div className="flex items-center justify-center mb-12">
        {stepLabels.map((label, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isDone ? 'bg-[#2563eb] text-white' : isActive ? 'bg-[#09090b] text-white' : 'bg-[#e4e4e7] text-gray-500'}`}>
                  {isDone ? <Check size={18} strokeWidth={3} /> : i + 1}
                </div>
                <span className={`text-sm font-semibold hidden sm:block ${isActive ? 'text-[#09090b]' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className="w-12 sm:w-16 h-[2px] bg-[#e4e4e7] mx-3 sm:mx-4" />}
            </div>
          );
        })}
      </div>

      {step === STEPS.VIDEO && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#e4e4e7] premium-shadow">
          <div className="flex items-center gap-3 mb-8">
            <Video className="text-[#2563eb]" size={24} />
            <h2 className="text-2xl font-bold text-[#09090b]">Record Damage Video</h2>
          </div>
          <VideoRecorder onVideoReady={handleVideoReady} />
        </div>
      )}

      {step === STEPS.FORM && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#e4e4e7] premium-shadow">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <FileText className="text-[#2563eb]" size={24} />
              <h2 className="text-2xl font-bold text-[#09090b]">Claim Details</h2>
            </div>
            <button onClick={() => setStep(STEPS.VIDEO)} className="text-sm font-medium text-gray-500 hover:text-[#09090b] flex items-center gap-1 transition-colors">
              <ArrowLeft size={16} /> Re-record
            </button>
          </div>
          <ClaimForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
        </div>
      )}

      {step === STEPS.SUBMITTING && (
        <div className="bg-white p-16 rounded-3xl border border-[#e4e4e7] premium-shadow text-center">
          <Loader2 className="w-16 h-16 text-[#2563eb] animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[#09090b] mb-3">Uploading & Analyzing...</h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            Your video is being processed by our custom YOLOv8 model. Please don't close this tab.
          </p>
        </div>
      )}
    </div>
  );
}
