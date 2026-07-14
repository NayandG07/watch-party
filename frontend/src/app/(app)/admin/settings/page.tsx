"use client";

import { Settings as SettingsIcon } from "lucide-react";

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

      <div className="glass p-12 text-center text-content-secondary">
        <SettingsIcon className="w-12 h-12 mx-auto mb-4 text-brand-500/50" />
        <h3 className="text-lg font-medium text-content-primary mb-1">Coming Soon</h3>
        <p className="text-sm max-w-md mx-auto">
          Global platform settings (like default metadata providers or appearance themes) will be configurable here in a future update.
        </p>
      </div>
    </div>
  );
}
