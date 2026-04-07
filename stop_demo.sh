#!/usr/bin/env bash
set -e

sudo systemctl stop intelligent-cv-backend
sudo systemctl stop docker

echo "Docker + Backend stopped."
