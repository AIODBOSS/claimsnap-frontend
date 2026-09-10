import { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, ShieldAlert, RefreshCw, X, AlertTriangle, Check, Video, Clock } from 'lucide-react';

const TAXONOMY_GROUPS = [
  {
    label: 'Vehicle Damage',
    classes: [
      ['vehicle_dent', 'Vehicle Dent'],
      ['bumper_damage', 'Bumper Damage'],
      ['glass_damage', 'Glass Damage'],
      ['light_damage', 'Light Damage'],
      ['mirror_damage', 'Mirror Damage'],
      ['runningboard_damage', 'Runningboard Damage'],
    ],
  },
  {
    label: 'Property & Home Damage',
    classes: [
      ['crack', 'Crack'],
      ['corrosion', 'Corrosion'],
      ['mold', 'Mold'],
      ['peeling', 'Peeling'],
      ['spalling', 'Spalling'],
    ],
  },
];

const TAXONOMY = TAXONOMY_GROUPS.flatMap(group => group.classes.map(([value]) => value));

const DISPLAY_NAMES = Object.fromEntries(
  TAXONOMY_GROUPS.flatMap(group => group.classes)
);

const normalizeFindings = (findings) => {
  if (!Array.isArray(findings)) return [];
  return findings
    .map(f => String(f).trim().toLowerCase())
    .filter(Boolean)
    .map(f => f.replace(/\s+/g, '_'))
    .map(f => TAXONOMY.includes(f) ? f : null)
    .filter(Boolean);
};

