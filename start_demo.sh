#!/usr/bin/env bash
set -e

sudo systemctl start docker
sudo systemctl start intelligent-cv-backend

echo "Docker + DB + Backend are starting..."
echo "Backend: http://127.0.0.1:8000"
echo "Docs:    http://127.0.0.1:8000/docs"
