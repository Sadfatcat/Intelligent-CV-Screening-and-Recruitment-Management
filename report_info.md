# Chapter 1 — Introduction

## Source Mapping
- Source sections mapped: Introduction Paragraph, Section 2 Project Overview, Section 3 Problem Statement and Motivation
  > Evidence: `docs/report/code_extracted_report_materials.md` — Introduction Paragraph / Section 2 / Section 3

## Project Identity
- Project name: Intelligent CV Screening and Recruitment Management
  > Evidence: `docs/report/code_extracted_report_materials.md` — Project header / Section 2
- Domain: recruitment technology; CV submission; job description management; candidate screening; recruiter decision support
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 2 Project Overview for Report
- System type: web-based recruitment management system
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 1 Main Project Purpose

## Objectives
- Centralize recruitment data
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 2 Project Overview for Report
- Support job/JD posting
  > Evidence: `backend/app/routes/jobs.py` — `upload_jd`
- Allow candidates or guests to submit CV files
  > Evidence: `backend/app/routes/cvs.py` — `upload_cv`
- Automatically extract CV text
  > Evidence: `backend/app/services/extractor.py` — `extract_text`
- Compute CV-JD matching scores
  > Evidence: `backend/app/services/matcher.py` — `score_cv_vs_jd`
- Display scored candidate lists to recruiters
  > Evidence: `src/features/recruiter/RecruiterPage.tsx` — recruiter CV scoring workspace

## Scope
- Authentication
  > Evidence: `backend/app/routes/auth.py` — `register_user` / `login_user`
- Candidate registration/login
  > Evidence: `src/app/register/candidate/page.tsx` — candidate registration page
  > Evidence: `src/utils/loginHandler.ts` — login handling
- Recruiter login and forced password change for default credentials
  > Evidence: `backend/app/routes/auth.py` — `login_user` / `change_password`
  > Evidence: `src/app/recruiter/change-password/page.tsx` — recruiter password change page
- Admin recruiter management
  > Evidence: `backend/app/routes/admin.py` — `create_recruiter`
- Job/JD upload
  > Evidence: `backend/app/routes/jobs.py` — `upload_jd`
- CV upload
  > Evidence: `backend/app/routes/cvs.py` — `upload_cv`
- Matching score calculation
  > Evidence: `backend/app/services/matcher.py` — `score_cv_vs_jd`
- Candidate ranking/filtering in recruiter UI
  > Evidence: `src/features/recruiter/RecruiterPage.tsx` — filtered/sorted CV logs
  > Evidence: `src/features/recruiter/utils/cvScoringUtils.ts` — `sortCvLogs`
- Activity logging
  > Evidence: `backend/app/models.py` — `ActivityLog`
  > Evidence: `backend/app/routes/auth.py` — activity log insertions
  > Evidence: `backend/app/routes/admin.py` — activity log insertions
  > Evidence: `backend/app/routes/jobs.py` — activity log insertions
  > Evidence: `backend/app/routes/cvs.py` — activity log insertions

## Target Users
- Candidate
  > Evidence: `backend/app/models.py` — `User.role`
- Recruiter
  > Evidence: `backend/app/models.py` — `User.role`
- Admin
  > Evidence: `backend/app/models.py` — `User.role`

## Motivation
- Manual CV screening is inefficient because recruiters inspect many unstructured documents
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 3 Problem Statement and Motivation
- Recruitment data requires structured management across candidate submissions, JD records, recruiter ownership, status tracking, and audit logs
  > Evidence: `backend/app/models.py` — `User` / `Job` / `CV` / `JobApplication` / `ActivityLog`
- CV-JD matching provides an initial ranking signal before human review
  > Evidence: `backend/app/services/matcher.py` — `score_cv_vs_jd`

## Expected Benefits
- Reduced manual screening effort
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 2 Project Overview for Report
- More consistent initial candidate ranking
  > Evidence: `backend/app/services/matcher.py` — weighted scoring logic
- Improved traceability of candidate submissions
  > Evidence: `backend/app/models.py` — `ActivityLog`
- Clearer management interface for HR operations
  > Evidence: `src/app/admin/dashboard/page.tsx` — admin dashboard
  > Evidence: `src/features/recruiter/RecruiterPage.tsx` — recruiter dashboard

## Limitations To State In Introduction
- [UNCONFIRMED: no labeled CV-JD evaluation dataset was found]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Missing / Unclear / Need Confirmation
- [UNCONFIRMED: no formal ranking evaluation metrics were found]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Missing / Unclear / Need Confirmation
- [UNCONFIRMED: production readiness is limited by authentication, storage, and evaluation gaps]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Sections 3, 17, 22

# Chapter 2 — Theoretical Background & Technology

## Source Mapping
- Source sections mapped: Section 4 Technology Stack; technology stack tables; dependency evidence from `package.json` and `backend/requirements.txt`; AI/matching methodology references from Section 11
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 4 / Section 11 / Section 21

## Frontend Technologies
- Next.js 16.2.1: App Router web frontend and build framework
  > Evidence: `package.json` — dependency `next`
  > Evidence: `src/app/*/page.tsx` — App Router pages
- React 19.2.4 / React DOM 19.2.4: component rendering and state management
  > Evidence: `package.json` — dependencies `react`, `react-dom`
  > Evidence: frontend files — `useState` / `useEffect`
- TypeScript: typed frontend code
  > Evidence: `tsconfig.json` — TypeScript configuration
  > Evidence: `src/**/*.ts` / `src/**/*.tsx` — TypeScript source files
- CSS Modules and global CSS: page-specific themes and dashboard styling
  > Evidence: `src/app/*/*.module.css` — CSS Modules
  > Evidence: `src/app/globals.css` — global CSS
- Fetch API plus `apiUrl()`: frontend API integration
  > Evidence: `src/utils/api.ts` — `apiUrl`
  > Evidence: `src/features/recruiter/services/recruiterApi.ts` — API wrapper functions

## Backend Technologies
- FastAPI 0.135.3: HTTP API framework
  > Evidence: `backend/requirements.txt` — `fastapi`
  > Evidence: `backend/app/main.py` — `FastAPI(...)`
- Uvicorn: ASGI runtime
  > Evidence: `backend/requirements.txt` — `uvicorn`
  > Evidence: `backend/Dockerfile` — Uvicorn command
- Python 3.11: backend service implementation
  > Evidence: `backend/Dockerfile` — Python 3.11 base image
- SQLModel and SQLAlchemy: models, sessions, startup migrations
  > Evidence: `backend/app/models.py` — SQLModel classes
  > Evidence: `backend/app/database.py` — engine/session/startup migrations
- PostgreSQL 16: persistent relational database
  > Evidence: `backend/docker-compose.yml` — `postgres:16`
