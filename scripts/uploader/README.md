# Watch Party Scripts

This directory contains the utility scripts used to manage your Watch Party media. Because these scripts handle heavy lifting (like transcoding massive video files), they are designed to be run **on your local computer**, not on your backend server.

## Installation

You need Python 3.10+ and [FFmpeg](https://ffmpeg.org/download.html) installed on your machine.

Install the required Python packages:
```bash
pip install -r requirements.txt
```

---

## 1. The Uploader (`process.py`)

This script takes a raw video file, probes it, transcodes it to HLS format (with AES-128 encryption), generates a poster and backdrop, and uploads the final segments directly to your Backblaze B2 bucket.

**Basic Usage (Local Backend):**
```bash
python process.py /path/to/movie.mkv
```

**Remote Backend Usage (Recommended):**
You don't need to transfer huge `.mkv` files to your production server! Keep the files on your desktop, and point the script to your live server. It will use your desktop's CPU to encode the video, and upload the files straight from your desktop to Backblaze.

```bash
python process.py --api-url https://api.mywatchparty.com /path/to/movie.mkv
```

The script will prompt you for your admin username and password, then guide you through selecting a collection and confirming the movie title.

---

## 2. The Cleanup Tool (`cleanup.py`)

If an upload fails (e.g. you lost internet connection midway, or manually aborted the script), your database might have an "orphaned" movie record that is marked as incomplete.

This script safely finds those incomplete movies and lets you delete them.

**Basic Usage:**
```bash
python cleanup.py
```

**Remote Backend Usage:**
```bash
python cleanup.py --api-url https://api.mywatchparty.com
```

The script will:
1. Show you a list of any orphaned movies.
2. Ask which ones you want to delete.
3. Automatically delete the records from your database.
4. **Optionally ask** if you want it to log into Backblaze B2 and purge the leftover files for those failed uploads.

To skip the interactive prompt and always purge the leftover files from B2, use the `--delete-b2` flag:
```bash
python cleanup.py --api-url https://api.mywatchparty.com --delete-b2
```
