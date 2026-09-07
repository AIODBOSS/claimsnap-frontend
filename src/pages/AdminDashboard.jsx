import { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, ShieldAlert, RefreshCw, X, AlertTriangle, Check, Video } from 'lucide-react';

export default function AdminDashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [correctedLabel, setCorrectedLabel] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [toast, setToast] = useState(null);

  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:5000' 
    : 'https://web-production-47999.up.railway.app';

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/claims`);
      const data = await res.json();
      setClaims(data);
    } catch (err) {
      console.error("Failed to load claims", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleOverride = async (statusOverride) => {
    if (!selectedClaim) return;
    const finalLabel = correctedLabel === 'Other' ? customLabel : correctedLabel;
    try {
      const res = await fetch(`${API_BASE}/api/admin/override/${selectedClaim.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusOverride,
          corrected_label: finalLabel || selectedClaim.aiFindings?.[0] || 'Unknown'
        })
      });

      if (!res.ok) throw new Error('Failed to save override');
      
      showToast(`Claim ${selectedClaim.id} successfully updated to ${statusOverride}.`);
      setSelectedClaim(null);
      setCorrectedLabel('');
      setCustomLabel('');
      fetchClaims();
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server.');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center w-max gap-1"><CheckCircle size={14}/> Approved</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center w-max gap-1"><XCircle size={14}/> Rejected</span>;
      case 'review': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center w-max gap-1"><ShieldAlert size={14}/> Needs Review</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-500 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 bg-[#09090b] text-white px-6 py-4 rounded-2xl premium-shadow flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
            <Check size={14} strokeWidth={3} />
          </div>
          <p className="text-sm font-medium">{toast}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#09090b] tracking-tight">Adjuster Portal</h1>
          <p className="text-gray-500 mt-2">Review AI decisions and manage human-in-the-loop active learning overrides.</p>
        </div>
        <button onClick={fetchClaims} className="bg-white border border-[#e4e4e7] text-[#09090b] px-5 py-2.5 rounded-full font-medium premium-hover-lift hover:border-gray-300 transition-all flex items-center gap-2">
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#e4e4e7] premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e4e4e7] text-gray-500 text-sm">
                <th className="p-5 font-semibold">Reference ID</th>
                <th className="p-5 font-semibold">Claim Type</th>
                <th className="p-5 font-semibold">AI Confidence</th>
                <th className="p-5 font-semibold">System Status</th>
                <th className="p-5 font-semibold">Admin Label</th>
                <th className="p-5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="p-12 text-center text-gray-500"><RefreshCw className="animate-spin w-8 h-8 text-[#2563eb] mx-auto mb-3"/> Fetching claims...</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan="6" className="p-12 text-center text-gray-500">No claims submitted yet.</td></tr>
              ) : (
                claims.map(claim => (
                  <tr key={claim.id} className="border-b border-gray-50 hover:bg-[#fafafa] transition-colors">
                    <td className="p-5 font-mono text-sm font-bold text-[#09090b]">{claim.id}</td>
                    <td className="p-5 text-sm text-gray-600 capitalize">{claim.claimType}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className={claim.aiConfidence > 75 ? "text-emerald-500" : "text-amber-500"} />
                        <span className="text-sm font-bold text-gray-700">{claim.aiConfidence ? `${claim.aiConfidence.toFixed(1)}%` : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-5">{getStatusBadge(claim.status)}</td>
                    <td className="p-5 text-sm text-gray-600 font-medium">{claim.adminCorrectedLabel || <span className="text-gray-400 italic">None</span>}</td>
                    <td className="p-5 text-right">
                      <button onClick={() => { 
                        setSelectedClaim(claim); 
                        const defaultLbl = claim.adminCorrectedLabel || '';
                        if (['Crack', 'Scratch', 'Dent', 'Mold', 'None'].includes(defaultLbl)) {
                          setCorrectedLabel(defaultLbl);
                          setCustomLabel('');
                        } else if (defaultLbl) {
                          setCorrectedLabel('Other');
                          setCustomLabel(defaultLbl);
                        } else {
                          setCorrectedLabel('');
                          setCustomLabel('');
                        }
                      }} className="text-[#2563eb] hover:text-blue-800 text-sm font-bold">Review Claim ?</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClaim && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden premium-shadow max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#e4e4e7] flex justify-between items-center bg-[#fafafa]">
              <h2 className="text-xl font-bold text-[#09090b]">Adjuster Review & Override</h2>
              <button onClick={() => setSelectedClaim(null)} className="text-gray-400 hover:text-gray-800"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Reference ID</span>
                <span className="font-mono font-bold text-[#09090b]">{selectedClaim.id}</span>
              </div>

              {/* Functional Video Preview Player */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative shadow-inner">
                {selectedClaim.videoUrl ? (
                  <video controls className="w-full h-full object-cover" src={selectedClaim.videoUrl}>
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center p-4">
                    <Video className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-medium">Evidence Stream for ({selectedClaim.id})</p>
                    <p className="text-[10px] text-gray-500 mt-1">Simulated Live Feed / Cached Evidence</p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">AI Findings</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {Array.isArray(selectedClaim.aiFindings) ? selectedClaim.aiFindings.filter(f => f.toLowerCase() !== '0').join(', ') || 'No specific defect identified' : 'None'}
                  </span>
                  <span className="text-sm font-bold text-[#2563eb]">{selectedClaim.aiConfidence ? `${selectedClaim.aiConfidence}% Confidence` : 'N/A'}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500"/> System Status: <strong className="capitalize">{selectedClaim.status}</strong>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Corrected Label (Active Learning Standard)</label>
                <select 
                  value={correctedLabel} 
                  onChange={(e) => setCorrectedLabel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#2563eb] mb-3"
                >
                  <option value="">Select standard classification...</option>
                  <option value="Crack">Crack / Fracture</option>
                  <option value="Scratch">Surface Scratch</option>
                  <option value="Dent">Structural Dent</option>
                  <option value="Mold">Water / Mold Damage</option>
                  <option value="None">No Damage / False Positive</option>
                  <option value="Other">Other (Custom Label)...</option>
                </select>

                {correctedLabel === 'Other' && (
                  <input 
                    type="text" 
                    value={customLabel} 
                    onChange={(e) => setCustomLabel(e.target.value)} 
                    placeholder="Enter custom damage class..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2563eb] animate-in fade-in"
                  />
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Action Override</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleOverride('approved')} className="w-full py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold text-sm transition-colors">
                    Force Approve
                  </button>
                  <button onClick={() => handleOverride('rejected')} className="w-full py-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl font-bold text-sm transition-colors">
                    Force Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