- psycopg / psycopg2-binary: PostgreSQL connectivity
  > Evidence: `backend/requirements.txt` — PostgreSQL drivers
- bcrypt: password hashing and verification
  > Evidence: `backend/app/security.py` — `get_password_hash` / `verify_password`
- python-jose: installed JWT library; [UNCONFIRMED: no active import/use found in current routes]
  > Evidence: `backend/requirements.txt` — `python-jose`

## Document Processing Technologies
- FastAPI `UploadFile` and `python-multipart`: multipart JD/CV upload handling
  > Evidence: `backend/app/routes/jobs.py` — `upload_jd`
  > Evidence: `backend/app/routes/cvs.py` — `upload_cv`
  > Evidence: `backend/requirements.txt` — `python-multipart`
- PyMuPDF (`fitz`): PDF text extraction
  > Evidence: `backend/app/services/extractor.py` — `extract_text_from_pdf`
- `python-docx`: DOCX text extraction
  > Evidence: `backend/app/services/extractor.py` — `extract_text_from_docx`
- Tesseract / pytesseract / Pillow: image OCR for CVs
  > Evidence: `backend/app/services/extractor.py` — `extract_text_from_image`
  > Evidence: `backend/Dockerfile` — `tesseract-ocr`, `tesseract-ocr-vie`, `tesseract-ocr-eng`

## AI / Matching Methodology
- Section parsing: CV/JD text split into semantic sections
  > Evidence: `backend/app/services/matcher.py` — `_split_sections` / `parse_sections_cv` / `parse_sections_jd`
- Skill alias mapping: aliases loaded from `skill_aliases.json`
  > Evidence: `backend/app/services/matcher.py` — `load_aliases` / `_load_alias_index`
  > Evidence: `backend/app/services/skill_aliases.json` — alias data
- TF-IDF cosine and token overlap fallback: similarity scoring
  > Evidence: `backend/app/services/matcher.py` — `_tfidf_cosine`
- Optional sentence-transformer embeddings: semantic similarity
  > Evidence: `backend/app/services/vectorizer.py` — `get_model`
  > Evidence: `backend/app/services/matcher.py` — `_embed_cosine`
  > Evidence: `backend/requirements.txt` — `sentence-transformers`
- Section-weighted scoring: weighted aggregation
  > Evidence: `backend/app/services/matcher.py` — `DEFAULT_WEIGHTS` / `_normalize_weights` / `_section_result`
- Must-have penalty: score reduction for missing mandatory requirements
  > Evidence: `backend/app/services/matcher.py` — `_infer_must_have` / `score_cv_vs_jd`
- Explainable matching detail: good/missing points, sections, summary, must-have
  > Evidence: `backend/app/services/matcher.py` — `score_cv_vs_jd` return object
  > Evidence: `src/features/recruiter/types/recruiterTypes.ts` — `MatchingDetail`

## Testing / Deployment Technologies
- Backend tests with Python assertion files
  > Evidence: `backend/tests/test_*.py` — backend tests
  > Evidence: `backend/tests/run_tests.py` — test runner
- ESLint: frontend static checking
  > Evidence: `package.json` — script `lint`
  > Evidence: `eslint.config.mjs` — ESLint config
- Docker and Docker Compose: backend and local PostgreSQL runtime
  > Evidence: `backend/Dockerfile` — backend container
  > Evidence: `backend/docker-compose.yml` — `db` and `backend` services
- Vercel: frontend deployment metadata
  > Evidence: `vercel.json` — framework/config
- Railway: backend deployment metadata
  > Evidence: `backend/railway.json` — Dockerfile and `/health` healthcheck
- dotenv/environment variables: configuration
  > Evidence: `backend/app/database.py` — `load_dotenv`
  > Evidence: `.env.example` — frontend API vars
  > Evidence: `backend/.env.example` — backend vars

# Chapter 3 — System Analysis & Design

## Source Mapping
- Source sections mapped: Section 4 Technology Stack; Section 5 Overall System Architecture; Section 6 Functional Modules; Section 9 Database and Data Model; Section 10 API Endpoint Inventory; Section 11 CV-JD Matching / AI Scoring Pipeline; Section 12 Recruitment Workflow; security evidence from Sections 8 and 17
  > Evidence: `docs/report/code_extracted_report_materials.md` — Sections 4-12 / Section 17 / Section 21

## Roles
- Candidate: self-registers, logs in, browses jobs, submits CVs, views submitted applications
  > Evidence: `backend/app/routes/auth.py` — `register_user`
  > Evidence: `src/app/candidate_UI/page.tsx` — candidate UI
- Recruiter: logs in, changes default password, uploads JD, reviews CV logs/applications, views scores/details
  > Evidence: `src/app/recruiter/login/page.tsx` — recruiter login page
  > Evidence: `src/app/recruiter/change-password/page.tsx` — password change page
  > Evidence: `backend/app/routes/jobs.py` — `upload_jd`
  > Evidence: `backend/app/routes/recruiter.py` — recruiter routes
- Admin: creates/list recruiters, views overview, lists/deletes jobs, deletes candidates/recruiters, views activity logs
  > Evidence: `backend/app/routes/admin.py` — admin routes
  > Evidence: `src/app/admin/dashboard/page.tsx` — admin dashboard

## Functional Requirements By Role
- Candidate: register account
  > Evidence: `backend/app/routes/auth.py` — `register_user`
- Candidate: login
  > Evidence: `backend/app/routes/auth.py` — `login_user`
- Candidate: browse public jobs
  > Evidence: `backend/app/routes/jobs.py` — `list_jobs`
- Candidate: submit CV with candidate fields and file
  > Evidence: `backend/app/routes/cvs.py` — `upload_cv`
- Candidate: view submitted applications
  > Evidence: `backend/app/routes/cvs.py` — `list_candidate_applications`
- Recruiter: login
  > Evidence: `backend/app/routes/auth.py` — `login_user`
- Recruiter: change default password
  > Evidence: `backend/app/routes/auth.py` — `change_password`
- Recruiter: view profile
  > Evidence: `backend/app/routes/recruiter.py` — `get_recruiter_profile`
- Recruiter: view owned jobs
  > Evidence: `backend/app/routes/recruiter.py` — `list_recruiter_jobs`
- Recruiter: upload JD and create job
  > Evidence: `backend/app/routes/jobs.py` — `upload_jd`
- Recruiter: view CV logs
  > Evidence: `backend/app/routes/recruiter.py` — `list_recruiter_cv_logs`
- Recruiter: view applications for a job
  > Evidence: `backend/app/routes/recruiter.py` — `list_job_applications_for_recruiter`
- Recruiter: update application status
  > Evidence: `backend/app/routes/recruiter.py` — `update_application_status`
- Recruiter: delete application/CV
  > Evidence: `backend/app/routes/recruiter.py` — `delete_application_and_cv`
