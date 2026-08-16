"""
Tests presigned URL directly vs through Cloudflare Worker.
Uses Supabase auth to get a valid JWT.
"""
import httpx
from urllib.parse import urlparse, urlunparse

SUPABASE_URL = "https://zkqqdlmnwuvexrvtxxsp.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcXFkbG1ud3V2ZXhydnR4eHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDQzNTEsImV4cCI6MjA5OTQyMDM1MX0.XyUQQZZ96PuTGqK7x2baIA7woOEWTEepxtNXom-cigQ"
API = "https://watch-party-u7jq.onrender.com"
WORKER = "https://billowing-king-8e25.nayandg8.workers.dev"

def get_supabase_token():
    r = httpx.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": "nayandg8@gmail.com", "password": "admin@0718"},
        timeout=15,
    )
    if r.status_code != 200:
        raise RuntimeError(f"Supabase login failed: {r.text}")
    token = r.json()["access_token"]
    print("Logged in via Supabase!")
    return token

def main():
    token = get_supabase_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get movies
    movies = httpx.get(f"{API}/api/movies", headers=headers, timeout=15).json()
    if isinstance(movies, dict):
        movies = movies.get("items", [])
    if not movies:
        print("No movies found!")
        return
    movie = movies[0]
    print(f"Movie: {movie['title']} (id={movie['id']})")

    # Get the redirect URL for poster.jpg (don't follow redirect)
    r = httpx.get(
        f"{API}/api/movies/{movie['id']}/stream/poster.jpg",
        headers=headers,
        follow_redirects=False,
        timeout=15,
    )
    print(f"Backend redirect: {r.status_code}")
    presigned = r.headers.get("location")
    if not presigned:
        print("No redirect location found!")
        return

    parsed = urlparse(presigned)
    print(f"Presigned URL: scheme={parsed.scheme!r} host={parsed.netloc!r} path={parsed.path[:60]!r}...")

    # TEST 1: Direct B2 presigned URL
    print("\n--- TEST 1: Direct B2 ---")
    r1 = httpx.get(presigned, follow_redirects=True, timeout=20)
    print(f"Status: {r1.status_code}")
    if r1.status_code != 200:
        print(f"Body: {r1.text[:800]}")
    else:
        print(f"OK — got {len(r1.content)} bytes")

    # TEST 2: Through Cloudflare Worker
    worker_path = f"/{parsed.netloc}{parsed.path}"
    worker_url = urlunparse(("https", "billowing-king-8e25.nayandg8.workers.dev",
                             worker_path, parsed.params, parsed.query, ""))
    print(f"\n--- TEST 2: Through Worker ---")
    print(f"Worker URL path: /{parsed.netloc}{parsed.path[:50]}...")
    r2 = httpx.get(worker_url, follow_redirects=True, timeout=20)
    print(f"Status: {r2.status_code}")
    if r2.status_code != 200:
        print(f"Body: {r2.text[:800]}")
    else:
        print(f"OK — got {len(r2.content)} bytes")

    print(f"\n{'='*50}")
    print(f"Direct B2:  {'✅ OK' if r1.status_code == 200 else '❌ FAIL'}")
    print(f"Via Worker: {'✅ OK' if r2.status_code == 200 else '❌ FAIL'}")
    if r1.status_code == 200 and r2.status_code != 200:
        print("=> Presigned URL is valid. Issue is in the Cloudflare Worker.")
    elif r1.status_code != 200:
        print("=> Presigned URL itself is INVALID. B2 rejects it directly.")
    else:
        print("=> Both work! The fix is live.")

if __name__ == "__main__":
    main()
