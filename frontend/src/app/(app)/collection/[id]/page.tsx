"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MoreVertical, Edit2, Trash2, ChevronRight, Film } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import MovieCard from "@/components/media/MovieCard";
import type { Collection, Movie } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { EditCollectionModal } from "@/components/library/EditCollectionModal";

export default function CollectionPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { user } = useAuthStore();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [colRes, moviesRes] = await Promise.all([
          api.get<Collection>(`/api/collections/${id}`),
          api.get<Movie[]>(`/api/movies?collection_id=${id}`),
        ]);
        
        setCollection(colRes.data);
        setMovies(moviesRes.data);
      } catch {
        setError("Failed to load collection");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    function handleClick() {
      setOpenDropdown(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/collections/${id}`);
      router.push("/library");
    } catch (err) {
      console.error(err);
      setError("Failed to delete collection");
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const canManage = user?.role === "super_admin" || (user?.role === "level2" && user?.id === collection?.library?.owner?.id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm font-medium text-content-secondary">Loading collection...</p>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <Film className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-content-primary mb-2">{error || "Collection not found"}</h2>
        <button onClick={() => router.push("/library")} className="btn-secondary mt-4">
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-16 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-content-muted mb-6">
        <button 
          onClick={() => router.back()}
          className="hover:text-content-primary transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-brand-500 rounded px-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Link href="/library" className="hover:text-content-primary transition-colors">
          Library
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-content-primary font-bold truncate max-w-[200px]">{collection.name}</span>
      </nav>
      
      {/* Header Banner */}
      <header className="card p-6 sm:p-8 mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 mb-3">
            <Film className="w-3.5 h-3.5" />
            <span>Collection</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary">{collection.name}</h1>
          {collection.description && (
            <p className="text-content-secondary text-sm mt-2 max-w-2xl leading-relaxed">{collection.description}</p>
          )}
          <div className="flex items-center gap-3 mt-4 text-xs font-semibold text-content-muted">
            <span>{movies.length} {movies.length === 1 ? "title" : "titles"}</span>
          </div>
        </div>

        {canManage && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(!openDropdown);
              }}
              disabled={isDeleting}
              className="btn-secondary min-h-[40px] px-3 font-semibold"
              title="Collection settings"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
            </button>
            
            {openDropdown && (
              <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-2xl shadow-card-hover border border-slate-200 overflow-hidden w-48 animate-fade-in p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(false);
                    setShowEditModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 rounded-xl hover:bg-slate-50 transition-colors text-content-primary"
                >
                  <Edit2 className="w-4 h-4 text-brand-600" />
                  Edit Details
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(false);
                    setConfirmDelete(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 rounded-xl hover:bg-red-50 transition-colors text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Collection
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Delete Confirmation Alert */}
      {confirmDelete && (
        <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-scale-in">
          <p className="text-xs sm:text-sm text-red-700 font-semibold">Are you sure you want to delete this collection? This action cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost h-9 px-4 text-xs font-bold">Cancel</button>
            <button onClick={handleDelete} disabled={isDeleting} className="btn-danger h-9 px-4 text-xs font-bold">
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* Grid or Empty State */}
      {movies.length === 0 ? (
        <div className="card py-16 px-6 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 border border-brand-100">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-content-primary mb-1">This collection is empty</h3>
          <p className="text-xs text-content-secondary max-w-sm mb-6">Titles added to this collection will automatically appear here in your grid.</p>
          
          {canManage && (
            <div className="bg-slate-900 rounded-2xl p-4 w-full max-w-md text-left text-white shadow-card">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Ingestion Command</p>
              <code className="text-xs text-amber-300 font-mono block break-all">
                python scripts/uploader/process.py --collection {collection.id}
              </code>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      {showEditModal && (
        <EditCollectionModal
          collection={collection}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            setCollection(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
