import httpx
import sys
import os

api_url = "https://watch-party-u7jq.onrender.com"
email = "nayandg8@gmail.com"
password = "admin@0718"

# We know the app uses Supabase for auth now, but wait, if it uses supabase for auth, we need the supabase URL and key.
# But wait, we can just use the backend API if we have a token, or we can use the local DB if they are running it locally?
# Actually, the user's backend is on render, but their DB is on Supabase.