export default function AdminDashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [correctedLabels, setCorrectedLabels] = useState([]);
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

  const exportTrainingData = async (packageExport = false) => {
    try {
      const suffix = packageExport ? 'training-package' : 'training-feedback';
      const res = await fetch(`${API_BASE}/api/admin/export/${suffix}`);
      if (!res.ok) throw new Error('Training-data export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = packageExport ? 'claimsnap_training_package.zip' : 'claimsnap_training_feedback.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(packageExport ? 'Training package exported.' : 'Training feedback CSV exported.');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not export training data.');
    }
  };

  const openReview = (claim) => {
    setSelectedClaim(claim);

    // Important: an explicitly reviewed claim may legitimately have ZERO
    // administrator-selected classes (for example, a rejected/fabricated
    // or otherwise non-applicable claim). In that case, do not repopulate the
    // selector from the AI findings when reopening the review.
    const existing = Array.isArray(claim.adminCorrectedLabels)
      ? normalizeFindings(claim.adminCorrectedLabels)
      : normalizeFindings(claim.aiFindings);

    setCorrectedLabels(existing);
  };

  const toggleLabel = (value) => {
    setCorrectedLabels(prev =>
      prev.includes(value)
        ? prev.filter(label => label !== value)
        : [...prev, value]
    );
  };

  const handleOverride = async (decision) => {
    if (!selectedClaim) return;

    // An approval should identify at least one supported damage class.
    // A rejection may legitimately have zero selected classes when the
    // evidence is not applicable, appears fabricated, or does not show
    // any supported damage.
    if (decision === 'approved' && correctedLabels.length === 0) {
      alert('Select at least one applicable damage class before approving the claim.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/override/${selectedClaim.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          corrected_labels: correctedLabels,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to save administrator review');
      }

      showToast(`Claim ${selectedClaim.id} reviewed: ${decision}.`);
      setSelectedClaim(null);
      setCorrectedLabels([]);
      fetchClaims();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error connecting to backend server.');
    }
  };

  const getSystemStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center w-max gap-1">
            <CheckCircle size={14}/> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center w-max gap-1">
            <XCircle size={14}/> Rejected
          </span>
        );
      case 'review':
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center w-max gap-1">
            <ShieldAlert size={14}/> Needs Review
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const getAdminReviewBadge = (status) => {
    if (status === 'reviewed') {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center w-max gap-1">
          <Check size={14}/> Reviewed
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center w-max gap-1">
        <Clock size={14}/> Pending
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-500 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 bg-[#09090b] text-white px-6 py-4 rounded-2xl premium-shadow flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 z-[60]">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
            <Check size={14} strokeWidth={3} />
          </div>
          <p className="text-sm font-medium">{toast}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#09090b] tracking-tight">Adjuster Portal</h1>
          <p className="text-gray-500 mt-2">Review AI decisions and apply human administrator corrections when necessary.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button onClick={() => exportTrainingData(false)} className="bg-white border border-[#e4e4e7] text-[#09090b] px-5 py-2.5 rounded-full font-medium premium-hover-lift hover:border-gray-300 transition-all">Export CSV</button>
          <button onClick={() => exportTrainingData(true)} className="bg-[#09090b] text-white px-5 py-2.5 rounded-full font-medium premium-hover-lift hover:bg-black transition-all">Export Training Package</button>
          <button onClick={fetchClaims} className="bg-white border border-[#e4e4e7] text-[#09090b] px-5 py-2.5 rounded-full font-medium premium-hover-lift hover:border-gray-300 transition-all flex items-center gap-2"><RefreshCw size={16}/> Refresh Data</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#e4e4e7] premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e4e4e7] text-gray-500 text-sm">
                <th className="p-5 font-semibold">Reference ID</th>
                <th className="p-5 font-semibold">Claim Type</th>
                <th className="p-5 font-semibold">AI Confidence</th>
                <th className="p-5 font-semibold">AI System Status</th>
                <th className="p-5 font-semibold">Admin Review</th>
                <th className="p-5 font-semibold">Final Decision</th>
                <th className="p-5 font-semibold">Admin Findings</th>
                <th className="p-5 font-semibold text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-gray-500">
                    <RefreshCw className="animate-spin w-8 h-8 text-[#2563eb] mx-auto mb-3"/>
                    Fetching claims...
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-gray-500">
                    No claims submitted yet.
                  </td>
                </tr>
              ) : (
                claims.map(claim => (
                  <tr key={claim.id} className="border-b border-gray-50 hover:bg-[#fafafa] transition-colors">
                    <td className="p-5 font-mono text-sm font-bold text-[#09090b]">{claim.id}</td>

                    <td className="p-5 text-sm text-gray-600 capitalize">
                      {claim.claimType}
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Activity
                          size={16}
                          className={claim.aiConfidence > 75 ? "text-emerald-500" : "text-amber-500"}
                        />
                        <span className="text-sm font-bold text-gray-700">
                          {claim.aiConfidence != null ? `${claim.aiConfidence.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td className="p-5">
                      {getSystemStatusBadge(claim.aiStatus || claim.status)}
                    </td>

                    <td className="p-5">
                      {getAdminReviewBadge(claim.adminReviewStatus)}
                    </td>

                    <td className="p-5">
                      {claim.adminReviewStatus === 'reviewed' ? (
                        claim.adminDecision === 'approved' ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center w-max gap-1">
                            <CheckCircle size={14}/> Approved
                          </span>
                        ) : claim.adminDecision === 'rejected' ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center w-max gap-1">
                            <XCircle size={14}/> Rejected
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                            Not set
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 italic">Pending</span>
                      )}
                    </td>

                    <td className="p-5 text-sm text-gray-600 font-medium">
                      {claim.adminReviewStatus !== 'reviewed' ? (
                        <span className="text-gray-400 italic">Not reviewed</span>
                      ) : claim.adminCorrectedLabels?.length ? (
                        claim.adminCorrectedLabels.map(label => DISPLAY_NAMES[label] || label).join(', ')
                      ) : (
                        <span className="text-gray-400 italic">None selected</span>
                      )}
                    </td>

                    <td className="p-5 text-right">
                      <button
                        onClick={() => openReview(claim)}
                        className="text-[#2563eb] hover:text-blue-800 text-sm font-bold"
                      >
                        {claim.adminReviewStatus === 'reviewed' ? 'View Review →' : 'Review Claim →'}
                      </button>
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
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden premium-shadow max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-[#e4e4e7] flex justify-between items-center bg-[#fafafa]">
              <div>
                <h2 className="text-xl font-bold text-[#09090b]">Administrator Review</h2>
                <p className="text-xs text-gray-500 mt-1">Human-in-the-loop correction and final decision</p>
              </div>

              <button
                onClick={() => setSelectedClaim(null)}
                className="text-gray-400 hover:text-gray-800"
              >
                <X size={20}/>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Reference ID</span>
                <span className="font-mono font-bold text-[#09090b]">{selectedClaim.id}</span>
              </div>

              <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative shadow-inner">
                {selectedClaim.videoUrl ? (
                  <video
                    controls
                    src={`${API_BASE}${selectedClaim.videoUrl}`}
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center p-4 text-gray-400">
                    <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No video asset attached to this record.</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex flex-wrap gap-4 justify-between items-start">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">AI Findings</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedClaim.aiFindings || []).map((finding, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-[#09090b] text-xs font-semibold rounded-lg premium-shadow"
                        >
                          {finding}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">AI Confidence</p>
                    <p className="text-lg font-extrabold text-[#2563eb] mt-1">
                      {selectedClaim.aiConfidence != null ? `${selectedClaim.aiConfidence}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500"/>
                    AI System Status:
                    <strong className="capitalize">{selectedClaim.aiStatus || selectedClaim.status}</strong>
                  </p>

                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    {selectedClaim.adminReviewStatus === 'reviewed' ? (
                      <Check size={16} className="text-blue-600"/>
                    ) : (
                      <Clock size={16} className="text-gray-500"/>
                    )}
                    Administrator Review:
                    <strong className="capitalize">{selectedClaim.adminReviewStatus || 'pending'}</strong>
                  </p>

                  {selectedClaim.adminReviewStatus === 'reviewed' && (
                    <p className="text-sm text-gray-600 flex items-center gap-2 sm:col-span-2">
                      {selectedClaim.adminDecision === 'approved' ? (
                        <CheckCircle size={16} className="text-emerald-600"/>
                      ) : (
                        <XCircle size={16} className="text-red-600"/>
                      )}
                      Administrator Decision:
                      <strong className="capitalize">{selectedClaim.adminDecision || 'not recorded'}</strong>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">AI System Status</p>
                  <div className="mt-2">{getSystemStatusBadge(selectedClaim.aiStatus || selectedClaim.status)}</div>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Administrator Review</p>
                  <div className="mt-2">{getAdminReviewBadge(selectedClaim.adminReviewStatus)}</div>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Final Decision</p>
                  <div className="mt-2">
                    {selectedClaim.adminDecision === 'approved' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center w-max gap-1">
                        <CheckCircle size={14}/> Approved
                      </span>
                    ) : selectedClaim.adminDecision === 'rejected' ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center w-max gap-1">
                        <XCircle size={14}/> Rejected
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">Pending</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Corrected Damage Findings
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      Select every supported damage class that is actually visible in the evidence.
                      You may reject a claim without selecting a class when the evidence is not applicable.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#2563eb]">
                    {correctedLabels.length} selected
                  </span>
                </div>

                <div className="space-y-4">
                  {TAXONOMY_GROUPS.map(group => (
                    <div key={group.label} className="rounded-2xl border border-gray-200 p-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        {group.label}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.classes.map(([value, label]) => {
                          const checked = correctedLabels.includes(value);

                          return (
                            <label
                              key={value}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                checked
                                  ? 'border-blue-300 bg-blue-50'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleLabel(value)}
                                className="h-4 w-4 accent-blue-600"
                              />
                              <span className="text-sm font-semibold text-gray-800">
                                {label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Model Improvement</p>
                    <p className="text-sm text-gray-700 mt-1">{selectedClaim.modelImprovementConsent ? 'User consent granted.' : 'User did not grant consent.'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedClaim.trainingEligible ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{selectedClaim.trainingEligible ? 'Training eligible' : 'Not eligible'}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Administrator Decision
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleOverride('approved')}
                    className="w-full py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold text-sm transition-colors"
                  >
                    Approve Claim
                  </button>

                  <button
                    onClick={() => handleOverride('rejected')}
                    className="w-full py-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl font-bold text-sm transition-colors"
                  >
                    Reject Claim
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
