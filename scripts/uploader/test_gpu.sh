#!/bin/bash
# Quick GPU encoding test
# Tests if your RTX 4050 can encode faster than CPU

echo "Testing GPU vs CPU encoding speed..."
echo ""
echo "This will encode a 10-second sample at 1080p"
echo "GPU should be 5-10x faster than CPU"
echo ""

# Check if test video exists
if [ ! -f "test_sample.mp4" ]; then
    echo "Creating 10-second test video..."
    ffmpeg -f lavfi -i testsrc=duration=10:size=1920x1080:rate=30 -pix_fmt yuv420p test_sample.mp4 -y 2>/dev/null
fi

echo "1. Testing CPU (x265)..."
time ffmpeg -i test_sample.mp4 -c:v libx265 -preset medium -crf 26 -pix_fmt yuv420p test_cpu.mp4 -y 2>/dev/null
CPU_TIME=$?

echo ""
echo "2. Testing GPU (NVENC)..."
time ffmpeg -i test_sample.mp4 -c:v hevc_nvenc -preset p4 -cq 31 -pix_fmt yuv420p test_gpu.mp4 -y 2>/dev/null
GPU_TIME=$?

echo ""
echo "Results:"
echo "--------"
ls -lh test_cpu.mp4 test_gpu.mp4 | awk '{print $9, "-", $5}'

echo ""
echo "GPU encoding is typically 5-10x faster for full movies"
echo "Use: python process.py movie.mkv --gpu --workers 32"

# Cleanup
rm -f test_sample.mp4 test_cpu.mp4 test_gpu.mp4