- Recruiter: download/view CV file
  > Evidence: `backend/app/routes/recruiter.py` — `view_application_cv_file`
- Admin: create recruiter
  > Evidence: `backend/app/routes/admin.py` — `create_recruiter`
- Admin: list recruiters
  > Evidence: `backend/app/routes/admin.py` — `list_recruiters`
- Admin: list jobs
  > Evidence: `backend/app/routes/admin.py` — `admin_list_jobs`
- Admin: delete job
  > Evidence: `backend/app/routes/admin.py` — `admin_delete_job`
- Admin: delete candidate
  > Evidence: `backend/app/routes/admin.py` — `admin_delete_candidate`
- Admin: delete recruiter
  > Evidence: `backend/app/routes/admin.py` — `admin_delete_recruiter`
- Admin: list activities
  > Evidence: `backend/app/routes/admin.py` — `list_activities`
- Admin: view overview counts
  > Evidence: `backend/app/routes/admin.py` — `admin_overview`

## Non-Functional Requirements / Quality Attributes
- Explainability: matching output includes sections, good/missing points, must-have details
  > Evidence: `backend/app/services/matcher.py` — `score_cv_vs_jd`
  > Evidence: `src/features/recruiter/types/recruiterTypes.ts` — `MatchingDetail`
- Traceability: activity logs stored for important operations
  > Evidence: `backend/app/models.py` — `ActivityLog`
- Configurability: matching configuration can be parsed and serialized
  > Evidence: `backend/app/services/matching_config.py` — `parse_matching_config` / `serialize_matching_config`
- Multi-format CV parsing: PDF, DOCX, JPG/JPEG/PNG
  > Evidence: `backend/app/routes/cvs.py` — `ALLOWED_EXTENSIONS`
  > Evidence: `backend/app/services/extractor.py` — `extract_text`
- Deployment portability: Docker, Vercel, Railway configs
  > Evidence: `backend/Dockerfile` — backend image
  > Evidence: `backend/docker-compose.yml` — local stack
  > Evidence: `vercel.json` — frontend deployment
  > Evidence: `backend/railway.json` — backend deployment
- [UNCONFIRMED: production-grade authorization tokens are not implemented]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 17 Limitations

## Architecture Layers
- Frontend layer: Next.js App Router pages and React client components
  > Evidence: `src/app/` — App Router pages
- Backend API layer: FastAPI application and route modules
  > Evidence: `backend/app/main.py` — app setup and router inclusion
- Database layer: SQLModel models and SQLAlchemy engine/session
  > Evidence: `backend/app/models.py` — models
  > Evidence: `backend/app/database.py` — engine/session
- AI/matching layer: extractor, vectorizer, matcher, matching config
  > Evidence: `backend/app/services/extractor.py` — text extraction
  > Evidence: `backend/app/services/vectorizer.py` — vectors
  > Evidence: `backend/app/services/matcher.py` — scoring
  > Evidence: `backend/app/services/matching_config.py` — config
- Runtime/deployment layer: Docker Compose, Dockerfile, Vercel, Railway
  > Evidence: `backend/docker-compose.yml` — runtime services
  > Evidence: `backend/Dockerfile` — backend image
  > Evidence: `vercel.json` — frontend deployment
  > Evidence: `backend/railway.json` — backend deployment

## Database Models
- `User`: `id`, `email`, `password_hash`, `role`, `full_name`, `phone`, `address`, `company_name`, `is_active`
  > Evidence: `backend/app/models.py` — `User`
- `Job`: `recruiter_id`, `title`, `company_name`, `location`, `level`, `deadline`, `quantity`, `direct_contact`, `image_url`, `description`, `jd_file_path`, `jd_parsed_text`, `jd_vector`, `matching_config`
  > Evidence: `backend/app/models.py` — `Job`
- `CV`: `candidate_id`, `candidate_name`, `candidate_email`, `candidate_phone`, `file_path`, `parsed_text`, `cv_vector`
  > Evidence: `backend/app/models.py` — `CV`
- `JobApplication`: `job_id`, `cv_id`, `ai_matching_score`, `matching_detail`, `status`
  > Evidence: `backend/app/models.py` — `JobApplication`
- `ActivityLog`: `actor_user_id`, `actor_role`, `action`, `target_type`, `target_id`, `detail`, `created_at`
  > Evidence: `backend/app/models.py` — `ActivityLog`
- [UNCONFIRMED: no formal foreign-key relation for `ActivityLog.target_type/target_id`]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 9 Database and Data Model
- [UNCONFIRMED: no explicit unique constraint preventing duplicate CV submissions to the same job]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 9 Database and Data Model
- [UNCONFIRMED: no separate entity for interviews, offers, or scheduled recruitment stages]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 9 Database and Data Model

## API Endpoint List
- `GET /`: backend health/root message
  > Evidence: `backend/app/main.py` — `root`
- `GET /health`: healthcheck
  > Evidence: `backend/app/main.py` — `health`
  > Evidence: `backend/railway.json` — healthcheck path
- `POST /api/auth/register`: candidate self-registration
  > Evidence: `backend/app/routes/auth.py` — `register_user`
- `POST /api/auth/login`: user login
  > Evidence: `backend/app/routes/auth.py` — `login_user`
- `POST /api/auth/change-password`: recruiter password change
  > Evidence: `backend/app/routes/auth.py` — `change_password`
- `PUT /api/auth/candidate/{candidate_id}/profile`: candidate profile update
  > Evidence: `backend/app/routes/auth.py` — `update_candidate_profile`
- `POST /api/admin/recruiters`: admin creates recruiter
  > Evidence: `backend/app/routes/admin.py` — `create_recruiter`
- `GET /api/admin/recruiters`: list recruiters
  > Evidence: `backend/app/routes/admin.py` — `list_recruiters`
- `GET /api/admin/jobs`: admin list jobs
  > Evidence: `backend/app/routes/admin.py` — `admin_list_jobs`
- `DELETE /api/admin/jobs/{job_id}`: admin delete job and dependencies
  > Evidence: `backend/app/routes/admin.py` — `admin_delete_job`
- `DELETE /api/admin/candidates/{candidate_id}`: admin delete candidate with CVs/applications
  > Evidence: `backend/app/routes/admin.py` — `admin_delete_candidate`
- `DELETE /api/admin/recruiters/{recruiter_id}`: admin delete recruiter and jobs
  > Evidence: `backend/app/routes/admin.py` — `admin_delete_recruiter`
- `GET /api/admin/activities`: activity log listing
  > Evidence: `backend/app/routes/admin.py` — `list_activities`
- `GET /api/admin/overview`: admin counts
  > Evidence: `backend/app/routes/admin.py` — `admin_overview`
