import { Movie, Collection, Invitation, UploadTask, AdminLog } from "./types";

export const INITIAL_MOVIES: Movie[] = [
  {
    id: "dune-2",
    title: "Dune: Part Two",
    year: 2024,
    genre: ["Sci-Fi", "Action", "Adventure"],
    duration: "2h 46m",
    durationSeconds: 9960,
    resolution: "4K UHD",
    poster: "https://images.unsplash.com/photo-1547483238-f400e65ccd56?auto=format&fit=crop&w=400&q=80", // sand dunes cinematic
    backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80", // cosmic desert
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    audioTracks: ["English (Atmos 5.1)", "English (Stereo)", "Japanese (Stereo)"],
    subtitleTracks: ["English (SRT)", "English (SDH)", "Spanish (SRT)", "Japanese (SRT)"],
    owner: "Ryan (You)",
    visibility: "Shared Collection",
    sizeGb: 48.2,
    rating: "PG-13",
    director: "Denis Villeneuve"
  },
  {
    id: "interstellar",
    title: "Interstellar",
    year: 2014,
    genre: ["Sci-Fi", "Drama", "Mystery"],
    duration: "2h 49m",
    durationSeconds: 10140,
    resolution: "4K UHD",
    poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80", // starry cosmos galaxy
    backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80", // earth orbit cinema
    overview: "In Earth's future, a global crop blight and second Dust Bowl are slowly rendering the planet uninhabitable. Professor Brand, a brilliant NASA physicist, is working on plans to save mankind by transporting Earth's population to a new home via a wormhole.",
    audioTracks: ["English (DTS-HD 5.1)", "French (Stereo)"],
    subtitleTracks: ["English", "Spanish", "French"],
    owner: "Ryan (You)",
    visibility: "Shared Collection",
    sizeGb: 38.5,
    rating: "PG-13",
    director: "Christopher Nolan"
  },
  {
    id: "spirited-away",
    title: "Spirited Away",
    year: 2001,
    genre: ["Animation", "Fantasy", "Family"],
    duration: "2h 5m",
    durationSeconds: 7500,
    resolution: "1080p",
    poster: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80", // abstract neon anime vibe
    backdrop: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80", // mystic anime forest landscape
    overview: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.",
    audioTracks: ["Japanese (Master Audio 5.1)", "English (Dub)"],
    subtitleTracks: ["English (SRT)", "Spanish (SRT)"],
    owner: "Sarah J.",
    visibility: "Shared Collection",
    sizeGb: 12.4,
    rating: "PG",
    director: "Hayao Miyazaki"
  },
  {
    id: "princess-mononoke",
    title: "Princess Mononoke",
    year: 1997,
    genre: ["Animation", "Adventure", "Fantasy"],
    duration: "2h 14m",
    durationSeconds: 8040,
    resolution: "1080p",
    poster: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=400&q=80", // painterly green trees
    backdrop: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80", // dense cinematic forest
    overview: "On a journey to find the cure for a Tatarigami's curse, Ashitaka finds himself in the middle of a war between the forest gods and Tatara, a mining colony. In this quest he also meets San, the Mononoke Hime.",
    audioTracks: ["Japanese (Stereo)", "English (Dub)"],
    subtitleTracks: ["English"],
    owner: "Sarah J.",
    visibility: "Shared Collection",
    sizeGb: 14.1,
    rating: "PG-13",
    director: "Hayao Miyazaki"
  },
  {
    id: "blade-runner-2049",
    title: "Blade Runner 2049",
    year: 2017,
    genre: ["Sci-Fi", "Action", "Mystery"],
    duration: "2h 44m",
    durationSeconds: 9840,
    resolution: "4K UHD",
    poster: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80", // warm neon hazy horizon
    backdrop: "https://images.unsplash.com/photo-1515462277126-270d878326e5?auto=format&fit=crop&w=1200&q=80", // hazy futuristic purple/amber neon
    overview: "A new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos. K's discovery leads him on a quest to find Rick Deckard, a former LAPD blade runner who has been missing for 30 years.",
    audioTracks: ["English (Atmos)", "English (Stereo)"],
    subtitleTracks: ["English", "Spanish", "German"],
    owner: "David M.",
    visibility: "Selected Friends",
    sizeGb: 44.8,
    rating: "R",
    director: "Denis Villeneuve"
  },
  {
    id: "mad-max-fury-road",
    title: "Mad Max: Fury Road",
    year: 2015,
    genre: ["Action", "Sci-Fi", "Adventure"],
    duration: "2h 0m",
    durationSeconds: 7200,
    resolution: "4K UHD",
    poster: "https://images.unsplash.com/photo-1501534159991-5b5f1545bc3b?auto=format&fit=crop&w=400&q=80", // desert canyon dusty motorcycle
    backdrop: "https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&w=1200&q=80", // dynamic amber red dust storm
    overview: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.",
    audioTracks: ["English (Atmos)", "Spanish (Stereo)"],
    subtitleTracks: ["English", "Spanish"],
    owner: "Ryan (You)",
    visibility: "Private",
    sizeGb: 32.1,
    rating: "R",
    director: "George Miller"
  }
];

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: "scifi-classics",
    name: "Cosmic Odysseys",
    description: "Visually stunning science fiction masterpieces with philosophical depth, massive canvases, and sweeping cinematic soundtracks.",
    owner: "Ryan (You)",
    sharedFriends: ["Sarah Jenkins", "David Miller", "Marcus Aurelius"],
    movieIds: ["dune-2", "interstellar", "blade-runner-2049"],
    backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "studio-ghibli",
    name: "Studio Ghibli Coziness",
    description: "Lush watercolor worlds, magical spirits, and nostalgia-soaked animation masterpieces for high-end quiet nights.",
    owner: "Sarah J.",
    sharedFriends: ["Ryan (You)", "David Miller", "Elena Rostova"],
    movieIds: ["spirited-away", "princess-mononoke"],
    backdrop: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80"
  }
];

