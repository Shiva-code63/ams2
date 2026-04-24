import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkFaceRegistered, registerStudentFaces } from '../../services/api';

function blobToFile(blob, name) {
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

export default function RegisterFacePage() {
  const { user } = useAuth();
  const studentId = user?.userId;
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const qualityTimerRef = useRef(null);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCapturingBurst, setIsCapturingBurst] = useState(false);
  const [burstCount, setBurstCount] = useState(5);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [capturedFiles, setCapturedFiles] = useState([]);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [blurWarning, setBlurWarning] = useState(false);
  const [lightWarning, setLightWarning] = useState(false);
  const [qualityStats, setQualityStats] = useState({ brightness: null, blur: null });

  useEffect(() => {
    if (!studentId) return;

    let active = true;

    checkFaceRegistered(studentId)
      .then((data) => {
        if (!active) return;
        setFaceRegistered(Boolean(data?.faceRegistered));
      })
      .catch(() => {
        // Non-blocking; registration still can proceed.
      });

    return () => {
      active = false;
    };
  }, [studentId]);

  useEffect(() => {
    // Stop the camera if the user navigates away.
    return () => {
      if (qualityTimerRef.current) clearInterval(qualityTimerRef.current);
      qualityTimerRef.current = null;
      const stream = streamRef.current;
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
      streamRef.current = null;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    if (qualityTimerRef.current) clearInterval(qualityTimerRef.current);
    qualityTimerRef.current = null;
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
    }
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setIsCameraReady(false);
    setBlurWarning(false);
    setLightWarning(false);
    setQualityStats({ brightness: null, blur: null });
  };

  const startCamera = async () => {
    if (isCameraReady || isStartingCamera) return true;
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error('Camera is not supported in this browser');
      return false;
    }

    setIsStartingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // Wait until the video has dimensions; otherwise capture can be blank.
        await new Promise((resolve) => {
          const onReady = () => resolve();
          if (video.readyState >= 2) return resolve();
          video.addEventListener('loadedmetadata', onReady, { once: true });
        });
        await video.play();
      }

      setIsCameraReady(true);
      startQualityMonitor();
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

  const startQualityMonitor = () => {
    if (qualityTimerRef.current) clearInterval(qualityTimerRef.current);
    qualityTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      if (!video.videoWidth || !video.videoHeight) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const w = 160;
      const h = Math.round((video.videoHeight / video.videoWidth) * 160);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h);
      const { brightness, blurVar } = estimateBrightnessAndBlur(img);

      setQualityStats({ brightness: Math.round(brightness), blur: Math.round(blurVar) });
      setLightWarning(brightness < 60);
      setBlurWarning(blurVar < 100);
    }, 450);
  };

  const estimateBrightnessAndBlur = (imageData) => {
    const { data, width, height } = imageData;
    const gray = new Float32Array(width * height);

    let sum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const v = 0.299 * r + 0.587 * g + 0.114 * b;
      gray[p] = v;
      sum += v;
    }
    const brightness = sum / (width * height);

    // Variance of a simple 4-neighbor Laplacian.
    let lapSum = 0;
    let lapSumSq = 0;
    let n = 0;
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const c = gray[y * width + x];
        const lap = -4 * c + gray[y * width + (x - 1)] + gray[y * width + (x + 1)] + gray[(y - 1) * width + x] + gray[(y + 1) * width + x];
        lapSum += lap;
        lapSumSq += lap * lap;
        n += 1;
      }
    }

    const mean = lapSum / Math.max(1, n);
    const blurVar = lapSumSq / Math.max(1, n) - mean * mean;

    return { brightness, blurVar };
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    if (!video.videoWidth || !video.videoHeight) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Downscale to reduce upload size while keeping enough detail for recognition.
    const targetW = Math.min(640, video.videoWidth);
    const targetH = Math.round((video.videoHeight / video.videoWidth) * targetW);
    canvas.width = targetW;
    canvas.height = targetH;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    return blobToFile(blob, `face_${studentId}.jpg`);
  };

  const onCaptureAndSave = async () => {
    if (!studentId) return toast.error('Not logged in');

    // Browsers require user gesture for camera permission; only open camera when button is clicked.
    if (!isCameraReady) {
      const ok = await startCamera();
      if (ok) toast.success('Camera ready. Click again to capture.');
      return;
    }

    const count = Math.max(3, Math.min(5, Number(burstCount) || 5));
    setIsCapturingBurst(true);
    setCapturedFiles([]);
    setCaptureProgress(0);

    const files = [];
    for (let i = 0; i < count; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const file = await captureFrame();
      if (file) files.push(file);
      setCaptureProgress(Math.round(((i + 1) / count) * 100));
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 350));
    }

    if (files.length < 3) {
      setIsCapturingBurst(false);
      return toast.error('Could not capture enough images. Try again.');
    }

    setCapturedFiles(files);

    setIsSaving(true);
    try {
      if (import.meta.env.DEV) {
        const totalBytes = files.reduce((sum, f) => sum + (f?.size || 0), 0);
        // eslint-disable-next-line no-console
        console.info('[register-face] files=', files.length, 'totalBytes=', totalBytes);
      }
      const res = await registerStudentFaces(files);
      const accepted = res?.accepted ?? 0;
      const rejectedReasons = res?.rejectedReasons || [];
      if (accepted >= 3) {
        toast.success(`Face registered (${accepted}/${res?.requested ?? files.length})`);
        setFaceRegistered(true);
        // Turn off the camera after a successful save.
        stopCamera();
        // Send the student back to dashboard so they can see the saved image right away.
        setTimeout(() => navigate('/student'), 300);
      } else {
        toast.error(res?.message || 'Face registration failed');
      }
      if (rejectedReasons.length) {
        rejectedReasons.slice(0, 3).forEach((m) => toast.error(m));
      }
    } catch (error) {
      const payload = error?.response?.data?.data;
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to save face');
      const rejected = payload?.rejectedReasons || [];
      if (rejected.length) rejected.slice(0, 3).forEach((m) => toast.error(m));
    } finally {
      setIsSaving(false);
      setIsCapturingBurst(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <div className="card min-h-[420px]">
        <h3 className="text-xl font-semibold text-white">Register Face</h3>
        <div className="mt-6 grid gap-4">
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-cyan-400/30 bg-slate-950/60">
            <video ref={videoRef} className="h-[320px] w-full object-cover" playsInline muted />
            {isCameraReady && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[190px] w-[190px] rounded-3xl border-2 border-cyan-300/60 shadow-[0_0_0_9999px_rgba(2,6,23,0.35)]" />
              </div>
            )}
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                {isStartingCamera ? 'Opening camera...' : 'Click Capture to open camera'}
              </div>
            )}
          </div>

          {isCameraReady && (blurWarning || lightWarning) && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-300">
              <div className="flex flex-wrap items-center gap-2">
                {lightWarning && <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-200">Low light</span>}
                {blurWarning && <span className="rounded-full bg-rose-400/20 px-3 py-1 text-rose-200">Blurry</span>}
                <span className="text-slate-500">
                  Brightness: {qualityStats.brightness ?? '-'} | Blur: {qualityStats.blur ?? '-'}
                </span>
              </div>
              <div className="mt-2 text-slate-400">
                Tip: keep your face inside the box, improve lighting, and hold still for a second before capturing.
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
              <p className="text-xs text-slate-400">Preview</p>
              <img src={previewUrl} alt="Captured face preview" className="mt-2 w-full rounded-xl" />
            </div>
          )}

          {capturedFiles.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
              <p className="text-xs text-slate-400">Captured</p>
              <p className="mt-1 text-xs text-slate-500">
                {capturedFiles.length} images captured. Uploading and validating on backend.
              </p>
            </div>
          )}

          {isCapturingBurst && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Capture progress</span>
                <span>{captureProgress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-cyan-400/70" style={{ width: `${captureProgress}%` }} />
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="card">
        <h4 className="text-lg font-semibold text-white">Face Rules</h4>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          <li>Only one face image per student</li>
          <li>Re-registration is allowed</li>
          <li>Captured 3 to 5 images and stored in backend local storage</li>
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
          <span>Images to capture</span>
          <select
            className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
            value={burstCount}
            onChange={(e) => setBurstCount(e.target.value)}
            disabled={isSaving || isCapturingBurst}
          >
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>
        <button className="btn btn-primary mt-6 w-full" disabled={isSaving} onClick={onCaptureAndSave}>
          {isSaving || isCapturingBurst
            ? 'Processing...'
            : faceRegistered
              ? 'Capture and Re-register'
              : 'Capture and Register'}
        </button>
      </div>
    </div>
  );
}
