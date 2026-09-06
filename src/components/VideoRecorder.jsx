import { useState, useRef, useEffect } from 'react';
import { Camera, StopCircle, RefreshCcw, Check, Video } from 'lucide-react';

export default function VideoRecorder({ onVideoReady }) {
  const [recorderState, setRecorderState] = useState('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const MAX_SECONDS = 15;

  useEffect(() => {
    return () => {
      stopStream();
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (recordingTime >= MAX_SECONDS) stopRecording();
  }, [recordingTime]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setRecorderState('preview');
    } catch (err) {
      setError('Camera access denied or unavailable. Please allow access.');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : '';

    const mediaRecorder = new MediaRecorder(
      streamRef.current,
      mimeType ? { mimeType } : {}
    );

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = URL.createObjectURL(blob);
      }
      mediaRecorderRef.current._lastBlob = blob;
      setRecorderState('recorded');
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setRecorderState('recording');
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopStream();
  };

  const retakeVideo = () => {
    setRecordingTime(0);
    if (videoRef.current) videoRef.current.src = '';
    setRecorderState('idle');
  };

  const confirmVideo = () => {
    const blob = mediaRecorderRef.current?._lastBlob;
    if (blob && onVideoReady) onVideoReady(blob);
  };

  const progressPercent = (recordingTime / MAX_SECONDS) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="relative bg-[#09090b] rounded-2xl overflow-hidden aspect-video mb-6 premium-shadow">
        <video
          ref={videoRef}
          autoPlay
          muted={recorderState !== 'recorded'}
          playsInline
          controls={recorderState === 'recorded'}
          className="w-full h-full object-cover"
        />

        {recorderState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <Camera size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-medium">Camera will appear here</p>
          </div>
        )}

        {recorderState === 'recording' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-medium tabular-nums">
              {recordingTime}s / {MAX_SECONDS}s
            </span>
          </div>
        )}
      </div>

      {recorderState === 'recording' && (
        <div className="w-full bg-[#e4e4e7] rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-red-500 h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="flex justify-center gap-4 flex-wrap">
        {recorderState === 'idle' && (
          <button onClick={startCamera} className="bg-[#09090b] text-white px-8 py-3.5 rounded-full font-medium premium-hover-lift hover:bg-[#27272a] transition-all flex items-center gap-2">
            <Camera size={18} /> Enable Camera
          </button>
        )}
        {recorderState === 'preview' && (
          <button onClick={startRecording} className="bg-red-500 text-white px-8 py-3.5 rounded-full font-medium premium-hover-lift hover:bg-red-600 transition-all flex items-center gap-2">
            <Video size={18} /> Start Recording
          </button>
        )}
        {recorderState === 'recording' && (
          <button onClick={stopRecording} className="bg-[#09090b] text-white px-8 py-3.5 rounded-full font-medium premium-hover-lift hover:bg-[#27272a] transition-all flex items-center gap-2">
            <StopCircle size={18} /> Stop Recording
          </button>
        )}
        {recorderState === 'recorded' && (
          <>
            <button onClick={retakeVideo} className="bg-white text-[#09090b] border border-[#e4e4e7] px-8 py-3.5 rounded-full font-medium premium-hover-lift hover:border-gray-300 transition-all flex items-center gap-2">
              <RefreshCcw size={18} /> Retake
            </button>
            <button onClick={confirmVideo} className="bg-[#2563eb] text-white px-8 py-3.5 rounded-full font-medium premium-hover-lift hover:bg-[#1d4ed8] transition-all flex items-center gap-2">
              <Check size={18} /> Use Video
            </button>
          </>
        )}
      </div>
    </div>
  );
}
