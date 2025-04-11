#!/bin/bash

# Create temp directories if they don't exist
mkdir -p tmp/ios
mkdir -p tmp/android

echo "Starting Expo with clean cache..."
# Start expo with a clean cache to ensure changes are picked up
npx expo start -c 