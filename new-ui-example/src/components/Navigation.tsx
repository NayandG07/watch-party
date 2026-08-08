import React from "react";
import { AppView, User, Invitation } from "../types";
import { Film, Users, UploadCloud, HardDrive, Settings, ShieldAlert, Bell, LogOut, Sun, Moon } from "lucide-react";

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  user: User;
  theme: "dark" | "light";
  toggleTheme: () => void;
  pendingInvites: Invitation[];
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  setView,
  user,
  theme,
  toggleTheme,
  pendingInvites,
}) => {
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Filter out any view that shouldn't show navigation
  const noNavViews = ["splash", "login", "register", "forgot-password", "accept-invitation"];
  if (noNavViews.includes(currentView)) return null;

  const navItems = [
    { id: "home", label: "Home", icon: Film },
    { id: "library", label: "Library", icon: Film },
    { id: "friends", label: "Friends", icon: Users },
    { id: "uploads", label: "Uploads", icon: UploadCloud, badge: 2 },
    { id: "storage", label: "Storage", icon: HardDrive },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (user.role === "Owner" || user.role === "Level 2") {
    navItems.splice(5, 0, { id: "admin", label: "Admin", icon: ShieldAlert });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/10 dark:border-neutral-800/40 bg-white/85 dark:bg-[#050505]/85 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left: Brand Identity & Active Status */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setView("home")}
              className="flex items-center space-x-2 font-display text-lg font-extrabold tracking-tight text-neutral-900 dark:text-white group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-[#0A0A0A] font-black transition-transform group-hover:scale-105">
                W
              </div>
              <span className="hidden sm:inline bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-neutral-50 dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                WATCH<span className="text-amber-500 font-light">ROOM</span>
              </span>
            </button>

            {/* Sync State Pulse */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Sync Active
              </span>
            </div>
          </div>

          {/* Center: Main Navigation Links */}
          <nav className="hidden lg:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as AppView)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 focus:outline-none ${
                    isActive
                      ? "bg-neutral-100 dark:bg-neutral-900 text-amber-600 dark:text-amber-500 font-bold"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-neutral-950">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Controls, Notifications & Profile */}
          <div className="flex items-center space-x-4">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors focus:outline-none"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications / Invites */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors focus:outline-none relative"
                title="View Watch Invitations"
              >
                <Bell className="w-4 h-4" />
                {pendingInvites.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-900">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Room Invitations
                    </span>
                    {pendingInvites.length > 0 && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                        {pendingInvites.length} Pending
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                    {pendingInvites.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No active invitations</p>
                    ) : (
                      pendingInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-200">
                              {invite.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                {invite.inviter}
                              </p>
                              <p className="text-[10px] text-neutral-400 truncate">
                                Invited you to watch <span className="text-amber-500">{invite.movieTitle}</span>
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setView("invitations");
                                setShowNotifications(false);
                              }}
                              className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 px-2 py-1"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => {
                                setView("watch-room");
                                setShowNotifications(false);
                              }}
                              className="bg-amber-500 text-neutral-950 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded hover:bg-amber-600 transition-colors"
                            >
                              Join Now
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Action & Logout */}
            <div className="flex items-center space-x-3 pl-2 border-l border-neutral-200/10 dark:border-neutral-800/40">
              <button
                onClick={() => setView("settings")}
                className="flex items-center space-x-2 group focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-800 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 flex items-center justify-center text-xs font-black text-neutral-100 group-hover:border-amber-500 transition-colors">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                    {user.name}
                  </span>
                  <span className="text-[9px] text-neutral-400 uppercase tracking-widest leading-none mt-0.5">
                    {user.role}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setView("splash")}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
