import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { generateQRSession, listTeacherSubjects, stopQRSession } from '../../services/api';

function secondsUntil(expiresAt) {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}

export default function GenerateQRPage() {
  const { user } = useAuth();
  const teacherId = user?.userId;

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [session, setSession] = useState(null);
  const [tick, setTick] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshEndAt, setAutoRefreshEndAt] = useState(null);

  const remaining = useMemo(() => secondsUntil(session?.expiresAt), [session?.expiresAt, tick]);
  const autoRemaining = useMemo(() => {
    if (!autoRefreshEndAt) return 0;
    const ms = autoRefreshEndAt - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
  }, [autoRefreshEndAt, tick]);

  const loadSubjects = async () => {
    if (!teacherId) return;
    setIsLoadingSubjects(true);
    try {
      const data = await listTeacherSubjects(teacherId);
      const list = Array.isArray(data) ? data : [];
      setSubjects(list);
      setSubjectId((prev) => prev || (list[0]?.id ? String(list[0].id) : ''));
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to load subjects');
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  useEffect(() => {
    if (!session?.expiresAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(interval);
  }, [session?.expiresAt]);

  // Auto-refresh QR every 5 seconds while a session is active.
  useEffect(() => {
    if (!session?.expiresAt) return;
    if (!subjectId) return;
    if (!autoRefreshEnabled) return;
    if (!autoRefreshEndAt) return;
    if (Date.now() >= autoRefreshEndAt) {
      setAutoRefreshEnabled(false);
      return;
    }

    const expiresAtMs = new Date(session.expiresAt).getTime();
    let cancelled = false;
    let inFlight = false;

    const refresh = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const data = await generateQRSession({ subjectId: Number(subjectId) });
        if (!cancelled) {
          setSession(data);
          setTick(0);
        }
      } catch (error) {
        const detail = error?.response?.data?.message || error?.response?.data?.detail;
        if (!cancelled) toast.error(detail || 'Failed to refresh QR');
      } finally {
        inFlight = false;
      }
    };

    const interval = setInterval(() => {
      if (cancelled) return;
      const now = Date.now();

      if (now >= autoRefreshEndAt) {
        clearInterval(interval);
        setAutoRefreshEnabled(false);
        return;
      }

      // If the current session expired (tab was inactive / network issues), stop auto-refresh.
      if (Number.isFinite(expiresAtMs) && now >= expiresAtMs) {
        clearInterval(interval);
        setAutoRefreshEnabled(false);
        return;
      }

      refresh();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.expiresAt, subjectId, autoRefreshEnabled, autoRefreshEndAt]);

  const onGenerate = async () => {
    if (!subjectId) return toast.error('Select a subject first');
    setIsGenerating(true);
    try {
      const data = await generateQRSession({ subjectId: Number(subjectId) });
      setSession(data);
      setTick(0);
      // Auto-refresh window is capped to 30 seconds total.
      setAutoRefreshEndAt(Date.now() + 30_000);
      setAutoRefreshEnabled(true);
      toast.success('QR session generated');
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to generate QR');
    } finally {
      setIsGenerating(false);
    }
  };

  const onStop = async () => {
    if (!session?.qrToken) return;
    setIsStopping(true);
    try {
      await stopQRSession(session.qrToken);
      toast.success('QR session stopped');
      setAutoRefreshEnabled(false);
      setAutoRefreshEndAt(null);
      setSession(null);
      setTick(0);
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to stop QR');
    } finally {
      setIsStopping(false);
    }
  };

  // Hard stop the session after 30 seconds total (even if the last refreshed QR is still valid).
  useEffect(() => {
    if (!autoRefreshEndAt) return;
    if (!session?.qrToken) return;

    const ms = autoRefreshEndAt - Date.now();
    if (ms <= 0) {
      setAutoRefreshEnabled(false);
      setAutoRefreshEndAt(null);
      setSession(null);
      setTick(0);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      if (cancelled) return;
      setAutoRefreshEnabled(false);
      try {
        await stopQRSession(session.qrToken);
      } catch {
        // If stop fails (backend down etc.), still hide the QR locally to honor the 30s window.
      } finally {
        if (!cancelled) {
          setAutoRefreshEndAt(null);
          setSession(null);
          setTick(0);
        }
      }
    }, ms);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [autoRefreshEndAt, session?.qrToken]);

  const canGenerate = !isLoadingSubjects && subjects.length > 0 && !isGenerating;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="card">
        <h3 className="text-xl font-semibold text-white">Generate QR</h3>

        <label className="label mt-6">Subject</label>
        <select
          className="field"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={isLoadingSubjects || subjects.length === 0}
        >
          {subjects.length === 0 ? (
            <option value="">No subjects assigned</option>
          ) : (
            subjects.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.subjectName}
              </option>
            ))
          )}
        </select>

        <button disabled={!canGenerate} onClick={onGenerate} className="btn btn-primary mt-4 w-full">
          {isGenerating ? 'Generating...' : 'Generate Session QR'}
        </button>

        {session?.qrToken && (
          <button onClick={onStop} className="btn btn-secondary mt-3 w-full" disabled={isStopping}>
            {isStopping ? 'Stopping...' : 'Stop Session'}
          </button>
        )}

        {subjects.length === 0 && !isLoadingSubjects && (
          <p className="mt-3 text-sm text-slate-300">
            Add a subject from Teacher {String.fromCharCode(8594)} Subjects first.
          </p>
        )}
      </div>

      <div className="card flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          {session?.qrCodeImage ? (
            <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <img
                src={session.qrCodeImage}
                alt="Session QR"
                className="h-full w-full rounded-2xl bg-white p-2"
              />
            </div>
          ) : (
            <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl border border-dashed border-cyan-400/30 bg-slate-950/60 text-slate-300">
              QR Canvas
            </div>
          )}

          <p className="mt-4 text-sm text-slate-300">
            {session?.expiresAt ? (
              <>
                Expires in {remaining}s. Auto-refresh every 5s, stops in {autoRemaining}s.
              </>
            ) : (
              '30-second session. Generate to display the QR code.'
            )}
          </p>
          {session?.qrToken && (
            <p className="mt-2 text-xs text-slate-400">
              Token: ...{String(session.qrToken).slice(-8)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
