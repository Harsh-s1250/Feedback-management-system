
# Feedback Management System

A web-based feedback management application.

## Technology Stack

- HTML
- CSS
- JavaScript
- Python FastAPI
- JSON File Storage
- Docker
- GitHub Actions

## Features

- Submit feedback
- View feedback
- Update feedback status
- Delete feedback
- Search feedback
- Filter feedback
- Dashboard statistics
- Persistent JSON storage

## Requirements

- Docker Desktop or Docker Engine
- Git
- GitHub account

## Run Application

Build Docker images:

docker compose build

Start containers:

docker compose up -d

Check containers:

docker compose ps

View logs:

docker compose logs -f

## Application URLs

Frontend:
http://localhost:3000

Backend:
http://localhost:8000

API Documentation:
http://localhost:8000/docs

## Stop Application

docker compose down

## Restart Application

docker compose restart

## Data Storage

Feedback is stored in:

backend/app/feedback.json

The file is mounted into the backend container,
so feedback survives container recreation.

## GitHub

git init
git add .
git commit -m "Initial feedback management system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/feedback-management-system.git
git push -u origin main