export const INITIAL_INVITATIONS: Invitation[] = [
  {
    id: "invite-1",
    inviter: "Sarah Jenkins",
    avatar: "SJ",
    movieTitle: "Spirited Away",
    scheduledTime: "Tonight at 8:00 PM",
    status: "pending"
  },
  {
    id: "invite-2",
    inviter: "David Miller",
    avatar: "DM",
    movieTitle: "Blade Runner 2049",
    scheduledTime: "Friday at 9:30 PM",
    status: "pending"
  },
  {
    id: "invite-3",
    inviter: "Elena Rostova",
    avatar: "ER",
    movieTitle: "Princess Mononoke",
    scheduledTime: "Yesterday",
    status: "accepted"
  }
];

export const INITIAL_UPLOADS: UploadTask[] = [
  {
    id: "upload-1",
    name: "Arrival_2016_2160p_Remux.mkv",
    progress: 82,
    stage: "encoding",
    sizeGb: 52.4,
    logs: [
      "[05:30:11] Initializing media scanner.",
      "[05:30:12] Found HEVC Main 10 profile video stream (3840x2160, 23.976 fps).",
      "[05:30:14] Demuxing audio tracks: English TrueHD Atmos, Spanish AC3.",
      "[05:30:15] Extraction complete. Subtitles auto-detected: English (SRT), French (SRT).",
      "[05:30:18] Generating proxy transcode. Encoding CRF 22, CPU preset 'medium'...",
      "[05:31:05] Transcoding chunk 204/1040 complete.",
      "[05:32:44] Transcoding chunk 418/1040 complete.",
      "[05:33:20] Encoding progress: 82%."
    ]
  },
  {
    id: "upload-2",
    name: "Perfect_Blue_1997_1080p.mp4",
    progress: 24,
    stage: "thumbnails",
    sizeGb: 11.2,
    logs: [
      "[05:32:01] File upload fully finalized. Size: 11.2 GB.",
      "[05:32:02] Stored safely inside Backblaze B2 bucket 'cinema-bucket-01'.",
      "[05:32:05] Commencing post-processing pipelines.",
      "[05:32:08] Extracting video frame intervals for player seek hover thumbnails...",
      "[05:32:15] Frame extraction: 24% complete."
    ]
  }
];

export const ADMIN_LOGS: AdminLog[] = [
  {
    timestamp: "05:30:37",
    service: "Socket Sync Engine",
    message: "Watch room 'Dune 2 Party' synchronized with 4 active sockets. Median lag: 12ms",
    status: "ok"
  },
  {
    timestamp: "05:28:14",
    service: "Backblaze B2 Provider",
    message: "Retrieved media stream link for 'Dune: Part Two' client. CDN cache HIT.",
    status: "ok"
  },
  {
    timestamp: "05:25:01",
    service: "Transcoder Daemon",
    message: "Warning: High GPU thermals detected during encoding of 'Arrival_2016_2160p_Remux.mkv'. Throttling rate slightly.",
    status: "warn"
  },
  {
    timestamp: "05:12:45",
    service: "Account Security Auth",
    message: "Failed login attempt from IP 192.168.1.104 with user 'unknown_friend'. Access denied.",
    status: "error"
  }
];
