import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { checkFaceRegistered, markAttendanceByQR, verifyStudentFace } from '../../services/api';

function blobToFile(blob, name) {
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

export default function MarkAttendancePage() {
  const { user } = useAuth();
  const studentId = user?.userId;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  const [faceRegistered, setFaceRegistered] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [step, setStep] = useState('idle'); // idle | face | verifying | qr | marking | done
  const [statusText, setStatusText] = useState('Waiting for QR scan...');
  const [lastAttendance, setLastAttendance] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    if (!studentId) return;

    let active = true;
    checkFaceRegistered(studentId)
      .then((data) => {
        if (!active) return;
        setFaceRegistered(Boolean(data?.faceRegistered));
      })
      .catch(() => {
        // Non-blocking; user can still try.
      });

    return () => {
      active = false;
    };
  }, [studentId]);

  useEffect(() => {
    // Cleanup on unmount.
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
      const stream = streamRef.current;
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
      streamRef.current = null;
    };
  }, []);

  const stopCamera = () => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;

    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
    }
    streamRef.current = null;

    const video = videoRef.current;
    if (video) video.srcObject = null;

    setIsCameraReady(false);
  };

  const startCamera = async (mode) => {
    if (isStartingCamera) return false;
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error('Camera is not supported in this browser');
      return false;
    }

    setIsStartingCamera(true);
    try {
      stopCamera();

      const facingMode = mode === 'qr' ? 'environment' : 'user';
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await new Promise((resolve) => {
          const onReady = () => resolve();
          if (video.readyState >= 2) return resolve();
          video.addEventListener('loadedmetadata', onReady, { once: true });
        });
        await video.play();
      }

      setIsCameraReady(true);
      return true;
    } catch (err) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        toast.error('Camera permission denied');
      } else if (name === 'NotFoundError') {
        toast.error('No camera found on this device');
      } else {
        toast.error('Failed to open camera');
      }
      stopCamera();
      return false;
    } finally {
      setIsStartingCamera(false);
    }
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    if (!video.videoWidth || !video.videoHeight) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Downscale to reduce payload size (prevents request-size/network failures).
    const targetW = Math.min(640, video.videoWidth);
    const targetH = Math.round((video.videoHeight / video.videoWidth) * targetW);
    canvas.width = targetW;
    canvas.height = targetH;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.75));
    if (!blob) return null;
    return blobToFile(blob, `face_verify_${studentId}.jpg`);
  };

  const beginQrScanning = () => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);

    if (!('BarcodeDetector' in window)) {
      toast.error('QR scanning is not supported in this browser. Use Chrome/Edge.');
      setStatusText('QR scanning not supported in this browser.');
      setStep('idle');
      stopCamera();
      return;
    }

    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

    scanTimerRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || !isCameraReady || step !== 'qr') return;
      if (video.readyState < 2) return;

      try {
        const codes = await detector.detect(video);
        if (!codes || codes.length === 0) return;
        const raw = codes[0]?.rawValue || '';
        if (!raw) return;

        // Lock scanning as soon as we have a token.
        if (scanTimerRef.current) clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;

        setStep('marking');
        setStatusText('QR detected. Marking attendance...');
        stopCamera();

        const attendance = await markAttendanceByQR({ studentId, qrToken: raw });
        setLastAttendance(attendance);
        setStep('done');
        setStatusText(
          `Marked ${String(attendance?.status || 'PRESENT').toUpperCase()} for ${attendance?.subjectName || 'subject'} (${attendance?.subjectCode || ''}) on ${attendance?.attendanceDate || ''}.`
        );
        toast.success('Attendance marked');
      } catch (err) {
        const detail = err?.response?.data?.message || err?.response?.data?.detail;
        setStep('idle');
        setStatusText('Waiting for QR scan...');
        stopCamera();
        toast.error(detail || 'Failed to scan QR / mark attendance');
      }
    }, 500);
  };

  const onPrimaryClick = async () => {
    if (!studentId) return toast.error('Not logged in');
    setLastAttendance(null);
    setVerifyResult(null);

    if (!faceRegistered) {
      toast.error('Please register your face first');
      setStatusText('Face not registered. Go to Register Face first.');
      return;
    }

    if (step === 'idle') {
      // Browsers require user gesture for permission prompts; only open camera on click.
      setStatusText('Opening camera for face verification...');
      const ok = await startCamera('face');
      if (!ok) {
        setStatusText('Waiting for QR scan...');
        return;
      }
      setStep('face');
      setStatusText('Camera ready. Click again to verify your face.');
      toast.success('Camera ready');
      return;
    }

    if (step === 'face') {
      setStep('verifying');
      setStatusText('Liveness check: blink once, then turn head left, then right...');

      // Capture a short sequence for liveness + matching.
      const frames = [];
      for (let i = 0; i < 18; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const file = await captureFrame();
        if (file) frames.push(file);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 250));
      }

      if (frames.length < 10) {
        toast.error('Could not capture enough frames. Try again.');
        setStep('face');
        setStatusText('Camera ready. Click Verify Face to try again.');
        return;
      }

      try {
        if (import.meta.env.DEV) {
          const totalBytes = frames.reduce((sum, f) => sum + (f?.size || 0), 0);
          // eslint-disable-next-line no-console
          console.info('[verify-face] frames=', frames.length, 'totalBytes=', totalBytes);
        }
        const result = await verifyStudentFace(frames);
        setVerifyResult(result || null);
        const matched = Boolean(result?.matched);
        if (!matched) {
          const conf = Number.isFinite(result?.confidence) ? Math.round(result.confidence * 100) : null;
          const msg = result?.message || (result?.livenessPassed === false ? 'Liveness failed' : 'Face not matched');
          toast.error(conf != null ? `${msg} (${conf}%)` : msg);
          setStep('face');
          setStatusText(msg);
          return;
        }

        toast.success('Face verified. Now scan the QR.');
        setStatusText('Face verified. Opening QR scanner...');
        stopCamera();

        const ok = await startCamera('qr');
        if (!ok) {
          setStep('idle');
          setStatusText('Waiting for QR scan...');
          return;
        }

        setStep('qr');
        setStatusText('Scan the teacher QR code to mark attendance.');
        beginQrScanning();
      } catch (err) {
        const detail = err?.response?.data?.message || err?.response?.data?.detail;
        const fallback = err?.message || 'Face verification failed';
        toast.error(detail || fallback);
        setStep('face');
        setStatusText('Verification failed. Click Verify Face to try again.');
      }
    }

    if (step === 'done') {
      setStep('idle');
      setStatusText('Waiting for QR scan...');
    }
  };

  const buttonLabel =
    step === 'idle'
      ? isStartingCamera
        ? 'Opening camera...'
        : 'Open Camera'
      : step === 'face'
        ? 'Verify Face'
      : step === 'verifying'
          ? 'Verifying...'
          : step === 'qr'
            ? 'Scanning QR...'
            : step === 'marking'
              ? 'Marking...'
              : 'Start Again';

  const buttonDisabled = isStartingCamera || step === 'verifying' || step === 'qr' || step === 'marking';

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="card">
        <h3 className="text-xl font-semibold text-white">Mark Attendance</h3>
        <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-300">
          Face verification runs first, then the QR scanner opens for the valid session.
        </div>

        <div className="mt-6 relative overflow-hidden rounded-3xl border border-dashed border-cyan-400/30 bg-slate-950/60">
          <video ref={videoRef} className="h-[260px] w-full object-cover" playsInline muted />
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">
              {step === 'idle' ? 'Click Open Camera to start' : 'Camera is off'}
            </div>
          )}
        </div>

        <button className="btn btn-primary mt-6 w-full" disabled={buttonDisabled} onClick={onPrimaryClick}>
          {buttonLabel}
        </button>
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="card">
        <h4 className="text-lg font-semibold text-white">Session Status</h4>
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            {(step === 'verifying' || step === 'marking' || step === 'qr') && (
              <div className="mt-1 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300" />
            )}
            <div>{statusText}</div>
          </div>
          {verifyResult && (
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              <div>
                Match: {verifyResult.matched ? 'YES' : 'NO'} | Confidence:{' '}
                {Number.isFinite(verifyResult.confidence) ? `${Math.round(verifyResult.confidence * 100)}%` : '-'}
              </div>
              <div>
                Liveness: {verifyResult.livenessPassed ? 'PASSED' : 'FAILED'} | Distance: {verifyResult.rawDistance}
              </div>
            </div>
          )}
          {lastAttendance && (
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              <div>
                Subject: {lastAttendance.subjectName} ({lastAttendance.subjectCode})
              </div>
              <div>
                Time: {String(lastAttendance.attendanceTime || '').slice(0, 8)} | Marked by: {lastAttendance.markedBy}
              </div>
              <div>Status: {lastAttendance.status}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
