import { Link } from 'react-router-dom';
import { Camera, BrainCircuit, CheckCircle2, Clock, ShieldCheck, FileText } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-700 pb-20">
      
      {/* SECTION 1: Hero */}
      <section className="w-full pt-20 pb-16 px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#09090b] mb-6">
          Get Your Claim Approved <br className="hidden md:block" />
          in <span className="text-[#2563eb]">24 Hours.</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Record a quick video of your damage. Our custom-trained AI verifies authenticity and estimates severity in seconds. No waiting weeks, no endless paperwork.
        </p>
        
        <div className="flex justify-center gap-4 flex-wrap">
          <Link to="/submit-claim" className="bg-[#09090b] text-white px-8 py-3.5 rounded-full font-medium premium-hover-lift hover:bg-[#27272a] transition-all premium-shadow">
            Submit a Claim
          </Link>
          <a href="#how-it-works" className="bg-white text-[#09090b] border border-[#e4e4e7] px-8 py-3.5 rounded-full font-medium premium-hover-lift hover:border-gray-300 transition-all">
            How It Works
          </a>
        </div>
      </section>

      {/* SECTION 2: How It Works */}
      <section id="how-it-works" className="w-full py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#09090b] mb-12 tracking-tight">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Camera, title: 'Record Video', body: 'Use your phone to record a 10–15s video showing the damage clearly.' },
              { icon: BrainCircuit, title: 'AI Analysis', body: 'Our custom vision model detects damage type and severity in minutes.' },
              { icon: CheckCircle2, title: 'Get Approved', body: 'Legitimate claims get instant approval. Complex cases route to adjusters.' }
            ].map((step, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-[#e4e4e7] premium-hover-lift">
                <div className="w-12 h-12 bg-[#f0f9ff] text-[#2563eb] rounded-full flex items-center justify-center mb-6">
                  <step.icon size={24} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#09090b]">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Benefits */}
      <section className="w-full py-16 px-4 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#09090b] mb-8 tracking-tight">Why Choose ClaimSnap?</h2>
            <div className="space-y-6">
              {[
                { icon: Clock, title: 'Save Time', desc: 'No more waiting weeks for approval. Results in 24 hours.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: ShieldCheck, title: 'Transparent Process', desc: 'See exactly what the AI detected. No black box.', color: 'text-[#2563eb]', bg: 'bg-[#f0f9ff]' },
                { icon: FileText, title: 'No Paperwork', desc: 'Your video contains all the evidence we need.', color: 'text-amber-600', bg: 'bg-amber-50' }
              ].map((benefit, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${benefit.bg} ${benefit.color}`}>
                    <benefit.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#09090b] mb-1">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#09090b] rounded-3xl p-8 text-center text-white premium-shadow flex flex-col justify-center items-center h-full min-h-[300px]">
             <h3 className="text-2xl font-bold mb-4">Ready to file?</h3>
             <p className="text-gray-400 mb-8 max-w-sm">Experience faster, fairer insurance claims today.</p>
             <Link to="/submit-claim" className="bg-[#2563eb] text-white px-8 py-3 rounded-full font-medium premium-hover-lift hover:bg-[#1d4ed8] transition-all w-full max-w-xs">
               Get Started
             </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
