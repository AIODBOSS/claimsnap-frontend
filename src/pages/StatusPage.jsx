import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft, RefreshCw, Activity } from 'lucide-react';

export default function StatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:5000' 
    : 'https://web-production-47999.up.railway.app';

  useEffect(() => {
    const fetchClaimStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/claims/${id}`);
        if (!res.ok) throw new Error('Claim not found');
        const data = await res.json();
        setClaim(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchClaimStatus();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <RefreshCw className="w-10 h-10 text-[#2563eb] animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Retrieving verified claim details...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center bg-white rounded-3xl border border-[#e4e4e7] p-10 premium-shadow">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-[#09090b] mb-2">Claim Record Syncing</h2>
        <p className="text-gray-500 mb-6 text-sm">We are finalizing your assessment pipeline or the ID doesn't exist yet.</p>
        <button onClick={() => navigate('/admin')} className="px-6 py-3 bg-[#09090b] text-white rounded-xl font-bold text-sm">
          Go to Adjuster Portal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-[#e4e4e7] p-8 premium-shadow">
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-extrabold text-[#09090b]">Claim Assessment Result</h1>
            <p className="text-xs font-mono text-gray-400 mt-1">Reference ID: {claim.id}</p>
          </div>
          {claim.status === 'approved' && (
            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Approved
            </span>
          )}
          {claim.status === 'rejected' && (
            <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1.5">
              <XCircle size={16} /> Rejected
            </span>
          )}
          {claim.status === 'review' && (
            <span className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle size={16} /> Needs Review
            </span>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between text-sm py-2 border-b border-gray-50">
            <span className="text-gray-500">Claim Type</span>
            <span className="font-semibold text-gray-800 capitalize">{claim.claimType}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-gray-50">
            <span className="text-gray-500">Policy Number</span>
            <span className="font-mono font-semibold text-gray-800">{claim.policyNumber}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-gray-50">
            <span className="text-gray-500">AI Confidence Score</span>
            <span className="font-bold text-blue-600 flex items-center gap-1">
              <Activity size={14} /> {claim.aiConfidence ? `${claim.aiConfidence}%` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-gray-50">
            <span className="text-gray-500">AI Findings</span>
            <span className="font-medium text-gray-800 text-right">
              {Array.isArray(claim.aiFindings) ? claim.aiFindings.join(', ') : 'None'}
            </span>
          </div>
          {claim.adminCorrectedLabel && (
            <div className="flex justify-between text-sm py-2 border-b border-gray-50 bg-blue-50/50 px-3 rounded-xl">
              <span className="text-blue-700 font-semibold">Admin Corrected Label</span>
              <span className="font-bold text-blue-900">{claim.adminCorrectedLabel}</span>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button onClick={() => navigate('/')} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Home
          </button>
          <button onClick={() => navigate('/submit-claim')} className="flex-1 py-3 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors">
            File New Claim
          </button>
        </div>
      </div>
    </div>
  );
}
