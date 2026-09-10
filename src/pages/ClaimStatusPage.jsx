import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Activity, CheckCircle, AlertCircle, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: 'Pending Analysis', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Your claim is queued for AI analysis.' },
  analysing: { label: 'AI Analysing', icon: Activity, color: 'text-[#2563eb]', bg: 'bg-[#f0f9ff]', border: 'border-blue-200', desc: 'Our custom YOLOv8 model is processing your video.' },
  approved:  { label: 'Approved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'AI assessment completed. The claim has been provisionally approved by the prototype and may require insurer review before settlement.' },
  review:    { label: 'Under Review', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Flagged for adjuster review. We will contact you shortly.' },
  rejected:  { label: 'Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'This claim could not be verified by our system.' },
};

export default function ClaimStatusPage() {
  const { claimId } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClaim = async () => {
    try {
      const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5000' : 'https://web-production-47999.up.railway.app';
      const res = await fetch(`${API_BASE}/api/claims/${claimId}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setClaim(data);
    } catch {
      setError('Could not load claim. Please check your claim ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
    const interval = setInterval(() => {
      setClaim(c => {
        if (c && ['pending', 'analysing'].includes(c.status)) fetchClaim();
        return c;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [claimId]);

  if (loading) return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in">
      <RefreshCw className="w-10 h-10 text-[#2563eb] animate-spin mb-4" />
      <p className="text-gray-500 font-medium">Retrieving claim data...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in">
      <div className="bg-white p-8 rounded-3xl border border-[#e4e4e7] premium-shadow text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#09090b] mb-2">Claim Not Found</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link to="/" className="bg-[#09090b] text-white px-8 py-3.5 rounded-full font-medium premium-hover-lift transition-all">
          Return Home
        </Link>
      </div>
    </div>
  );

  const info = STATUS_CONFIG[claim.status] || STATUS_CONFIG.pending;
  const StatusIcon = info.icon;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#e4e4e7] premium-shadow">
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#09090b] tracking-tight">Claim Status</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-1 rounded inline-block">ID: {claimId}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${info.bg} ${info.border} ${info.color}`}>
            <StatusIcon size={16} strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-wide">{info.label}</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl ${info.bg} ${info.border} border mb-8 flex items-start gap-3`}>
          <p className={`text-sm font-medium ${info.color} leading-relaxed`}>{info.desc}</p>
        </div>

        <div className="space-y-1 mb-8">
          {[
            ['Claim Type', claim.claimType],
            ['Policy Number', claim.policyNumber],
            ['Submitted', new Date(claim.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })],
            claim.aiConfidence != null && ['AI Confidence', `${claim.aiConfidence}%`]
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              <span className="text-sm font-bold text-[#09090b] capitalize">{value}</span>
            </div>
          ))}
        </div>

        {claim.aiFindings?.length > 0 && (
          <div className="mb-8 p-5 bg-[#fafafa] rounded-2xl border border-gray-100">
            <h3 className="text-sm font-bold text-[#09090b] mb-3">AI Damage Detection</h3>
            <div className="flex flex-wrap gap-2">
              {claim.aiFindings.map((f, i) => (
                <span key={i} className="px-3 py-1.5 bg-white border border-gray-200 text-[#09090b] text-xs font-semibold rounded-lg premium-shadow">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/" className="flex-1 bg-white text-[#09090b] border border-[#e4e4e7] px-6 py-3.5 rounded-full font-medium premium-hover-lift hover:border-gray-300 transition-all flex justify-center items-center gap-2">
            <ArrowLeft size={18} /> Home
          </Link>
          <Link to="/submit-claim" className="flex-1 bg-[#2563eb] text-white px-6 py-3.5 rounded-full font-medium premium-hover-lift hover:bg-[#1d4ed8] transition-all text-center">
            File New Claim
          </Link>
        </div>

      </div>
    </div>
  );
}


