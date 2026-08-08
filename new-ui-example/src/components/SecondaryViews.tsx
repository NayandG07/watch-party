import React, { useState } from "react";
import { AppView, User, Invitation, AdminLog } from "../types";
import { Users, UserPlus, Trash, ShieldCheck, Mail, Calendar, Check, X, HardDrive, Cpu, ShieldAlert, Key, Sliders, VolumeX, Eye } from "lucide-react";

// ============================================================================
// FRIENDS VIEW
// ============================================================================
interface FriendsProps {
  setView: (view: AppView) => void;
}

export const FriendsView: React.FC<FriendsProps> = ({ setView }) => {
  const [friends, setFriends] = useState([
    { name: "Sarah Jenkins", avatar: "SJ", collectionsCount: 2, sizeGb: 26.5, role: "Companion" },
    { name: "David Miller", avatar: "DM", collectionsCount: 1, sizeGb: 44.8, role: "Companion" },
    { name: "Elena Rostova", avatar: "ER", collectionsCount: 2, sizeGb: 26.5, role: "Companion" },
    { name: "Marcus Aurelius", avatar: "MA", collectionsCount: 0, sizeGb: 0, role: "Companion" },
  ]);

  const [newFriendEmail, setNewFriendEmail] = useState("");

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFriendEmail.trim() === "") return;
    alert(`Secure watch invitation code dispatched to ${newFriendEmail}! They will appear in your Circle on confirmation.`);
    setNewFriendEmail("");
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-neutral-900 pb-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Trusted Circle</h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
            Manage friends with access to your synchronized screening rooms. No public profiles, no online stalk status.
          </p>
        </div>

        {/* Dispatch Invite */}
        <form onSubmit={handleAddFriend} className="flex items-center space-x-2">
          <input
            type="email"
            required
            value={newFriendEmail}
            onChange={(e) => setNewFriendEmail(e.target.value)}
            placeholder="friend@domain.com"
            className="px-3.5 py-1.5 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-lg text-xs text-stone-900 dark:text-white outline-none focus:border-amber-500 w-44 sm:w-56"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {friends.map((friend) => (
          <div
            key={friend.name}
            className="p-5 rounded-2xl bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 rounded-full bg-neutral-800 border-2 border-stone-200 dark:border-neutral-800 flex items-center justify-center font-bold text-xs text-white">
                {friend.avatar}
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-zinc-100">{friend.name}</h4>
                <p className="text-[10px] font-mono text-stone-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                  {friend.role} • Shared: {friend.collectionsCount} collections
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => alert(`Reviewing permissions for ${friend.name}`)}
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-neutral-850 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-neutral-900"
              >
                Access
              </button>
              <button
                onClick={() => {
                  if (confirm(`Revoke ${friend.name}'s watch party credentials?`)) {
                    setFriends(friends.filter((f) => f.name !== friend.name));
                  }
                }}
                className="p-2 rounded-lg text-stone-300 hover:text-rose-500 transition-colors"
                title="Revoke Circle Credentials"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ============================================================================
// INVITATIONS VIEW
// ============================================================================
interface InvitationsProps {
  setView: (view: AppView) => void;
  invitations: Invitation[];
  onAcceptInvite: (id: string) => void;
  onDeclineInvite: (id: string) => void;
}

export const InvitationsView: React.FC<InvitationsProps> = ({
  setView,
  invitations,
  onAcceptInvite,
  onDeclineInvite,
}) => {
  const [activeTab, setActiveTab] = useState<"inbox" | "history">("inbox");

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="border-b border-stone-200 dark:border-neutral-900 pb-4">
        <h2 className="font-display text-2xl font-bold">Watch Invitations</h2>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
          Review scheduled watch requests from friends. Accept to join their synchronized screening timelines.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 dark:border-neutral-950 gap-6">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`pb-2 text-xs uppercase font-bold tracking-widest border-b-2 transition-all outline-none ${
            activeTab === "inbox" ? "border-amber-500 text-amber-500 font-bold" : "border-transparent text-stone-400"
          }`}
        >
          Inbox ({invitations.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-2 text-xs uppercase font-bold tracking-widest border-b-2 transition-all outline-none ${
            activeTab === "history" ? "border-amber-500 text-amber-500 font-bold" : "border-transparent text-stone-400"
          }`}
        >
          Past History
        </button>
      </div>

      {activeTab === "inbox" ? (
        <div className="space-y-4">
          {invitations.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-stone-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20">
              <p className="text-xs text-stone-400">All watch room invitations reviewed. No pending requests.</p>
            </div>
          ) : (
            invitations.map((invite) => (
              <div
                key={invite.id}
                className="p-5 rounded-2xl bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 border border-stone-200 dark:border-neutral-800 flex items-center justify-center font-bold text-xs text-white">
                    {invite.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                      {invite.inviter} invited you to watch <span className="text-amber-500 font-bold">{invite.movieTitle}</span>
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{invite.scheduledTime}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      onDeclineInvite(invite.id);
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-200 dark:border-neutral-850 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => {
                      onAcceptInvite(invite.id);
                      setView("watch-room");
                    }}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept & Stream</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-stone-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 space-y-3">
          <div className="flex justify-between items-center text-xs py-2 border-b border-stone-100 dark:border-neutral-900 text-stone-500">
            <span>Elena Rostova • Princess Mononoke</span>
            <span className="text-emerald-500">Accepted • Sync Complete</span>
          </div>
          <div className="flex justify-between items-center text-xs py-2 text-stone-500">
            <span>David Miller • Interstellar</span>
            <span className="text-zinc-400">Declined • Expired</span>
          </div>
        </div>
      )}
    </div>
  );
};


// ============================================================================
// STORAGE CONFIGURATION VIEW
// ============================================================================
export const StorageView: React.FC = () => {
  const [b2KeyId, setB2KeyId] = useState("004a434c4495c550000000001");
  const [b2AppKey, setB2AppKey] = useState("K004h+Cszb7OWhu5E5eT5I16mNnLGs8");
  const [bucketName, setBucketName] = useState("cinema-bucket-01");
  const [isConnected, setIsConnected] = useState(true);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setIsConnected(true);
    }, 1500);
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="border-b border-stone-200 dark:border-neutral-900 pb-4">
        <h2 className="font-display text-2xl font-bold">Cloud Storage Configuration</h2>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
          Backblaze B2 is our primary backend provider. Host massive video file formats and stream directly with zero transcoding overhead constraints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Settings Form (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-950/20 border border-stone-200 dark:border-neutral-900 p-6 rounded-2xl space-y-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 block">
            B2 API Credentials
          </span>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                B2 Key ID
              </label>
              <input
                type="text"
                value={b2KeyId}
                onChange={(e) => setB2KeyId(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                B2 Application Key (Secret)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={b2AppKey}
                  onChange={(e) => setB2AppKey(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-xs font-mono"
                />
                <button type="button" className="absolute right-3 top-3 text-stone-400 hover:text-stone-850 dark:hover:text-white">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Bucket Name
                </label>
                <input
                  type="text"
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Primary Endpoint Region
                </label>
                <input
                  type="text"
                  disabled
                  value="us-east-004.backblazeb2.com"
                  className="w-full px-4 py-2.5 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-stone-400"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center space-x-3">
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 shadow"
              >
                {testing && <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-950 border-t-transparent animate-spin" />}
                <span>{testing ? "Testing..." : "Test Connection"}</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span className="text-xs font-mono font-bold text-stone-500 dark:text-zinc-400">
                  {isConnected ? "Backblaze Connection Active" : "Disconnected"}
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Right: Metrics & Storage quota charts (Span 1) */}
        <div className="bg-white dark:bg-neutral-950/20 border border-stone-200 dark:border-neutral-900 p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 block">
              Direct Storage Quota
            </span>

            {/* Simulated circular progress bar or box metrics */}
            <div className="space-y-3 text-left">
              <div className="flex justify-between text-xs font-bold">
                <span>Cinema Storage</span>
                <span className="text-amber-500">82.4% Used</span>
              </div>
              <div className="relative h-2 w-full bg-stone-100 dark:bg-neutral-900 rounded-full">
                <div className="absolute h-full w-[82.4%] bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" />
              </div>
              <p className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
                824.5 GB of 1.0 TB total bucket allocation consumed. 
                Bandwidth billing triggers at 10.0 TB egress.
              </p>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-neutral-900 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-500 dark:text-zinc-400">Connection Latency:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">12 ms (CDN Fast)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-500 dark:text-zinc-400">B2 Service Status:</span>
                <span className="text-emerald-500 font-bold uppercase text-[10px]">OPERATIONAL</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-neutral-900/40 rounded-xl border border-stone-100 dark:border-neutral-850 text-[10px] text-stone-400 text-left">
            Need multiple cloud buckets? Future releases support Cloudflare R2 and AWS S3 connections automatically.
          </div>
        </div>

      </div>
    </div>
  );
};


// ============================================================================
// ACCOUNT SETTINGS VIEW
// ============================================================================
interface SettingsProps {
  user: User;
  onUpdateUser: (updated: User) => void;
}

export const SettingsView: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [name, setName] = useState(user.name);
  const [quality, setQuality] = useState(user.defaultQuality);
  const [subLanguage, setSubLanguage] = useState(user.defaultSubtitles);
  const [subsEnabled, setSubsEnabled] = useState(user.subtitlesEnabled);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name,
      defaultQuality: quality,
      defaultSubtitles: subLanguage,
      subtitlesEnabled: subsEnabled,
    });
    alert("Playback and Account preferences stored safely!");
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="border-b border-stone-200 dark:border-neutral-900 pb-4">
        <h2 className="font-display text-2xl font-bold">Preferences & Profile</h2>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
          Customize your default localized audio layers, seek thresholds, and subtitle configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Menu selectors */}
        <div className="bg-white dark:bg-neutral-950/20 border border-stone-200 dark:border-neutral-900 p-5 rounded-2xl h-fit space-y-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 block">
            Navigation Rails
          </span>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-500 flex items-center space-x-2">
              <Sliders className="w-4 h-4" />
              <span>General Playback</span>
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-500 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-neutral-900/40 hover:text-stone-900 dark:hover:text-zinc-200 flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>Secure Keys</span>
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-500 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-neutral-900/40 hover:text-stone-900 dark:hover:text-zinc-200 flex items-center space-x-2">
              <VolumeX className="w-4 h-4" />
              <span>Block lists</span>
            </button>
          </div>
        </div>

        {/* Content input forms (Span 2) */}
        <div className="md:col-span-2 bg-white dark:bg-neutral-950/20 border border-stone-200 dark:border-neutral-900 p-6 rounded-2xl">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Screen Profile Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Default Play Quality
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="4K UHD">4K UHD Premium</option>
                  <option value="1080p">1080p High Fidelity</option>
                  <option value="720p">720p Data Saver</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Default Subtitle Files Language
                </label>
                <select
                  value={subLanguage}
                  onChange={(e) => setSubLanguage(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="English">English SRT</option>
                  <option value="Spanish">Spanish SRT</option>
                  <option value="Japanese">Japanese SRT</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center space-x-3 h-10">
                  <input
                    type="checkbox"
                    id="subs-enable"
                    checked={subsEnabled}
                    onChange={(e) => setSubsEnabled(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-amber-500 bg-stone-100 dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 focus:ring-amber-500 focus:ring-1"
                  />
                  <label htmlFor="subs-enable" className="text-xs font-bold text-stone-700 dark:text-zinc-300 cursor-pointer select-none">
                    Always load default subtitles on play
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-display font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg"
            >
              Store Playback Settings
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};


// ============================================================================
// ADMIN DASHBOARD VIEW
// ============================================================================
interface AdminProps {
  logs: AdminLog[];
}

export const AdminDashboardView: React.FC<AdminProps> = ({ logs }) => {
  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="border-b border-stone-200 dark:border-neutral-900 pb-4">
        <h2 className="font-display text-2xl font-bold">Admin Telemetry Dashboard</h2>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
          Minimal node statistics and system event logging blocks. Keep CPU temperatures cool.
        </p>
      </div>

      {/* Grid: 3 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-950/20 border border-stone-200 dark:border-neutral-900 text-left space-y-1">
          <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 uppercase tracking-widest block">Active watch socket rooms</span>
          <h3 className="text-3xl font-display font-black text-amber-600 dark:text-amber-500">2 Rooms</h3>
          <p className="text-[10px] text-stone-400">Dune 2 Party, Studio Ghibli room synchronized</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-950/20 border border-stone-200 dark:border-neutral-900 text-left space-y-1">
          <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 uppercase tracking-widest block">Network ingress/egress</span>
          <h3 className="text-3xl font-display font-black">4.2 TB egress</h3>
          <p className="text-[10px] text-stone-400">Direct CDN edge caching active</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-950/20 border border-stone-200 dark:border-neutral-900 text-left space-y-1">
          <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 uppercase tracking-widest block">Core pipeline daemon status</span>
          <h3 className="text-3xl font-display font-black text-emerald-500">CPU Operational</h3>
          <p className="text-[10px] text-stone-400">GPU transcoding thermal levels: 64°C</p>
        </div>
      </div>

      {/* System events logs console terminal block */}
      <div className="bg-neutral-950 border border-neutral-900 p-6 rounded-2xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wider flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Direct Node Socket Logs</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-600">Daemon live output</span>
          </div>

          <div className="space-y-2 text-[11px] font-mono leading-relaxed max-h-64 overflow-y-auto no-scrollbar">
            {logs.map((log, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-1 border-b border-zinc-900/50">
                <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                <span className={`font-bold shrink-0 w-32 truncate ${
                  log.status === "error" ? "text-rose-500" : log.status === "warn" ? "text-amber-500" : "text-emerald-500"
                }`}>
                  {log.service.toUpperCase()}
                </span>
                <span className="text-zinc-400 flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
