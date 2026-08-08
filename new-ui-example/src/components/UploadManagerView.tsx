import React, { useState } from "react";
import { AppView, UploadTask } from "../types";
import { UploadCloud, FileVideo, Terminal, RefreshCw, CheckCircle, AlertTriangle, Play, Pause, Trash } from "lucide-react";

interface UploadManagerProps {
  setView: (view: AppView) => void;
  uploads: UploadTask[];
  onAddUpload: (task: UploadTask) => void;
  onUpdateProgress: () => void;
}

export const UploadManagerView: React.FC<UploadManagerProps> = ({
  setView,
  uploads,
  onAddUpload,
  onUpdateProgress,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(uploads[0]?.id || "");
  const [dragOver, setDragOver] = useState(false);

  const selectedTask = uploads.find((u) => u.id === selectedTaskId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    // Create a new simulated task based on drop
    const files = e.dataTransfer.files;
    const fileName = files.length > 0 ? files[0].name : "Cozy_Summer_Nostalgia_2160p.mkv";

    const newTask: UploadTask = {
      id: "upload-" + Date.now(),
      name: fileName,
      progress: 0,
      stage: "queue",
      sizeGb: 14.8,
      logs: [
        `[${new Date().toLocaleTimeString()}] Local file dropped in dropzone.`,
        `[${new Date().toLocaleTimeString()}] Querying credentials to write to Backblaze B2...`,
        `[${new Date().toLocaleTimeString()}] Added to transcode transpile encoding queue.`
      ]
    };

    onAddUpload(newTask);
    setSelectedTaskId(newTask.id);

    // Slowly increment to demonstrate real-time pipeline progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress >= 100) {
        clearInterval(interval);
        // complete
        onUpdateProgress();
      } else {
        onUpdateProgress();
      }
    }, 1000);
  };

  const simulateManualAdd = () => {
    const newTask: UploadTask = {
      id: "upload-" + Date.now(),
      name: "The_Grand_Budapest_Hotel_1080p.mkv",
      progress: 0,
      stage: "queue",
      sizeGb: 12.1,
      logs: [
        "[05:35:00] Manual browse triggered.",
        "[05:35:02] Selected local file correctly. Pre-scanning header parameters.",
        "[05:35:05] Staging transcode target..."
      ]
    };
    onAddUpload(newTask);
    setSelectedTaskId(newTask.id);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 text-left">
      
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-neutral-900 pb-4">
        <h2 className="font-display text-2xl font-bold">Upload & Processing Hub</h2>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
          Desktop-grade transcode dashboard. Upload directly to Backblaze B2 with automatic proxy encoding pipelines.
        </p>
      </div>

      {/* Grid: Dropzone & Upload Queue split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Drag & Drop Area (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={simulateManualAdd}
            className={`h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-amber-500 bg-amber-500/[0.04]"
                : "border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 hover:border-amber-500/60 hover:bg-amber-500/[0.01]"
            }`}
          >
            <UploadCloud className="w-10 h-10 text-stone-400 mb-4 animate-bounce" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
              Drag & Drop Video Files
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
              Drop MKV, MP4, or WebM video arrays here or click to browse local files. 
              Subtitles and audio tracks are auto-detected instantly.
            </p>
            <span className="text-[10px] font-mono bg-stone-100 dark:bg-neutral-900/60 text-stone-400 px-2.5 py-0.5 rounded-full mt-4">
              MAX SIZE: 100 GB
            </span>
          </div>

          {/* Quick tips */}
          <div className="p-4 rounded-xl border border-stone-100 dark:border-neutral-900/40 bg-stone-50 dark:bg-neutral-950/20 text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
            <span className="font-bold text-stone-700 dark:text-zinc-300 block mb-1">AUTOMATIC TRANSCODING:</span>
            To guarantee 100% synchronized playback without frame stutters, our background process generates HLS proxies on arrival. Everyone views the exact same video file resolution directly.
          </div>
        </div>

        {/* Right Column: Queue & Terminal logs details (Span 8) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* List of active Upload tasks */}
          <div className="bg-white dark:bg-neutral-950/20 border border-stone-200 dark:border-neutral-900 p-5 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 block">
                Active Processing Queue
              </span>

              {uploads.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-10">No items inside upload manager</p>
              ) : (
                <div className="space-y-3">
                  {uploads.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        selectedTaskId === task.id
                          ? "bg-stone-50 dark:bg-neutral-900/40 border-amber-500/50"
                          : "bg-stone-50/50 dark:bg-neutral-950/40 border-stone-200 dark:border-neutral-900 hover:border-stone-300 dark:hover:border-neutral-800"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <FileVideo className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate">
                            {task.name}
                          </h4>
                          <span className="text-[10px] font-mono text-stone-400 block mt-0.5">
                            {task.sizeGb} GB • Stage: {task.stage.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Seek scrub percentage */}
                      <div className="mt-3 space-y-1">
                        <div className="relative h-1 w-full bg-stone-200 dark:bg-neutral-850 rounded-full">
                          <div
                            style={{ width: `${task.progress}%` }}
                            className={`absolute h-full rounded-full ${
                              task.stage === "failed" ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-stone-400">
                          <span>{task.progress}% complete</span>
                          {task.stage !== "complete" && task.stage !== "failed" && (
                            <span className="animate-pulse">Processing...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats trigger */}
            <div className="pt-4 border-t border-stone-100 dark:border-neutral-900/60 text-[10px] font-mono text-stone-400 flex items-center justify-between">
              <span>Encoding threads: 4/4 active</span>
              <span>Proxy Bitrate: H.264 12Mbps</span>
            </div>
          </div>

          {/* Console logger display block */}
          <div className="bg-neutral-950 text-zinc-300 p-5 rounded-2xl font-mono text-[10px] flex flex-col justify-between border border-neutral-900 min-h-[320px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Pipeline Console logs</span>
                </span>
                {selectedTask && (
                  <span className="text-amber-500 uppercase font-bold text-[9px]">
                    {selectedTask.stage}
                  </span>
                )}
              </div>

              {selectedTask ? (
                <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar text-left text-zinc-400 leading-relaxed">
                  {selectedTask.logs.map((log, index) => (
                    <p key={index}>{log}</p>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-600 text-center py-10">Select an item from the queue to stream active transcode terminal feedback logs.</p>
              )}
            </div>

            {/* Bottom active trigger buttons */}
            {selectedTask && (
              <div className="pt-3 border-t border-zinc-900 flex items-center justify-end space-x-2">
                <button
                  onClick={() => {
                    alert("Re-triggering media transcoding pipeline daemon...");
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-bold uppercase text-[9px] flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-queue Pipeline</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
