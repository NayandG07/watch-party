"use client";

import Link from "next/link";
import { HardDrive } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-5xl mx-auto w-full animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-content-primary">
          Platform Settings
        </h1>
        <p className="text-content-secondary mt-1">
          Configure application-wide settings and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link 
          href="/admin/settings/storage"
          className="glass p-6 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group cursor-pointer flex flex-col"
        >
          <HardDrive className="w-8 h-8 text-brand-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">Storage Providers</h3>
          <p className="text-sm text-content-secondary flex-1">
            Configure Backblaze B2 or other object storage endpoints for your media library.
          </p>
        </Link>
      </div>
    </div>
  );
}