- `GET /api/recruiter/{recruiter_id}/profile`: recruiter profile
  > Evidence: `backend/app/routes/recruiter.py` — `get_recruiter_profile`
- `GET /api/recruiter/{recruiter_id}/jobs`: recruiter-owned jobs
  > Evidence: `backend/app/routes/recruiter.py` — `list_recruiter_jobs`
- `DELETE /api/recruiter/{recruiter_id}/jobs/{job_id}`: delete recruiter job and dependencies
  > Evidence: `backend/app/routes/recruiter.py` — `delete_recruiter_job`
- `GET /api/recruiter/{recruiter_id}/jobs/{job_id}/applications`: list applications for recruiter job
  > Evidence: `backend/app/routes/recruiter.py` — `list_job_applications_for_recruiter`
- `PATCH /api/recruiter/{recruiter_id}/applications/{application_id}`: update application status
  > Evidence: `backend/app/routes/recruiter.py` — `update_application_status`
- `DELETE /api/recruiter/{recruiter_id}/applications/{application_id}`: delete application and maybe orphan CV
  > Evidence: `backend/app/routes/recruiter.py` — `delete_application_and_cv`
- `GET /api/recruiter/{recruiter_id}/applications/{application_id}/cv-file`: download/view CV file
  > Evidence: `backend/app/routes/recruiter.py` — `view_application_cv_file`
- `GET /api/recruiter/{recruiter_id}/cv-logs`: recruiter CV submission logs
  > Evidence: `backend/app/routes/recruiter.py` — `list_recruiter_cv_logs`
- `POST /api/jobs/upload-jd`: recruiter uploads JD PDF and creates job
  > Evidence: `backend/app/routes/jobs.py` — `upload_jd`
- `GET /api/jobs/`: public job list
  > Evidence: `backend/app/routes/jobs.py` — `list_jobs`
- `GET /api/jobs/{job_id}`: job details
  > Evidence: `backend/app/routes/jobs.py` — `get_job`
- `GET /api/jobs/{job_id}/jd-file`: download/view JD PDF
  > Evidence: `backend/app/routes/jobs.py` — `download_job_jd_file`
- `POST /api/cvs/upload-cv`: upload CV and create application/score
  > Evidence: `backend/app/routes/cvs.py` — `upload_cv`
- `GET /api/cvs/job/{job_id}`: list CV applications for a job
  > Evidence: `backend/app/routes/cvs.py` — `list_cvs_for_job`
- `GET /api/cvs/candidate/{candidate_id}/applications`: candidate submitted applications
  > Evidence: `backend/app/routes/cvs.py` — `list_candidate_applications`
- `POST /match/cv_vs_jd`: direct CV file vs JD text matching
  > Evidence: `backend/app/routes/match.py` — `match_cv_vs_jd`
- `POST /match/cv_vs_jd_text`: direct text vs text matching
  > Evidence: `backend/app/routes/match.py` — `match_cv_vs_jd_text`

## Matching Pipeline Steps
- Raw CV/JD upload
  > Evidence: `backend/app/routes/cvs.py` — `upload_cv`
  > Evidence: `backend/app/routes/jobs.py` — `upload_jd`
- Text extraction
  > Evidence: `backend/app/services/extractor.py` — `extract_text`
- Cleaning/normalization
  > Evidence: `backend/app/services/matcher.py` — `clean_text` / `_normalize_token`
- Section extraction
  > Evidence: `backend/app/services/matcher.py` — `_split_sections`
- Skill extraction
  > Evidence: `backend/app/services/matcher.py` — `_extract_known_terms` / `_extract_section_items`
- Experience extraction
  > Evidence: `backend/app/services/matcher.py` — `extract_experience_years` / `_required_experience_years`
- Feature representation
  > Evidence: `backend/app/services/matcher.py` — `_tfidf_cosine` / `_embed_cosine` / `section_similarity`
- Similarity/scoring
  > Evidence: `backend/app/services/matcher.py` — `_section_result` / `score_cv_vs_jd`
- Ranking
  > Evidence: `src/features/recruiter/utils/cvScoringUtils.ts` — `sortCvLogs`
- Explanation
  > Evidence: `backend/app/services/matcher.py` — `score_cv_vs_jd`

## Security Notes
- Password hashing implemented with bcrypt
  > Evidence: `backend/app/security.py` — `get_password_hash` / `verify_password`
- Candidate self-registration rejects non-candidate roles
  > Evidence: `backend/app/routes/auth.py` — `register_user`
- Admin routes require admin ID role check
  > Evidence: `backend/app/routes/admin.py` — `require_admin`
- Recruiter routes require recruiter ID role check
  > Evidence: `backend/app/routes/recruiter.py` — `require_recruiter`
- [UNCONFIRMED: no JWT or server-side session authentication found]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Missing / Unclear / Need Confirmation
- [UNCONFIRMED: authorization relies on role checks using IDs and frontend localStorage]
  > Evidence: `src/utils/loginHandler.ts` — localStorage session storage
  > Evidence: `backend/app/routes/admin.py` — ID-based role checks
  > Evidence: `backend/app/routes/recruiter.py` — ID-based role checks

# Chapter 4 — Implementation & Testing

## Source Mapping
- Source sections mapped: Section 7 Frontend Analysis; Section 8 Backend Analysis; Section 13 Testing and Evaluation; Section 14 Deployment and Environment; Section 15 Previous Difficulties and Development Challenges; Section 16 Results / Achievements; Section 17 Limitations; Section 19 Suggested Final Report Outline; mock data notes
  > Evidence: `docs/report/code_extracted_report_materials.md` — Sections 7-19 / Section 21

## Implemented Frontend Features
- Landing/home page
  > Evidence: `src/app/page.tsx` — home page
- Candidate login
  > Evidence: `src/app/login/page.tsx` — login page
  > Evidence: `src/utils/loginHandler.ts` — `handleLoginSubmit`
- Candidate registration
  > Evidence: `src/app/register/candidate/page.tsx` — candidate registration page
  > Evidence: `src/utils/registerHandler.ts` — `handleRegisterSubmit`
- Candidate job browsing
  > Evidence: `src/app/candidate_UI/page.tsx` — `filteredJobs`
  > Evidence: `src/components/Jobcard.tsx` — job card component
- Candidate CV submission
  > Evidence: `src/app/candidate_UI/page.tsx` — FormData upload to `/api/cvs/upload-cv`
- Recruiter login
  > Evidence: `src/app/recruiter/login/page.tsx` — recruiter login page
  > Evidence: `src/features/recruiter/services/recruiterApi.ts` — `loginRecruiter`
- Recruiter password change
  > Evidence: `src/app/recruiter/change-password/page.tsx` — password change page
  > Evidence: `src/features/recruiter/services/recruiterApi.ts` — `changeRecruiterPassword`
