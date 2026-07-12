import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Room",
};

interface RoomPageProps {
  params: { id: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col animate-fade-in">
      {/* Video area */}
      <div className="flex-1 bg-black flex items-center justify-center relative">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-content-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-content-secondary text-sm">
            Video player — Phase 6
          </p>
          <p className="text-content-muted text-xs font-mono">
            Room: {params.id}
          </p>
        </div>

        {/* Sync status indicator */}
        <div className="absolute top-4 right-4">
          <div className="badge-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Synchronized
          </div>
        </div>
      </div>

      {/* Control bar placeholder */}
      <div className="h-16 bg-surface-elevated border-t border-surface-border flex items-center px-6 gap-4">
        <div className="h-4 w-24 skeleton rounded" />
        <div className="flex-1 h-1.5 bg-surface-overlay rounded-full">
          <div className="h-full w-1/3 bg-brand-500 rounded-full" />
        </div>
        <div className="h-4 w-16 skeleton rounded" />
      </div>
    </div>
  );
}
