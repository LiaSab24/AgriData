import { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Map as MapIcon, 
  Download, 
  Settings, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  ExternalLink,
  ShieldAlert,
  Trash2,
  FileArchive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogEntry {
  timestamp: string;
  source: string;
  message: string;
  data?: any;
}

// Liefert den API-Token-Header fuer geschuetzte Endpunkte (Loeschen + Tasks).
// Der Token kommt aus VITE_API_TOKEN (.env) und wird von Vite zur Build-/Dev-Zeit eingebettet.
const authHeaders = (): Record<string, string> => {
  const token = import.meta.env.VITE_API_TOKEN as string | undefined;
  return token ? { 'x-api-token': token } : {};
};

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logType, setLogType] = useState<'download' | 'image' | 'error' | 'system'>('image');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const fetchFiles = async () => {
    setFetchingFiles(true);
    try {
      const res = await fetch('/api/files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (e) {
      console.error('Failed to fetch files:', e);
    } finally {
      setFetchingFiles(false);
    }
  };

  const deleteFile = async (filePath: string) => {
    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ filePath })
      });
      
      if (res.ok) {
        await fetchFiles();
        setDeletingPath(null);
      } else {
        const errorData = await res.json();
        alert(`Fehler beim Löschen: ${errorData.error}\nDetails: ${errorData.detail || 'Keine weiteren Details'}`);
        setDeletingPath(null);
      }
    } catch (e) {
      console.error('Failed to delete file:', e);
      alert('Netzwerkfehler beim Löschen');
      setDeletingPath(null);
    }
  };

  const [isClearingLogs, setIsClearingLogs] = useState(false);

  const clearLogs = async () => {
    try {
      const res = await fetch(`/api/logs/${logType}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        setLogs([]);
        await fetchLogs(logType);
        setIsClearingLogs(false);
      }
    } catch (e) {
      console.error('Failed to clear logs:', e);
      setIsClearingLogs(false);
    }
  };

  const fetchLogs = async (type: string) => {
    try {
      const res = await fetch(`/api/logs/${type}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Failed to fetch status:', e);
      // Fallback for debugging
      if (e instanceof Error) {
        console.error('Error message:', e.message);
      }
    }
  };

  const triggerTask = async (task: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task}`, { method: 'POST', headers: authHeaders() });
      if (!res.ok) throw new Error('Task returned error');
      
      await fetchLogs(logType);
      await fetchFiles();
      
      // Give it another fetch after a short delay in case of IO lag
      setTimeout(fetchFiles, 2000);
      
    } catch (e) {
      console.error('Task execution error:', e);
      alert('Task fehlgeschlagen. Bitte prüfe die Fehler-Logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClearingLogs(false);
    fetchLogs(logType);
    fetchStatus();
    fetchFiles();
    const interval = setInterval(() => {
      fetchLogs(logType);
      fetchStatus();
      fetchFiles();
    }, 10000);
    return () => clearInterval(interval);
  }, [logType]);

  return (
    <div className="min-h-screen bg-transparent text-neutral-200 font-sans selection:bg-blue-500/30 grid-pattern">
      {/* Decorative background elements */}
      <div className="fixed top-0 right-0 p-12 opacity-10 pointer-events-none">
        <CloudSun className="w-96 h-96 text-blue-400 rotate-12 blur-3xl animate-pulse" />
      </div>
      <div className="fixed bottom-0 left-0 p-12 opacity-10 pointer-events-none">
        <div className="w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px] animate-pulse" />
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-neutral-900/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2.5 bg-blue-500/20 rounded-2xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <CloudSun className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl tracking-tighter bg-gradient-to-br from-white via-white to-blue-500 bg-clip-text text-transparent italic">AgriData DWD</h1>
              <p className="text-[9px] text-blue-500/60 font-mono uppercase tracking-[0.4em] font-bold">Precision Agriculture Monitoring</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-lg backdrop-blur-md">
              <div className={`w-2 h-2 rounded-full ${status ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-100">{status ? 'System Online' : 'System Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dashboard Left: Controls & Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            <section className="glass-card rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500 opacity-50" />
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <Settings className="w-4 h-4 animate-[spin_4s_linear_infinite]" /> Steuerung
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => triggerTask('images')}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors border border-blue-500/20">
                      <MapIcon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-blue-50">Bilder / Images laden</p>
                      <p className="text-[11px] text-neutral-400 font-medium">Direkt-Download DWD (.png)</p>
                    </div>
                  </div>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> : <RefreshCw className="w-4 h-4 text-neutral-600 group-hover:text-blue-400 transition-colors" />}
                </button>
 
                <button
                  onClick={() => triggerTask('downloads')}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors border border-emerald-500/20">
                      <Download className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-emerald-50">DWD Klimadaten</p>
                      <p className="text-[11px] text-neutral-400 font-medium">CDC Tageswerte (ZIP)</p>
                    </div>
                  </div>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <RefreshCw className="w-4 h-4 text-neutral-600 group-hover:text-emerald-400 transition-colors" />}
                </button>

                {/* Offen zugaenglicher Download aller Bilder als ZIP (kein Token noetig) */}
                <a
                  href="/api/images/zip"
                  download
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors border border-amber-500/20">
                      <FileArchive className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-amber-50">Alle Bilder als ZIP</p>
                      <p className="text-[11px] text-neutral-400 font-medium">Gesamtes Bild-Archiv herunterladen</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
                </a>
              </div>
            </section>
 
            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> System Info
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-neutral-500">Uptime</span>
                  <span className="text-sm font-mono text-blue-400">{status ? Math.floor(status.uptime / 3600) + 'h ' + Math.floor((status.uptime % 3600) / 60) + 'm' : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-neutral-500">Letzter Check</span>
                  <span className="text-sm font-mono text-xs text-neutral-400">{status ? new Date(status.timestamp).toLocaleTimeString() : 'N/A'}</span>
                </div>
              </div>
            </section>
 
            <section className="glass-card rounded-2xl p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Archiv ({files.length})
                </h2>
                <button 
                  onClick={fetchFiles}
                  disabled={fetchingFiles}
                  className="p-1 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-30"
                  title="Liste aktualisieren"
                >
                  <RefreshCw className={`w-3 h-3 text-neutral-500 ${(loading || fetchingFiles) ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {fetchingFiles && files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                    <p className="text-xs text-neutral-500 italic">Dateien werden gesucht...</p>
                  </div>
                ) : files.length === 0 ? (
                  <p className="text-xs text-neutral-600 text-center py-4 italic">Noch keine Dateien vorhanden</p>
                ) : (
                  files.map((file, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className={`${file.type === 'Image' ? 'text-blue-400' : 'text-emerald-400'} text-[9px] font-black uppercase tracking-widest`}>
                            • {file.type}
                          </span>
                          <span className="text-xs font-mono text-neutral-300 truncate max-w-[150px]">{file.name}</span>
                        </div>
                        <div className="flex gap-2">
                          {deletingPath === file.path ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => deleteFile(file.path)}
                                className="p-1 px-2 bg-red-600 text-white rounded-lg text-[10px] font-black"
                              >
                                JA, WEG DAMIT
                              </button>
                              <button
                                onClick={() => setDeletingPath(null)}
                                className="p-1 px-2 bg-white/10 text-neutral-400 rounded-lg text-[10px]"
                              >
                                NEIN
                              </button>
                            </div>
                          ) : (
                            <>
                              <a 
                                href={window.location.origin + file.path} 
                                download={file.name}
                                className="p-1 px-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-[10px] font-bold"
                              >
                                LADEN
                              </a>
                              <button
                                onClick={() => setDeletingPath(file.path)}
                                className="p-1 px-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>{(file.size / 1024).toFixed(0)} KB</span>
                        <span>{new Date(file.mtime).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </motion.div>
 
          {/* Dashboard Right: Logs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <section className="glass-card rounded-2xl overflow-hidden flex flex-col h-[700px] shadow-2xl">
              <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLogType('image')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${logType === 'image' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-neutral-500 hover:bg-white/5'}`}
                  >
                    Images
                  </button>
                  <button
                    onClick={() => setLogType('download')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${logType === 'download' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-neutral-500 hover:bg-white/5'}`}
                  >
                    Datensätze
                  </button>
                  <button
                    onClick={() => setLogType('system')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${logType === 'system' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-neutral-500 hover:bg-white/5'}`}
                  >
                    System
                  </button>
                  <button
                    onClick={() => setLogType('error')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${logType === 'error' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-neutral-500 hover:bg-white/5'}`}
                  >
                    Fehler
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {isClearingLogs ? (
                    <div className="flex gap-2">
                       <button
                        onClick={clearLogs}
                        className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-red-500/20 active:scale-95"
                      >
                        JETZT LÖSCHEN
                      </button>
                      <button
                        onClick={() => setIsClearingLogs(false)}
                        className="px-3 py-1 bg-white/10 text-neutral-400 text-[10px] font-bold uppercase rounded-lg"
                      >
                        ABBRUCH
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsClearingLogs(true)}
                      className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-lg border border-red-500/20 transition-all active:scale-95"
                    >
                      Protokolle löschen
                    </button>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live stream
                  </div>
                </div>
              </div>
 
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
                <AnimatePresence initial={false}>
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-4">
                      <ShieldAlert className="w-12 h-12 opacity-5" />
                      <p className="text-xs uppercase tracking-widest font-bold">Keine Protokolle</p>
                    </div>
                  ) : (
                    logs.map((log, i) => (
                      <motion.div
                        key={i + log.timestamp}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-start gap-3 hover:border-white/10 transition-colors"
                      >
                        <div className="mt-1">
                          {logType === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 text-[10px]">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                              <span className={`${logType === 'error' ? 'text-red-400' : 'text-blue-400'} font-black uppercase text-[10px] tracking-tighter`}>{log.source}</span>
                            </div>
                          </div>
                          <p className="text-neutral-300 leading-relaxed break-words">{log.message}</p>
                          {log.data?.publicPath && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3"
                            >
                              <a
                                href={log.data.publicPath}
                                target="_blank"
                                className="group relative inline-block overflow-hidden rounded-xl border border-white/10"
                              >
                                <img 
                                  src={log.data.publicPath} 
                                  className="w-48 h-auto grayscale group-hover:grayscale-0 transition-all duration-500" 
                                  alt="Preview" 
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ExternalLink className="w-5 h-5 text-white" />
                                </div>
                              </a>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </section>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-white/5 mt-12 text-center">
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium">
          Datenquellen: Deutscher Wetterdienst (DWD) • Monitoring & Automatisierung
        </p>
      </footer>
    </div>
  );
}