- Recruiter dashboard / JD management / CV review
  > Evidence: `src/app/recruiter_UI/page.tsx` — recruiter page wrapper
  > Evidence: `src/features/recruiter/RecruiterPage.tsx` — recruiter feature page
- Recruiter scoring workspace
  > Evidence: `src/features/recruiter/RecruiterPage.tsx` — scoring workspace
  > Evidence: `src/features/recruiter/utils/cvScoringUtils.ts` — scoring utilities
- Admin login
  > Evidence: `src/app/admin/login/page.tsx` — admin login page
- Admin dashboard
  > Evidence: `src/app/admin/dashboard/page.tsx` — admin dashboard
- Job detail/apply route
  > Evidence: `src/app/job/[id]/page.tsx` — dynamic job page
  > Flag: [UNCONFIRMED: separate dynamic job detail/apply route described as partially implemented/unclear in source]

## Implemented Backend Features
- FastAPI application startup, CORS, uploads mount, routers, DB startup
  > Evidence: `backend/app/main.py` — `lifespan` / router inclusion
- Database engine/session, tables, migrations, default admin
  > Evidence: `backend/app/database.py` — `create_db_and_tables` / `run_startup_migrations` / `ensure_default_admin`
- SQLModel entities
  > Evidence: `backend/app/models.py` — `User` / `Job` / `CV` / `JobApplication` / `ActivityLog`
- Password hashing
  > Evidence: `backend/app/security.py` — `get_password_hash` / `verify_password`
- Authentication routes
  > Evidence: `backend/app/routes/auth.py` — auth endpoints
- Admin routes
  > Evidence: `backend/app/routes/admin.py` — admin endpoints
- Recruiter routes
  > Evidence: `backend/app/routes/recruiter.py` — recruiter endpoints
- Job/JD routes
  > Evidence: `backend/app/routes/jobs.py` — job endpoints
- CV routes
  > Evidence: `backend/app/routes/cvs.py` — CV endpoints
- Match test routes
  > Evidence: `backend/app/routes/match.py` — matching endpoints
- Text extraction service
  > Evidence: `backend/app/services/extractor.py` — extraction functions
- Matching/scoring service
  > Evidence: `backend/app/services/matcher.py` — matching functions
- Vectorization service
  > Evidence: `backend/app/services/vectorizer.py` — vector functions
- Matching config service
  > Evidence: `backend/app/services/matching_config.py` — config functions

## Deployment Configuration
- Frontend install/build/start scripts
  > Evidence: `package.json` — scripts `dev`, `build`, `start`, `lint`
- Backend local development with Uvicorn
  > Evidence: `backend/Dockerfile` — Uvicorn command
- Local database/backend Docker Compose
  > Evidence: `backend/docker-compose.yml` — `db` and `backend`
- Backend Docker image with OCR dependencies
  > Evidence: `backend/Dockerfile` — Tesseract packages
- Next.js API rewrites
  > Evidence: `next.config.ts` — `/api/:path*` and `/uploads/:path*` rewrites
- Frontend environment variables
  > Evidence: `.env.example` — `API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`
