First Time Setup
Step 1 — Start Docker service
sudo systemctl enable --now docker
What this command does
starts Docker
enables Docker to auto-start after reboot
Check Docker status
sudo systemctl status docker --no-pager

If Docker is working, it should show active (running).

Step 2 — Stop local PostgreSQL if it is using port 5432
sudo systemctl stop postgresql
What this command does
stops PostgreSQL installed directly on Ubuntu
frees port 5432 so Docker PostgreSQL can use it
Check if port 5432 is free
ss -ltnp | grep 5432

If this command shows nothing, the port is free.

Step 3 — Start PostgreSQL container
Create and run the database container
sudo docker run -d \
  --name intelligent_cv_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=123456 \
  -e POSTGRES_DB=intelligent_cv \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
What this command does
creates a PostgreSQL container
sets database username to postgres
sets database password to 123456
creates database intelligent_cv
maps container port 5432 to local machine port 5432
stores database data in Docker volume pgdata
Check running containers
sudo docker ps
Check PostgreSQL logs
sudo docker logs intelligent_cv_db

You should see logs showing the database is ready to accept connections.

Step 4 — Start backend

Go to the backend folder:

cd ~/intelligent-cv-screening/backend
Create virtual environment
python -m venv .venv
Activate virtual environment
source .venv/bin/activate
Install backend dependencies
pip install -r requirements.txt
Run FastAPI server
uvicorn app.main:app --reload
What each command does
cd ~/intelligent-cv-screening/backend: moves into backend folder
python -m venv .venv: creates Python virtual environment
source .venv/bin/activate: activates the virtual environment
pip install -r requirements.txt: installs all backend packages
uvicorn app.main:app --reload: starts FastAPI server with auto-reload
Backend URLs

Open these in the browser:

http://127.0.0.1:8000/
http://127.0.0.1:8000/health
http://127.0.0.1:8000/docs
/ checks backend is running
/health checks backend health
/docs opens Swagger API docs
Step 5 — Start frontend

Open a new terminal and go to the project root:

cd ~/intelligent-cv-screening
Install frontend dependencies
npm install
Run Next.js development server
npm run dev
What each command does
cd ~/intelligent-cv-screening: moves to project root
npm install: installs frontend packages
npm run dev: starts the Next.js development server
Frontend URL
http://localhost:3000
Daily Run Commands

After the first setup, you do not need to recreate everything.

Terminal 1 — Start database
sudo systemctl start docker
sudo systemctl stop postgresql
sudo docker start intelligent_cv_db
What these commands do
starts Docker service
makes sure local PostgreSQL does not block port 5432
starts the existing PostgreSQL container
Terminal 2 — Start backend
cd ~/intelligent-cv-screening/backend
source .venv/bin/activate
uvicorn app.main:app --reload
What these commands do
enters backend folder
activates Python virtual environment
starts FastAPI backend
Terminal 3 — Start frontend
cd ~/intelligent-cv-screening
npm run dev
What these commands do
enters project root
starts Next.js frontend
Full Command Order for Demo
First time
Terminal 1
sudo systemctl enable --now docker
sudo systemctl stop postgresql
sudo docker run -d \
  --name intelligent_cv_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=123456 \
  -e POSTGRES_DB=intelligent_cv \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
Terminal 2
cd ~/intelligent-cv-screening/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
Terminal 3
cd ~/intelligent-cv-screening
npm install
npm run dev
Next runs
Terminal 1
sudo systemctl start docker
sudo systemctl stop postgresql
sudo docker start intelligent_cv_db
Terminal 2
cd ~/intelligent-cv-screening/backend
source .venv/bin/activate
uvicorn app.main:app --reload
Terminal 3
cd ~/intelligent-cv-screening
npm run dev
Stop the Project
Stop frontend

Press:

Ctrl + C

in the frontend terminal.

Stop backend

Press:

Ctrl + C

in the backend terminal.

Stop database container
sudo docker stop intelligent_cv_db
Reset Database

Use this only if you want to delete the database and start from scratch.

Stop and remove container
sudo docker stop intelligent_cv_db
sudo docker rm intelligent_cv_db
Remove database volume
sudo docker volume rm pgdata
What these commands do
stops PostgreSQL container
removes PostgreSQL container
deletes all saved PostgreSQL data
Useful Check Commands
Check Docker containers
sudo docker ps
Check PostgreSQL container logs
sudo docker logs intelligent_cv_db
Check port 5432 usage
ss -ltnp | grep 5432
Check backend environment file
cat ~/intelligent-cv-screening/backend/.env
Check backend API docs

Open in browser:

http://127.0.0.1:8000/docs
Current Demo URLs
Frontend: http://localhost:3000
Backend: http://127.0.0.1:8000
Swagger Docs: http://127.0.0.1:8000/docs
Common Problems
Docker permission denied

If Docker permission is denied, temporarily run Docker commands with sudo.

Example:

sudo docker ps
Port 5432 is already in use

Stop local PostgreSQL:

sudo systemctl stop postgresql

Then check again:

ss -ltnp | grep 5432
Backend cannot connect to database

Check these:

Docker is running
PostgreSQL container is running
local PostgreSQL is stopped
backend/.env exists
DATABASE_URL matches the PostgreSQL container settings
Current Status
Working
Next.js frontend
FastAPI backend
PostgreSQL connection
Dockerized database
Auto table creation with SQLModel
In Progress
Register API
Login API
Frontend-backend integration
Job CRUD
CV upload
Planned
JWT authentication
Application management
CV parsing
CV screening and scoring
Admin dashboard with real data
