"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MoreVertical, Edit2, Trash2, ChevronRight, Terminal } from "lucide-react";
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="text-center py-20 text-content-secondary">
        <p>{error || "Collection not found"}</p>
        <button onClick={() => router.push("/library")} className="mt-4 btn-secondary">
          Go to Library
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-content-muted mb-6">
        <button 
          onClick={() => router.back()}
          className="hover:text-content-primary transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <ChevronRight className="w-4 h-4 opacity-50" />
        <Link href="/library" className="hover:text-content-primary transition-colors">
          Library
        </Link>
        <ChevronRight className="w-4 h-4 opacity-50" />
        <span className="text-content-primary font-medium truncate max-w-[200px]">{collection.name}</span>
      </nav>
      
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-content-primary">{collection.name}</h1>
          {collection.description && (
            <p className="text-content-secondary mt-2 max-w-2xl">{collection.description}</p>
          )}
          <p className="text-xs text-content-muted mt-2">{movies.length} titles</p>
        </div>

        {canManage && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(!openDropdown);
              }}
              disabled={isDeleting}
              className="btn-secondary h-9 px-3"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
            </button>
            
            {openDropdown && (
              <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl shadow-card border border-surface-border overflow-hidden w-48 animate-fade-in">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(false);
                    setShowEditModal(true);
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors text-content-secondary hover:text-content-primary"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Collection
                </button>
                <div className="h-px bg-surface-border my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(false);
                    setConfirmDelete(true);
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Collection
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Inline Confirmation for Delete */}
      {confirmDelete && (
        <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-scale-in">
          <p className="text-sm text-danger font-medium">Delete this collection? This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost h-8 px-4 text-xs font-medium">Cancel</button>
            <button onClick={handleDelete} disabled={isDeleting} className="btn-danger h-8 px-4 text-xs font-medium">
              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Yes, Delete
            </button>
          </div>
        </div>
      )}

      {movies.length === 0 ? (
        <div className="py-20 glass rounded-2xl border-dashed flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
            <Terminal className="w-8 h-8 text-content-muted" />
          </div>
          <h3 className="text-lg font-medium text-content-primary mb-2">This collection is empty</h3>
          <p className="text-content-secondary mb-6">Movies need to be processed and added via the backend.</p>
          
          {canManage && (
            <div className="bg-black/30 rounded-lg p-4 w-full max-w-md text-left border border-white/5">
              <p className="text-xs text-content-muted mb-2 font-medium uppercase tracking-wider">How to add movies</p>
              <code className="text-xs text-brand-300 font-mono block break-all">
                python scripts/uploader/process.py --collection {collection.id}
              </code>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie, index) => (
            <MovieCard key={movie.id} movie={movie} index={index} />
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