- Backend environment variables
  > Evidence: `backend/.env.example` — `DATABASE_URL`, `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `CORS_ALLOW_ORIGINS`, `PUBLIC_UPLOAD_BASE_URL`
- Vercel deployment config
  > Evidence: `vercel.json` — Next.js deployment config
- Railway backend deployment config
  > Evidence: `backend/railway.json` — Dockerfile and healthcheck

## Testing Coverage Summary
- Auth routes tested
  > Evidence: `backend/tests/test_auth_routes.py` — auth route tests
- Admin routes tested
  > Evidence: `backend/tests/test_admin_routes.py` — admin route tests
- Recruiter permission/delete risk tested
  > Evidence: `backend/tests/test_recruiter_permissions_and_delete_risk.py` — recruiter permission tests
- Recruiter matching detail tested
  > Evidence: `backend/tests/test_recruiter_matching_detail.py` — matching detail response tests
- Matcher behavior tested
  > Evidence: `backend/tests/test_matcher_simple.py` — matcher tests
- Model/schema fields tested
  > Evidence: `backend/tests/test_models_schema.py` — schema tests
- JD matching config tested
  > Evidence: `backend/tests/test_jobs_matching_config.py` — JD config tests
- CV upload tested
  > Evidence: `backend/tests/test_cvs_upload.py` — CV upload tests
- Test runner documented
  > Evidence: `backend/README_PIPELINE.md` — test command
- Frontend linting available
  > Evidence: `package.json` — `npm run lint`
- [UNCONFIRMED: no formal frontend unit tests or browser end-to-end tests found]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 13 Coverage Gaps
- [UNCONFIRMED: no formal coverage report found]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 13 Coverage Gaps
- [UNCONFIRMED: no labeled CV-JD dataset or ranking evaluation metric implementation found]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 13 Coverage Gaps

## Known Bugs / Limitations
- localStorage sessions instead of token-based authentication
  > Evidence: `src/utils/loginHandler.ts` — localStorage usage
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 17
- ID-based role checks
  > Evidence: `backend/app/routes/admin.py` — `require_admin`
  > Evidence: `backend/app/routes/recruiter.py` — `require_recruiter`
- Manual additive startup migrations
  > Evidence: `backend/app/database.py` — `run_startup_migrations`
- No labeled CV-JD evaluation dataset
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 17
  > Flag: [UNCONFIRMED: no labeled CV-JD evaluation dataset was found]
- Heuristic weights and thresholds
  > Evidence: `backend/app/services/matcher.py` — `DEFAULT_WEIGHTS`
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 17
- Optional embedding behavior
  > Evidence: `backend/app/services/matcher.py` — `ENABLE_MATCHER_EMBEDDINGS`
  > Evidence: `backend/app/routes/cvs.py` — `ENABLE_UPLOAD_VECTORS`
- Mock data mixed with real data in demo sessions
  > Evidence: `src/mock/cvScreeningMockData.ts` — mock data
  > Evidence: `src/features/recruiter/utils/recruiterMockMappers.ts` — mock mappers
- Local/container filesystem uploads
  > Evidence: `backend/app/routes/cvs.py` — `CV_UPLOAD_DIR`
  > Evidence: `backend/app/routes/jobs.py` — `JD_UPLOAD_DIR`
- CORS default can be wildcard
  > Evidence: `backend/.env.example` — CORS env
  > Evidence: `backend/app/main.py` — CORS setup
- [UNCONFIRMED: recruiter job turn-off/delete behavior appears partly localStorage-based in source]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Missing / Unclear / Need Confirmation
- [UNCONFIRMED: backend supports matching configuration, but visible recruiter API upload code does not append `matching_config` field]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Missing / Unclear / Need Confirmation

## Mock Data Notes
- FPT mock jobs and CV logs exist for demo UI
  > Evidence: `src/mock/cvScreeningMockData.ts` — mock job/CV data
  > Evidence: `src/features/recruiter/utils/recruiterMockMappers.ts` — `MOCK_FPT_CV_LOGS` / mock mappers
- Default admin seeded on startup
  > Evidence: `backend/app/database.py` — `ensure_default_admin`
- Mock data must not be treated as real evaluation evidence
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 6 Mock data / seed data

## Previous Difficulties / Development Challenges
- Whole-document similarity can miss section-specific requirements
  > Evidence: `backend/app/services/matcher.py` — section extraction and section weights
- Inconsistent CV formats affect text extraction quality
  > Evidence: `backend/app/services/extractor.py` — PDF/DOCX/image extraction
- JD requirements may be implicit
  > Evidence: `backend/app/services/matcher.py` — heading maps and required/preferred detection
- Explainability is needed for HR decisions
  > Evidence: `backend/app/models.py` — `JobApplication.matching_detail`
  > Evidence: `backend/app/services/matcher.py` — matching explanation output
- Mock data vs real data gap
  > Evidence: `src/mock/cvScreeningMockData.ts` — mock data
- Frontend/backend integration depends on API URL and rewrites
  > Evidence: `next.config.ts` — rewrites
  > Evidence: `.env.example` — frontend env
- Database migration approach risks schema drift
  > Evidence: `backend/app/database.py` — `run_startup_migrations`
- Testing coverage limitations
  > Evidence: `backend/tests/` — backend tests only
  > Evidence: `package.json` — frontend lint script
- Deployment complexity from OCR/ML dependencies and persistent uploads
  > Evidence: `backend/Dockerfile` — OCR dependencies
  > Evidence: `backend/app/routes/cvs.py` — upload directory

## Proposed Improvements In Implementation Chapters
- [UNCONFIRMED: proposed tests are not current implementation]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 13 Suggested Test Plan for Report
- [UNCONFIRMED: proposed matching evaluation metrics are not implemented]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 13 Suggested Test Plan for Report
- [UNCONFIRMED: proposed improved matching design is not current implementation]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 11 Proposed Improved Matching Design

# Chapter 5 — Conclusion

## Source Mapping
- Source sections mapped: Section 18 Future Work; Section 20 Conclusion paragraph and report-ready draft paragraphs
  > Evidence: `docs/report/code_extracted_report_materials.md` — Sections 18 and 20

## Achieved Results
- Functional prototype for candidate, recruiter, and admin workflows
  > Evidence: `src/app/candidate_UI/page.tsx` — candidate workflow
  > Evidence: `src/features/recruiter/RecruiterPage.tsx` — recruiter workflow
  > Evidence: `src/app/admin/dashboard/page.tsx` — admin workflow
- Relational recruitment data model
  > Evidence: `backend/app/models.py` — SQLModel entities
- CV/JD text extraction
  > Evidence: `backend/app/services/extractor.py` — `extract_text`
- Explainable section-based matching engine
  > Evidence: `backend/app/services/matcher.py` — `score_cv_vs_jd`
- Matching score/details stored with applications
  > Evidence: `backend/app/models.py` — `JobApplication.ai_matching_score` / `matching_detail`
  > Evidence: `backend/app/routes/cvs.py` — score/detail persistence
- Backend tests for core flows
  > Evidence: `backend/tests/test_*.py` — backend tests
- Docker/Vercel/Railway deployment configuration
  > Evidence: `backend/Dockerfile` — backend container
  > Evidence: `backend/docker-compose.yml` — local stack
  > Evidence: `vercel.json` — frontend deployment
  > Evidence: `backend/railway.json` — backend deployment

## Limitations
- Prototype rather than production-ready recruitment platform
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 20 Limitations
- localStorage-based frontend sessions
  > Evidence: `src/utils/loginHandler.ts` — localStorage usage
- ID-based role checks
  > Evidence: `backend/app/routes/admin.py` — `require_admin`
  > Evidence: `backend/app/routes/recruiter.py` — `require_recruiter`
- Heuristic score weights
  > Evidence: `backend/app/services/matcher.py` — `DEFAULT_WEIGHTS`
- Optional embedding behavior
  > Evidence: `backend/app/services/matcher.py` — `ENABLE_MATCHER_EMBEDDINGS`
- Local filesystem uploads
  > Evidence: `backend/app/routes/cvs.py` — `CV_UPLOAD_DIR`
  > Evidence: `backend/app/routes/jobs.py` — upload directory handling
- Incomplete frontend test coverage
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 13 Coverage Gaps
- Lack of labeled evaluation dataset
  > Evidence: `docs/report/code_extracted_report_materials.md` — Missing / Unclear / Need Confirmation

## Future Work Items
- Complete frontend use of application status updates
  > Evidence: `backend/app/routes/recruiter.py` — `update_application_status`
  > Flag: [UNCONFIRMED: frontend usage is limited/unclear in source]
- Persist recruiter job management state in backend
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: described as future/proposed work in source]
- Improve UI consistency
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: proposed future work]
- Add missing frontend tests
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: proposed future work]
- Improve invalid-file and extraction error handling
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: proposed future work]
- Extend JD parsing beyond PDF
  > Evidence: `backend/app/routes/jobs.py` — `upload_jd` accepts PDF
  > Flag: [UNCONFIRMED: proposed future work]
- Expose configurable weights in recruiter UI
  > Evidence: `backend/app/services/matching_config.py` — matching config support
  > Flag: [UNCONFIRMED: proposed future work]
- Add API-level authorization tokens
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: proposed future work]
- Introduce formal migrations
  > Evidence: `backend/app/database.py` — current startup migrations
  > Flag: [UNCONFIRMED: proposed future work]
- Use vector database for embeddings
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: proposed future work]
- Create labeled CV-JD benchmark dataset
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: proposed future work]
- Evaluate ranking with Precision@K, Recall@K, NDCG@K
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: proposed future work]
- Support multilingual CV/JD parsing
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: proposed future work]
- Deploy with object storage and monitoring
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: proposed future work]
- Analyze fairness/bias in automated screening
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 18 Future Work
  > Flag: [UNCONFIRMED: proposed future work]

# Appendix

## Source Mapping
- Source sections mapped: Section 1 Repository Overview; Section 19 Suggested Final Report Outline; Section 21 Evidence Index; Section 22 Missing Manual Work Required Outside Codebase; Missing / Unclear / Need Confirmation
  > Evidence: `docs/report/code_extracted_report_materials.md` — Sections 1, 19, 21, 22

## Repository Evidence Index
- `src/app/`: Next.js App Router pages for public, candidate, recruiter, and admin interfaces
  > Evidence: `src/app/layout.tsx` — app layout
  > Evidence: `src/app/page.tsx` — home page
  > Evidence: `src/app/login/page.tsx` — login page
  > Evidence: `src/app/candidate_UI/page.tsx` — candidate UI
  > Evidence: `src/app/recruiter_UI/page.tsx` — recruiter UI page
  > Evidence: `src/app/admin/dashboard/page.tsx` — admin dashboard
- `src/features/recruiter/`: recruiter dashboard feature module
  > Evidence: `src/features/recruiter/RecruiterPage.tsx` — recruiter page component
  > Evidence: `src/features/recruiter/services/recruiterApi.ts` — recruiter API wrappers
  > Evidence: `src/features/recruiter/utils/cvScoringUtils.ts` — scoring utilities
  > Evidence: `src/features/recruiter/types/recruiterTypes.ts` — recruiter types
- `src/components/`: shared UI components
  > Evidence: `src/components/Jobcard.tsx` — job card
  > Evidence: `src/components/navbar/Navbar.tsx` — navbar
  > Evidence: `src/components/navbar/Navbar_candidate.tsx` — candidate navbar
  > Evidence: `src/components/brand/BrandLogo.tsx` — brand logo
- `src/utils/`: frontend utility layer
  > Evidence: `src/utils/api.ts` — API URL helper
  > Evidence: `src/utils/loginHandler.ts` — login handling
  > Evidence: `src/utils/registerHandler.ts` — registration handling
  > Evidence: `src/utils/adminLoginHandler.ts` — admin login handling
- `src/mock/`: mock job and CV-screening data
  > Evidence: `src/mock/cvScreeningMockData.ts` — mock data
  > Evidence: `src/features/recruiter/utils/recruiterMockMappers.ts` — mock mappers
- `backend/app/`: FastAPI backend application
  > Evidence: `backend/app/main.py` — app entry point
  > Evidence: `backend/app/models.py` — data models
  > Evidence: `backend/app/database.py` — database setup
  > Evidence: `backend/app/security.py` — password security
- `backend/app/routes/`: backend API routers
  > Evidence: `backend/app/routes/auth.py` — auth router
  > Evidence: `backend/app/routes/admin.py` — admin router
  > Evidence: `backend/app/routes/recruiter.py` — recruiter router
  > Evidence: `backend/app/routes/jobs.py` — jobs router
  > Evidence: `backend/app/routes/cvs.py` — CV router
  > Evidence: `backend/app/routes/match.py` — matching router
- `backend/app/services/`: parsing, vectorization, matching/scoring services
  > Evidence: `backend/app/services/extractor.py` — text extraction
  > Evidence: `backend/app/services/matcher.py` — matcher
  > Evidence: `backend/app/services/vectorizer.py` — vectorization
  > Evidence: `backend/app/services/ai_service.py` — vector cosine scoring
  > Evidence: `backend/app/services/matching_config.py` — matching config
  > Evidence: `backend/app/services/skill_aliases.json` — aliases
- `backend/tests/`: backend tests
  > Evidence: `backend/tests/test_matcher_simple.py` — matcher tests
  > Evidence: `backend/tests/test_cvs_upload.py` — CV upload tests
  > Evidence: `backend/tests/test_auth_routes.py` — auth tests
  > Evidence: `backend/tests/test_admin_routes.py` — admin tests
- `backend/uploads/`: local upload storage directory
  > Evidence: `backend/app/routes/cvs.py` — `CV_UPLOAD_DIR`
  > Evidence: `backend/app/routes/jobs.py` — upload directory handling
- `backend/docker-compose.yml`: local PostgreSQL and backend orchestration
  > Evidence: `backend/docker-compose.yml` — services `db`, `backend`, PostgreSQL 16
- `backend/Dockerfile`: backend image
  > Evidence: `backend/Dockerfile` — Python 3.11, Tesseract OCR, Uvicorn
- `package.json`: frontend metadata and scripts
  > Evidence: `package.json` — dependencies and scripts
- `backend/requirements.txt`: backend Python dependencies
  > Evidence: `backend/requirements.txt` — FastAPI, SQLModel, PostgreSQL drivers, OCR/parsing, sentence-transformers, scikit-learn
- `next.config.ts`: frontend-backend rewrite configuration
  > Evidence: `next.config.ts` — `/api/*`, `/uploads/*`
- `.env.example`, `backend/.env.example`: environment templates
  > Evidence: `.env.example` — frontend env
  > Evidence: `backend/.env.example` — backend env
- `vercel.json`, `backend/railway.json`: deployment metadata
  > Evidence: `vercel.json` — frontend deployment
  > Evidence: `backend/railway.json` — backend deployment
- `.next/`, `node_modules/`, `.venv/`, `backend/.venv/`, `.git/`, `.vercel/`: generated/dependency/tooling folders; not report evidence except exclusions
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 1 Repository Structure Summary

## Evidence Index From Source Section 21
- Frontend uses Next.js and React
  > Evidence: `package.json` — dependencies `next`, `react`, `react-dom`
- Backend uses FastAPI
  > Evidence: `backend/app/main.py` — `FastAPI(...)`
  > Evidence: `backend/requirements.txt` — FastAPI dependency
- Database uses SQLModel/PostgreSQL
  > Evidence: `backend/app/models.py` — `SQLModel`
  > Evidence: `backend/app/database.py` — database engine/session
  > Evidence: `backend/docker-compose.yml` — `postgres:16`
- User roles are candidate/recruiter/admin
  > Evidence: `backend/app/models.py` — `User.role`
- Candidate self-registration only allows candidate role
  > Evidence: `backend/app/routes/auth.py` — `register_user`
- Recruiter accounts are admin-created
  > Evidence: `backend/app/routes/admin.py` — `create_recruiter`
- Passwords are hashed with bcrypt
  > Evidence: `backend/app/security.py` — `get_password_hash` / `verify_password`
- JD upload accepts PDF
  > Evidence: `backend/app/routes/jobs.py` — `upload_jd`
- CV upload accepts PDF/DOCX/images
  > Evidence: `backend/app/routes/cvs.py` — `ALLOWED_EXTENSIONS`
- PDF/DOCX/image text extraction is implemented
  > Evidence: `backend/app/services/extractor.py` — `extract_text_from_pdf` / `extract_text_from_docx` / `extract_text_from_image`
- Matching is section-aware and weighted
  > Evidence: `backend/app/services/matcher.py` — `DEFAULT_WEIGHTS` / `_section_result` / `score_cv_vs_jd`
- Matching explanations are stored
  > Evidence: `backend/app/routes/cvs.py` — `matching_detail`
  > Evidence: `backend/app/models.py` — `JobApplication.matching_detail`
- Optional embedding support exists
  > Evidence: `backend/app/services/vectorizer.py` — `get_model`
  > Evidence: `backend/app/services/matcher.py` — `_embed_cosine`
- Candidate UI uploads CV
  > Evidence: `src/app/candidate_UI/page.tsx` — fetch `/api/cvs/upload-cv`
- Recruiter UI loads CV logs and applications
  > Evidence: `src/features/recruiter/RecruiterPage.tsx` — recruiter page
  > Evidence: `src/features/recruiter/services/recruiterApi.ts` — `fetchRecruiterCvLogs` / `fetchJobApplications`
- Admin dashboard shows overview and recruiter management
  > Evidence: `src/app/admin/dashboard/page.tsx` — dashboard
  > Evidence: `backend/app/routes/admin.py` — `admin_overview` / `create_recruiter`
- Activity logging is implemented
  > Evidence: `backend/app/models.py` — `ActivityLog`
  > Evidence: route files — `ActivityLog` insertions
- Testing exists for backend flows
  > Evidence: `backend/tests/test_*.py` — route/service tests
- Deployment supports Docker/Vercel/Railway
  > Evidence: `backend/Dockerfile` — Docker image
  > Evidence: `backend/docker-compose.yml` — compose
  > Evidence: `vercel.json` — frontend deployment
  > Evidence: `backend/railway.json` — backend deployment
- Mock data exists and may affect report evidence
  > Evidence: `src/mock/cvScreeningMockData.ts` — mock data
  > Evidence: `src/features/recruiter/utils/recruiterMockMappers.ts` — mock utilities

## Missing Manual Work Required Outside Codebase
- [MANUAL INPUT NEEDED: final report cover page information]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: student name, student ID, class, department, university, supervisor, and submission date]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: final architecture figures exported as images if required by the report template]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: manually captured screenshots for candidate, recruiter, admin, API docs, and deployment]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: real CV/JD experiment dataset or anonymized sample dataset]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: human relevance judgments from recruiters or evaluators]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: actual matching evaluation results: Precision@K, Recall@K, NDCG@K, score consistency, and explanation quality]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: references to academic papers on recruitment automation, information retrieval, semantic similarity, embeddings, and fairness/bias in hiring]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: production deployment URLs and screenshots from Vercel/Railway if deployed]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: demo script describing step-by-step use of admin, recruiter, and candidate flows]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: appendix materials: environment variable table, API endpoint screenshots, Docker screenshots, database screenshots]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: manual confirmation of which UI mock/demo data should be included or excluded from the final demonstration]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: security review notes if the system is presented as production-ready]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22
- [MANUAL INPUT NEEDED: real performance measurements such as upload processing time, scoring latency, or database response time]
  > Evidence: `docs/report/code_extracted_report_materials.md` — Section 22

## Flag Summary

### Manual Input Needed
- [MANUAL INPUT NEEDED: final report cover page information]
- [MANUAL INPUT NEEDED: student name, student ID, class, department, university, supervisor, and submission date]
- [MANUAL INPUT NEEDED: final architecture figures exported as images if required by the report template]
- [MANUAL INPUT NEEDED: manually captured screenshots for candidate, recruiter, admin, API docs, and deployment]
- [MANUAL INPUT NEEDED: real CV/JD experiment dataset or anonymized sample dataset]
- [MANUAL INPUT NEEDED: human relevance judgments from recruiters or evaluators]
- [MANUAL INPUT NEEDED: actual matching evaluation results: Precision@K, Recall@K, NDCG@K, score consistency, and explanation quality]
- [MANUAL INPUT NEEDED: references to academic papers on recruitment automation, information retrieval, semantic similarity, embeddings, and fairness/bias in hiring]
- [MANUAL INPUT NEEDED: production deployment URLs and screenshots from Vercel/Railway if deployed]
- [MANUAL INPUT NEEDED: demo script describing step-by-step use of admin, recruiter, and candidate flows]
- [MANUAL INPUT NEEDED: appendix materials: environment variable table, API endpoint screenshots, Docker screenshots, database screenshots]
- [MANUAL INPUT NEEDED: manual confirmation of which UI mock/demo data should be included or excluded from the final demonstration]
- [MANUAL INPUT NEEDED: security review notes if the system is presented as production-ready]
- [MANUAL INPUT NEEDED: real performance measurements such as upload processing time, scoring latency, or database response time]

### Unconfirmed
- [UNCONFIRMED: no labeled CV-JD evaluation dataset was found]
- [UNCONFIRMED: no implemented ranking metrics such as Precision@K, Recall@K, or NDCG@K were found]
- [UNCONFIRMED: no formal frontend test suite was found]
- [UNCONFIRMED: no JWT or server-side session authentication was found; current authorization relies on role checks using IDs and frontend localStorage]
- [UNCONFIRMED: no formal Alembic-style migration folder was found; schema changes are handled by SQLModel table creation plus startup `ALTER TABLE IF NOT EXISTS` statements]
- [UNCONFIRMED: recruiter job turn-off/delete behavior appears partly localStorage-based in the source]
- [UNCONFIRMED: backend supports matching configuration, but visible recruiter API upload code does not append `matching_config` field]
- [UNCONFIRMED: production file storage is local/container filesystem based; persistent object storage is not implemented]
- [UNCONFIRMED: matching quality is not proven by real-world experiment results in the codebase]
- [UNCONFIRMED: separate dynamic job detail/apply route described as partially implemented/unclear in source]
- [UNCONFIRMED: no formal coverage report found]
- [UNCONFIRMED: proposed improved matching design is not current implementation]
- [UNCONFIRMED: proposed tests are not current implementation]
- [UNCONFIRMED: proposed matching evaluation metrics are not implemented]
- [UNCONFIRMED: production readiness is limited by authentication, storage, and evaluation gaps]
- [UNCONFIRMED: frontend usage of application status update is limited/unclear in source]
- [UNCONFIRMED: persist recruiter job management state in backend is proposed future work in source]
- [UNCONFIRMED: UI consistency improvement is proposed future work]
- [UNCONFIRMED: invalid-file and extraction error handling improvement is proposed future work]
- [UNCONFIRMED: JD parsing beyond PDF is proposed future work]
- [UNCONFIRMED: expose configurable weights in recruiter UI is proposed future work]
- [UNCONFIRMED: API-level authorization tokens are proposed future work]
- [UNCONFIRMED: formal migrations are proposed future work]
- [UNCONFIRMED: vector database for embeddings is proposed future work]
- [UNCONFIRMED: labeled CV-JD benchmark dataset is proposed future work]
- [UNCONFIRMED: ranking evaluation with Precision@K, Recall@K, NDCG@K is proposed future work]
- [UNCONFIRMED: multilingual CV/JD parsing is proposed future work]
- [UNCONFIRMED: object storage and monitoring are proposed future work]
- [UNCONFIRMED: fairness/bias analysis in automated screening is proposed future work]
