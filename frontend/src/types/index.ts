export interface Library {
  id: string;
  name: string;
  is_private: boolean;
}

export interface Collection {
  id: string;
  library_id: string;
  name: string;
  description: string | null;
  visibility: string;
  poster_path: string | null;
  sort_order: number;
  movie_count: number;
  created_at: string;
  library: {
    id: string;
    name: string;
    is_private: boolean;
    owner: {
      id: string;
      username: string;
      role: string;
    }
  };
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  year: number | null;
  duration_seconds: number;
  resolution: string | null;
  is_processed: boolean;
  is_uploaded: boolean;
  thumbnail_url: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  timeline_sprite_url: string | null;
  chapters?: { title: string; time: number }[];
}
