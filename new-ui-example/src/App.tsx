import React, { useState, useEffect } from "react";
import { AppView, Movie, Collection, Invitation, UploadTask, User, AdminLog } from "./types";
import { Navigation } from "./components/Navigation";
import { SplashView } from "./components/SplashView";
import { AuthViews } from "./components/AuthViews";
import { HomeView } from "./components/HomeView";
import { LibraryView } from "./components/LibraryView";
import { WatchRoomView } from "./components/WatchRoomView";
import { MovieDetailsView } from "./components/MovieDetailsView";
import { UploadManagerView } from "./components/UploadManagerView";
import {
  FriendsView,
  InvitationsView,
  StorageView,
  SettingsView,
  AdminDashboardView,
} from "./components/SecondaryViews";
import { INITIAL_MOVIES, INITIAL_COLLECTIONS, INITIAL_INVITATIONS, INITIAL_UPLOADS, ADMIN_LOGS } from "./data";

export default function App() {
  const [currentView, setView] = useState<AppView>("splash");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [movies, setMovies] = useState<Movie[]>(INITIAL_MOVIES);
  const [collections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [invitations, setInvitations] = useState<Invitation[]>(INITIAL_INVITATIONS);
  const [uploads, setUploads] = useState<UploadTask[]>(INITIAL_UPLOADS);
  const [selectedMovie, setSelectedMovie] = useState<Movie>(INITIAL_MOVIES[0]);
  
  const [user, setUser] = useState<User>({
    name: "Ryan (You)",
    avatar: "RY",
    defaultQuality: "4K UHD",
    defaultSubtitles: "English",
    subtitlesEnabled: true,
  });

  const [adminLogs] = useState<AdminLog[]>(ADMIN_LOGS);

  // Sync theme changes with document body for high fidelity styling
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Utility to simulate upload status progression
  const handleUpdateProgress = () => {
    setUploads((prev) =>
      prev.map((task) => {
        if (task.progress < 100 && task.stage === "queue") {
          const nextProgress = task.progress + 10;
          return {
            ...task,
            progress: nextProgress,
            stage: nextProgress === 100 ? "complete" : "queue",
            logs: [
              ...task.logs,
              `[${new Date().toLocaleTimeString()}] Chunk write successful. Progress: ${nextProgress}%`,
              ...(nextProgress === 100
                ? [
                    `[${new Date().toLocaleTimeString()}] Video upload finalized. Stored on Backblaze B2 bucket safely.`,
                    `[${new Date().toLocaleTimeString()}] Manifest JSON updated.`
                  ]
                : [])
            ]
          };
        }
        return task;
      })
    );
  };

  const handleAddUpload = (newTask: UploadTask) => {
    setUploads((prev) => [newTask, ...prev]);
  };

  const handleDeleteMovie = (id: string) => {
    setMovies((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAcceptInvite = (id: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDeclineInvite = (id: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  };

  // Determine if header navigation bar should be visible
  const showNav = ![
    "splash",
    "login",
    "register",
    "forgot-password",
    "accept-invitation",
    "watch-room"
  ].includes(currentView);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#050505] text-stone-900 dark:text-zinc-100 transition-colors duration-300 flex flex-col font-sans select-none">
      
      {/* 1. Header Navigation Bar (Only for main content panels) */}
      {showNav && (
        <Navigation
          currentView={currentView}
          setView={setView}
          user={user}
          theme={theme}
          toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          pendingInvites={invitations.filter((i) => i.status === "pending")}
        />
      )}

      {/* 2. Main content view layout containers */}
      <div className={`flex-1 flex flex-col ${showNav ? "max-w-7xl w-full mx-auto px-6 sm:px-8 py-8" : ""}`}>
        
        {/* Splash Landing Page */}
        {currentView === "splash" && (
          <SplashView setView={setView} />
        )}

        {/* Authentication forms */}
        {[
          "login",
          "register",
          "forgot-password",
          "accept-invitation"
        ].includes(currentView) && (
          <AuthViews currentView={currentView} setView={setView} />
        )}

        {/* Home Screen Dashboard */}
        {currentView === "home" && (
          <HomeView
            setView={setView}
            movies={movies}
            collections={collections}
            invitations={invitations}
            onSelectMovie={(movie) => setSelectedMovie(movie)}
          />
        )}

        {/* Media Library Browse Workspace */}
        {currentView === "library" && (
          <LibraryView
            setView={setView}
            movies={movies}
            onSelectMovie={(movie) => setSelectedMovie(movie)}
            onDeleteMovie={handleDeleteMovie}
          />
        )}

        {/* Cinema details visual screen */}
        {currentView === "movie-details" && (
          <MovieDetailsView movie={selectedMovie} setView={setView} />
        )}

        {/* Watch party room main theater */}
        {currentView === "watch-room" && (
          <WatchRoomView setView={setView} movie={selectedMovie} />
        )}

        {/* Direct Upload pipeline daemon */}
        {currentView === "uploads" && (
          <UploadManagerView
            setView={setView}
            uploads={uploads}
            onAddUpload={handleAddUpload}
            onUpdateProgress={handleUpdateProgress}
          />
        )}

        {/* Trusted circles */}
        {currentView === "friends" && (
          <FriendsView setView={setView} />
        )}

        {/* Invitation desks inbox */}
        {currentView === "invitations" && (
          <InvitationsView
            setView={setView}
            invitations={invitations}
            onAcceptInvite={handleAcceptInvite}
            onDeclineInvite={handleDeclineInvite}
          />
        )}

        {/* Cloud configurations and buckets */}
        {currentView === "storage" && (
          <StorageView />
        )}

        {/* Preferences profile settings */}
        {currentView === "settings" && (
          <SettingsView user={user} onUpdateUser={setUser} />
        )}

        {/* Telemetry nodes */}
        {currentView === "admin" && (
          <AdminDashboardView logs={adminLogs} />
        )}

      </div>

    </div>
  );
}
