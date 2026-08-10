# Graph Report - .  (2026-08-04)

## Corpus Check
- Large corpus: 235 files · ~1,063,416 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1032 nodes · 2336 edges · 78 communities (69 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.66)
- Token cost: 332,112 input · 0 output

## Community Hubs (Navigation)
- CV-JD Matching Route
- Candidate Dashboard UI
- CV Upload & Applications API
- Frontend Dependencies
- Database Models
- Recruiter JD Upload UI
- Auth Routes & User Model
- TypeScript Config Refs
- Backend Deployment Config
- Recruiter CV Log & Radar Chart
- Matcher Scoring Engine
- Azure Talent Design System Spec
- Recruiter Job Routes
- Manual Review Export Script
- Matching Pipeline Demo
- Crosspair Evaluation Export
- Admin Routes
- Matcher Requirement Extractor
- Recruiter Login/Password Pages
- Recruiter CV Filters & Sorting
- Matcher Core Services
- Dashboard Charts
- Admin Routes Tests
- Recruiter Job Management UI
- Candidate Login & Auth Session
- Matcher Skill Alias Mapping
- Backend App Bootstrap
- AI Vectorizer Service
- Candidate Registration UI
- Admin Activity Logs UI
- Jobs Matching Config Tests
- CV Upload Tests
- Mock CV Screening Data
- Legacy Candidate/Recruiter Pages
- Crosspair Matching Eval Tool
- Matcher Experience-Year Parsing
- CV: David Robe (duplicate uploads)
- Admin Dashboard Page
- Crosspair Matching Eval Script
- Matching Labels Eval Script
- Matcher Text Cleaning
- JD: Fullstack Dev Java (duplicates)
- CV: Le Minh Khoa (JP)
- CV: Le Minh Khoa (EN)
- Recruiter Matching Detail Tests
- Recruiter Flow Verify Script
- Theme CSS Verify Script
- Admin Register & Job Apply Pages
- Register Form Handler
- CV: Nguyen Hoang Minh (duplicate uploads)
- CV: Akiyama Hiroto (Demo Strong Fit)
- JD: GEO System Senior Fullstack
- Candidate Flow Verify Script
- Candidate Settings Page
- CV: Nguyen Van Hai
- CV: Pham Quang Huy
- CV: Claire Moreau (Demo Low Fit)
- CV: Tran Minh Duc
- CV: Tran Bao Duc (Demo Not Suitable)
- JD: FPT Software AI Engineer
- Root Layout & Fonts
- Line Chart Component
- CV: Nguyen Gia Huy (Demo Weak Fit)
- Matching Detail UI Verify Script
- Doughnut Chart Component
- Coding Guidelines Docs
- Recruiter Stat Card
- ESLint Config
- Start Demo Script
- Stop Demo Script
- CV: Tien Dat (invalid PDF)
- CV: Tien Dat TopCV (invalid PDF)
- CV: Pending Image-Only Upload

## God Nodes (most connected - your core abstractions)
1. `ActivityLog` - 39 edges
2. `User` - 34 edges
3. `Job` - 30 edges
4. `CvScoringService` - 28 edges
5. `score_cv_vs_jd()` - 26 edges
6. `apiUrl()` - 26 edges
7. `CV` - 25 edges
8. `JobApplication` - 25 edges
9. `UI Refactor Task (Recruitment Portal)` - 22 edges
10. `normalizeScore()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Database Layer (SQLModel/PostgreSQL)` --references--> `User`  [EXTRACTED]
  docs/report/code_extracted_report_materials.md → backend/app/models.py
- `Report Chapter 3 - System Analysis & Design` --references--> `User`  [EXTRACTED]
  report_info.md → backend/app/models.py
- `TASK.md Coding & Behavior Guidelines` --semantically_similar_to--> `CLAUDE.md Coding & Behavior Guidelines`  [INFERRED] [semantically similar]
  .agents/TASK.md → CLAUDE.md
- `Local Docker Compose Lifecycle Workflow` --semantically_similar_to--> `Railway Backend Deployment`  [INFERRED] [semantically similar]
  README.md → DEPLOY_VERCEL_RAILWAY.md
- `Report Chapter 1 - Introduction` --semantically_similar_to--> `Intelligent CV Screening and Recruitment Management (Project)`  [INFERRED] [semantically similar]
  report_info.md → docs/report/code_extracted_report_materials.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend-Backend-Database-Deployment Request Flow** — docs_report_code_extracted_report_materials_frontendlayer, docs_report_code_extracted_report_materials_backendlayer, docs_report_code_extracted_report_materials_databaselayer, docs_report_code_extracted_report_materials_deploymentlayer [EXTRACTED 1.00]
- **CV-JD Matching Pipeline Stage Chain** — backend_app_services_extractor, backend_app_services_matcher, backend_app_services_vectorizer, backend_app_services_matching_config [EXTRACTED 1.00]
- **Core Reusable UI Component Set for Portal Refactor** — _agents_agents_appshell, _agents_agents_sidebarnavigation, _agents_agents_pageheader, _agents_agents_datatable, _agents_agents_metriccard [INFERRED 0.85]
- **Candidates evaluated against the GEO System Replace Senior Full Stack Developer JD** — backend_app_uploads_jd_9ddcbc12_81f8_4ff7_b0dd_8be6d9d52ab5_senior_full_stack_developer_java_spring_c_ng_ty_tnhh_geo_system_solutions_vi_t_nam_jd, backend_app_uploads_cv_0cc2a141_b156_4b37_b8d3_9e5c32b9568b_nguy_n_v_n_h_i_25_candidate, backend_app_uploads_cv_1f5a4023_336c_4416_aeec_b97430229c29_ph_m_quang_huy_70_candidate, backend_app_uploads_cv_273f1c97_5156_482b_a4f1_eda82a58ac2d_cv_demo_03_weak_target_45_55_nguyen_gia_huy_candidate, backend_app_uploads_cv_718bc614_5c47_47ad_908c_ae2d0edee78b_cv_demo_05_low_potential_target_60_65_claire_moreau_candidate, backend_app_uploads_cv_747f12df_ce2f_46a3_856e_40fe3bed2e81_tr_n_minh_c_40_candidate, backend_app_uploads_cv_780e693c_6050_44ac_bf97_ed082e7db86c_le_minh_khoa_98_jp_candidate, backend_app_uploads_cv_8f18e33c_6334_4248_8c81_88dbf749a199_cv_demo_01_strong_target_86_92_akiyama_hiroto_candidate, backend_app_uploads_cv_97e5a213_b438_421c_ab66_378f5d352d18_david_robe_85_candidate, backend_app_uploads_cv_b861fbba_d0b0_47f5_a10e_3f128e00c3f3_cv_demo_04_not_suitable_target_25_40_tran_bao_duc_candidate, backend_app_uploads_cv_bd5148fe_f54f_4106_be8e_4d7ba341a630_l_minh_khoa_98_candidate, backend_app_uploads_cv_c8c88219_0b80_46b6_b0b8_59888966a5c8_cv_demo_02_potential_target_68_74_david_robe_candidate [INFERRED 0.85]
- **Duplicate uploads of the LG CNS Senior Java Fullstack Developer job description** — backend_app_uploads_jd_ab9d4664_c742_47ae_9eda_d6f2be1b494a_jd_fullstack_dev_java_jd, backend_app_uploads_jd_c6fd9bcf_e88a_438b_b712_bc34e901c034_jd_fullstack_dev_java_jd, backend_app_uploads_jd_d37f3bbe_f087_49bd_a112_146578cf436e_jd_fullstack_dev_java_jd, backend_app_uploads_jd_f337ed37_3225_468d_9c26_d48f1d72af16_jd_fullstack_dev_java_jd [EXTRACTED 1.00]
- **Shared Java/Spring backend skill cluster across senior fullstack candidates** — backend_app_uploads_cv_1f5a4023_336c_4416_aeec_b97430229c29_ph_m_quang_huy_70_skill_backend, backend_app_uploads_cv_3c33b561_b8f7_4ea6_b667_dec0ef58c8f1_nguyen_hoang_minh_92_skill_backend, backend_app_uploads_cv_780e693c_6050_44ac_bf97_ed082e7db86c_le_minh_khoa_98_jp_skill_backend, backend_app_uploads_cv_8f18e33c_6334_4248_8c81_88dbf749a199_cv_demo_01_strong_target_86_92_akiyama_hiroto_skill_backend, backend_app_uploads_cv_97e5a213_b438_421c_ab66_378f5d352d18_david_robe_85_skill_backend, backend_app_uploads_cv_bd5148fe_f54f_4106_be8e_4d7ba341a630_l_minh_khoa_98_skill_backend [INFERRED 0.75]

## Communities (78 total, 9 thin omitted)

### Community 0 - "CV-JD Matching Route"
Cohesion: 0.07
Nodes (28): _build_scoring_response(), match_cv_vs_jd(), match_cv_vs_jd_text(), post, UploadFile, Match a CV file against a Job Description using the new criteria-based hybrid…, Match CV text directly against Job Description text using the new criteria-…, CriteriaScoringService (+20 more)

### Community 1 - "Candidate Dashboard UI"
Cohesion: 0.08
Nodes (39): JobCard(), JobCardProps, ALL_CATEGORIES, CandidateLayout(), CandidateSubmissionItem, JobItem, MatchingDetail, MatchingSection (+31 more)

### Community 2 - "CV Upload & Applications API"
Cohesion: 0.09
Nodes (33): list_candidate_applications(), list_cvs_for_job(), get, post, Session, UploadFile, score_application_background(), upload_cv() (+25 more)

### Community 3 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (35): Backend Python Dependency Manifest, chart.js, Technology Stack, eslint, eslint-config-next, next, dependencies, chart.js (+27 more)

### Community 4 - "Database Models"
Cohesion: 0.16
Nodes (24): get_session(), ActivityLog, CV, Job, JobApplication, CreateRecruiterRequest, BaseModel, UpdateRecruiterRequest (+16 more)

### Community 5 - "Recruiter JD Upload UI"
Cohesion: 0.15
Nodes (27): Props, RecruiterUploadJDModal(), ENABLE_DEV_MOCK_DATA, useRecruiterData(), ActivePage, DashboardRange, RecruiterLayout(), RecruiterLayoutProps (+19 more)

### Community 6 - "Auth Routes & User Model"
Cohesion: 0.16
Nodes (27): User, CandidateProfileUpdateRequest, change_password(), ChangePasswordRequest, login_user(), BaseModel, post, put (+19 more)

### Community 7 - "TypeScript Config Refs"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 8 - "Backend Deployment Config"
Cohesion: 0.09
Nodes (24): docker-compose backend service, docker-compose db service (Postgres 16), backend/Dockerfile, build, builder, dockerfilePath, deploy, healthcheckPath (+16 more)

### Community 9 - "Recruiter CV Log & Radar Chart"
Cohesion: 0.16
Nodes (23): Props, RADAR_COLORS, RadarChart(), CVLogItemRow(), Props, scoreStatusClass(), CVDetailPage(), Props (+15 more)

### Community 10 - "Matcher Scoring Engine"
Cohesion: 0.11
Nodes (25): _embed_cosine(), _keyword_item_match(), _known_terms_in_item(), Bộ so khớp và chấm điểm (scorer) — phần LÕI của toàn hệ thống. Luồng chính khi…, Khớp CHÍNH XÁC: yêu cầu phải trùng đúng 1 mục trong CV (hoặc kỹ năng tương…, Rút các từ khóa 'đã biết' (kỹ năng/ngôn ngữ) xuất hiện trong 1 mục., Khớp theo TỪ KHÓA: so tập từ khóa của yêu cầu với từ khóa trong CV, cần đủ độ…, Khớp theo NGỮ NGHĨA: có mục nào trong CV đạt độ tương đồng >= 0.35 với yêu cầu… (+17 more)

### Community 11 - "Azure Talent Design System Spec"
Cohesion: 0.08
Nodes (24): Admin Dashboard (page), AppShell component, Azure Talent System Design, ChartCard component, DashboardCard component, DataTable component, Design Tokens (colors, typography, spacing, radius), EmptyState component (+16 more)

### Community 12 - "Recruiter Job Routes"
Cohesion: 0.26
Nodes (22): delete_application_and_cv(), delete_recruiter_job(), _detail_lines(), extract_cv_detail_fields(), extract_cv_experience_years(), get_recruiter_profile(), list_job_applications_for_recruiter(), list_recruiter_cv_logs() (+14 more)

### Community 13 - "Manual Review Export Script"
Cohesion: 0.25
Nodes (22): _array_block(), _clean_text(), _compact_items(), _database_urls(), _evidence_quality(), _excerpt(), _extract_database_rows(), _extract_mock_rows() (+14 more)

### Community 14 - "Matching Pipeline Demo"
Cohesion: 0.11
Nodes (9): skill_aliases.json, CV/JD Matching Pipeline (README_PIPELINE), Matcher Test Runner Instructions, _section(), test_alias_matching_case_if_alias_file_exists(), test_experience_match_and_rule_pass(), test_extract_experience_years_supports_japanese_year_expressions(), test_structured_experience_years_and_preferred_sections() (+1 more)

### Community 15 - "Crosspair Evaluation Export"
Cohesion: 0.19
Nodes (20): _array_block(), _compact_items(), _crosspair_rows(), _cv_text(), _evidence_quality(), _job_text(), _join(), main() (+12 more)

### Community 16 - "Admin Routes"
Cohesion: 0.31
Nodes (19): admin_delete_candidate(), admin_delete_job(), admin_delete_recruiter(), admin_list_jobs(), admin_overview(), create_recruiter(), _delete_file_if_exists(), _delete_job_and_dependencies() (+11 more)

### Community 17 - "Matcher Requirement Extractor"
Cohesion: 0.18
Nodes (19): _canonicalize_item(), _extract_demands_from_jd(), _extract_known_terms(), _extract_list_items(), _extract_section_items(), Bộ trích xuất (extractor): rút thông tin có cấu trúc từ text của CV/JD. Gồm 3…, Trả về tên chuẩn của 1 mục nếu có trong alias, ngược lại trả chính nó (đã chuẩn…, Tìm trong text những từ khóa nằm trong tập 'terms' (khớp nguyên từ, không dính… (+11 more)

### Community 18 - "Recruiter Login/Password Pages"
Cohesion: 0.13
Nodes (10): Post-deploy Quick Checks, RecruiterLoginProps, RecruiterToast(), RecruiterToastProps, FINT_MOCK_APPLICATIONS_STORAGE_KEY, JOB_MANAGEMENT_LABELS, RECRUITER_PASSWORD_CHANGE_STORAGE_KEY, RECRUITER_SESSION_STORAGE_KEY (+2 more)

### Community 19 - "Recruiter CV Filters & Sorting"
Cohesion: 0.25
Nodes (17): useCVFilters(), Props, SubmittedCVsPage(), CvSortMode, ExperienceFilter, ScoreStatus, BORDERLINE_SCORE_THRESHOLD, filterCvsByExperience() (+9 more)

### Community 20 - "Matcher Core Services"
Cohesion: 0.16
Nodes (16): Cấu hình tĩnh cho bộ so khớp CV-JD. File này KHÔNG chứa logic, chỉ chứa dữ liệu…, _extract_evidence_from_cv(), Trích 'bằng chứng' của ứng viên theo từng section, để so với demands của JD., parse_sections_cv(), parse_sections_jd(), Bộ tách section (parser) cho CV và JD. Nhiệm vụ: đọc text thô, nhận diện các…, Nhận diện 1 dòng có phải tiêu đề section không, trả về khóa section hoặc None., Chia toàn bộ text thành dict {section: nội dung}. Dòng trước tiêu đề đầu tiên… (+8 more)

### Community 21 - "Dashboard Charts"
Cohesion: 0.17
Nodes (17): DashboardDoughnutChart(), DashboardDoughnutChartProps, DashboardLineChart(), DashboardLineChartProps, DoughnutChartDatum, LineChartSeries, DashboardPage(), DashboardRange (+9 more)

### Community 22 - "Admin Routes Tests"
Cohesion: 0.24
Nodes (16): make_user(), _make_session(), Session, _seed_admin(), test_admin_can_create_and_list_recruiter(), test_admin_create_recruiter_rejects_duplicate_email(), test_admin_overview_counts_core_records(), test_admin_routes_reject_non_admin_user() (+8 more)

### Community 23 - "Recruiter Job Management UI"
Cohesion: 0.16
Nodes (15): JobCard(), jobStatusClass(), Props, Props, CVLogItem, JobApplication, JobApplicationsResponse, JobManagementStatus (+7 more)

### Community 24 - "Candidate Login & Auth Session"
Cohesion: 0.24
Nodes (12): LoginPage(), AuthSession, AuthUser, clearAuthSession(), getAuthSession(), parseJson(), setAuthSession(), homeHrefForRole() (+4 more)

### Community 25 - "Matcher Skill Alias Mapping"
Cohesion: 0.13
Nodes (16): _load_alias_index(), load_aliases(), map_skills(), Đọc file skill_aliases.json (map: tên_chuẩn -> [các cách viết khác])., Đảo ngược bảng alias thành index: mọi biến thể -> tên chuẩn, để tra nhanh., Trích danh sách kỹ năng kỹ thuật từ text (đã canonical hóa qua alias)., Rút email, số điện thoại, ngôn ngữ, số năm và số tháng bằng biểu thức chính quy., regex_extract() (+8 more)

### Community 26 - "Backend App Bootstrap"
Cohesion: 0.19
Nodes (10): create_db_and_tables(), ensure_default_admin(), run_startup_migrations(), health(), lifespan(), get, root(), FastAPI (+2 more)

### Community 27 - "AI Vectorizer Service"
Cohesion: 0.30
Nodes (12): calculate_match_score(), calculate_match_score_from_vectors(), _normalize_vector(), _add_prefix(), get_model(), passage_to_vector(), passage_to_vector_json(), query_to_vector() (+4 more)

### Community 28 - "Candidate Registration UI"
Cohesion: 0.21
Nodes (10): RegisterCandidatePageContent(), BrandLogoFull(), BrandLogoFullProps, Navbar(), navItems, styles, Navbar(), navItems (+2 more)

### Community 29 - "Admin Activity Logs UI"
Cohesion: 0.22
Nodes (10): ACCOUNT_ACTIVITY_ACTIONS, ActivityItem, AdminActivityLogsPage(), AdminRecruitersPage(), RecruiterAccount, BrandLogoIcon(), BrandLogoIconProps, RecruiterSidebar() (+2 more)

### Community 30 - "Jobs Matching Config Tests"
Cohesion: 0.31
Nodes (8): FakeUploadFile, _make_session(), Session, _run_upload(), _seed_recruiter(), test_upload_jd_with_invalid_matching_config_returns_validation_error(), test_upload_jd_with_valid_matching_config_saves_config(), test_upload_jd_without_matching_config_still_works()

### Community 31 - "CV Upload Tests"
Cohesion: 0.35
Nodes (10): FakeUploadFile, _make_session(), _make_upload_file(), Session, _run_upload(), _seed_job_and_candidate(), test_candidate_applications_merge_candidate_id_email_and_activity_log_sources(), test_cv_upload_creates_cv_application_and_matching_detail() (+2 more)

### Community 32 - "Mock CV Screening Data"
Cohesion: 0.15
Nodes (12): Report Appendix - Repository Evidence Index, MOCK_CANDIDATES, MOCK_JOB_DESCRIPTIONS, MOCK_MATCHING_RESULTS, MockCandidateProfile, MockCandidateStatus, MockJobDescription, MockJobLevel (+4 more)

### Community 33 - "Legacy Candidate/Recruiter Pages"
Cohesion: 0.21
Nodes (3): Frontend Layer (Next.js App Router), RecruiterPage(), RecruiterPageProps

### Community 34 - "Crosspair Matching Eval Tool"
Cohesion: 0.33
Nodes (11): compact_items(), dcg(), evaluate(), main(), Path, ranking_metrics(), read_csv(), score_to_label() (+3 more)

### Community 35 - "Matcher Experience-Year Parsing"
Cohesion: 0.24
Nodes (10): extract_experience_years(), _extract_month_values(), _extract_year_values(), Rút số năm kinh nghiệm mà JD YÊU CẦU. Ưu tiên dạng ghi rõ 'experience years: N'., Lấy tất cả giá trị 'số năm' xuất hiện trong text (giới hạn hợp lý 0-50 năm)., Lấy tất cả giá trị 'số tháng' xuất hiện trong text (giới hạn 0-600 tháng)., Tính tổng số năm kinh nghiệm của ứng viên = max(số năm) + max(số tháng)/12., _required_experience_years() (+2 more)

### Community 36 - "CV: David Robe (duplicate uploads)"
Cohesion: 0.20
Nodes (10): David Robe - San Francisco (Senior Full Stack Developer, fit 85/100), Domain Expertise: omnichannel retail inventory, POS integration adapter, store operations backoffice, Backend Skills: Java, Spring Boot, Spring Security, JPA/Hibernate, Kafka, Redis, Frontend Skills: React, TypeScript, Next.js, Target Role: Senior Fullstack Engineer - scalable retail platforms, David Robe - Paris (Java Spring Full-Stack Developer, demo potential-target 68-74), Domain Experience: e-commerce retail catalog, partial inventory/POS visibility, limited Japanese collaboration, Backend Skills: Java, Spring Boot, Spring MVC, Spring Data JPA (+2 more)

### Community 37 - "Admin Dashboard Page"
Cohesion: 0.29
Nodes (9): ActivityItem, AdminDashboard(), AdminOverview, buildTrend(), DashboardRange, getDateKey(), getRangeDates(), RecruiterAccount (+1 more)

### Community 38 - "Crosspair Matching Eval Script"
Cohesion: 0.42
Nodes (8): _dcg(), main(), Path, _ranking_metrics(), _read_csv(), _safe_float(), _score_to_label(), _write_csv()

### Community 39 - "Matching Labels Eval Script"
Cohesion: 0.42
Nodes (8): _dcg(), main(), Path, _ranking_metrics(), _read_csv(), _safe_float(), _score_to_label(), _write_csv()

### Community 40 - "Matcher Text Cleaning"
Cohesion: 0.29
Nodes (7): _clamp_score(), clean_text(), Các hàm tiện ích xử lý văn bản thô cho bộ so khớp. Toàn bộ hàm ở đây là hàm…, Gộp mọi khoảng trắng thừa về 1 dấu cách và chuyển về chữ thường., Kẹp điểm về khoảng [low, high]., Đổi điểm 0-1 sang thang 0-100 và làm tròn., _score100()

### Community 41 - "JD: Fullstack Dev Java (duplicates)"
Cohesion: 0.25
Nodes (8): Senior Java Fullstack Developer - LG CNS (Hanoi), Preferred: experience deploying on Kubernetes, AWS, or GCP, Requirement: frontend development with HTML, CSS, JavaScript, TypeScript, WebSquare, Requirement: strong proficiency in Java and Spring/Spring Boot, Requirement: experience with RDBMS (MySQL/PostgreSQL) and strong SQL skills, Senior Java Fullstack Developer - LG CNS (duplicate upload), Senior Java Fullstack Developer - LG CNS (duplicate upload), Senior Java Fullstack Developer - LG CNS (duplicate upload)

### Community 42 - "CV: Le Minh Khoa (JP)"
Cohesion: 0.29
Nodes (7): Le Minh Khoa JP-localized CV (Senior Java Fullstack Developer, fit 98/100), Domain Expertise: retail, POS integration, reuse/second-hand business, system replacement, Language: Japanese JLPT N3, English business-level, Japan/Vietnam collaboration, Rationale: very high fit with GEO System Replace JD across Java/Spring, HTML/CSS/JavaScript, English design docs, testing, UX/UI, large-scale data processing, and Japan-team collaboration, Backend Skills: Java, Spring Boot, Spring Security, JPA/Hibernate, Kafka, Redis, batch processing, Frontend Skills: TypeScript, React, WebSquare-style enterprise UI, Target Role: Senior Java Fullstack Developer - System Replace core modernization

### Community 43 - "CV: Le Minh Khoa (EN)"
Cohesion: 0.29
Nodes (7): Le Minh Khoa EN CV (Senior Java Fullstack Developer, fit 98/100), Domain Expertise: retail, POS integration, reuse item intake and valuation, large-scale product master data migration, Language: Japanese JLPT N3, English professional, Japan/Vietnam requirement clarification meetings, Rationale: excellent fit for Java/Spring, HTML/CSS/JavaScript, English design documents, testing, UX/UI optimization, large data processing, and collaboration with Japanese teams for the GEO System Replace JD, Backend Skills: Java, Spring Boot, Spring Security, JPA/Hibernate, Kafka, Redis, batch processing, Frontend Skills: TypeScript, React, WebSquare-style enterprise UI, Target Role: Senior Java Fullstack Developer - System Replace core modernization

### Community 44 - "Recruiter Matching Detail Tests"
Cohesion: 0.62
Nodes (6): _make_session(), Session, _seed_application(), test_recruiter_applications_return_null_matching_detail_when_missing(), test_recruiter_applications_return_parsed_matching_detail_when_valid(), test_recruiter_logs_return_null_matching_detail_when_invalid_json()

### Community 45 - "Recruiter Flow Verify Script"
Cohesion: 0.29
Nodes (5): candidateSource, mockData, recruiterSource, requiredRecruiterSnippets, root

### Community 46 - "Theme CSS Verify Script"
Cohesion: 0.29
Nodes (5): candidateBrightCss, candidateDarkCss, candidatePage, recruiterCss, recruiterRequired

### Community 48 - "Register Form Handler"
Cohesion: 0.48
Nodes (6): handleRegisterSubmit(), RegisterStage, SetterType, validateConfirmPassword(), validateEmail(), validatePassword()

### Community 49 - "CV: Nguyen Hoang Minh (duplicate uploads)"
Cohesion: 0.33
Nodes (6): Nguyen Hoang Minh (Senior Java Fullstack Developer, 6 years), Own Project: Intelligent Recruitment and CV Matching Platform, Backend Skills: Java, Spring Boot, Spring Security, JPA/Hibernate, Kafka/RabbitMQ, Redis, Frontend Skills: React, Next.js, TypeScript, WebSquare, Target Role: Senior Java Fullstack Developer, Nguyen Hoang Minh 92 (duplicate CV upload)

### Community 50 - "CV: Akiyama Hiroto (Demo Strong Fit)"
Cohesion: 0.33
Nodes (6): Akiyama Hiroto (Senior Java/Spring Boot Full-Stack Engineer, demo strong-target 86-92), Domain Expertise: retail, POS transaction, inventory, product master, reuse/second-hand business, system replacement, Language: Japanese native, English advanced business documentation, daily Japan-side stakeholder collaboration, Backend Skills: Java 8/11/17, Spring Boot, Spring MVC, Spring Security, JPA/Hibernate, batch processing, Frontend Skills: HTML, CSS, JavaScript, TypeScript, React, Vue.js, Target Role: Senior Java / Spring Boot Full-Stack Engineer

### Community 51 - "JD: GEO System Senior Fullstack"
Cohesion: 0.33
Nodes (6): Senior Full Stack Developer - Java/Spring (GEO System Solutions Vietnam, System Replace project), Preferred: knowledge or experience in retail, POS systems, or the reuse industry, Rationale: GEO Holdings Corp (multinational reuse retailer, 2nd Street stores) is investing in System Replace to standardize technology, optimize operations, and eliminate business overlap across its multi-country Core IT system, with Vietnam and Japan teams collaborating in early phases, Requirement: ability to create design documents in English, Requirement: proficiency in HTML, CSS, JavaScript, Requirement: in-depth Java/Spring Framework knowledge and practical experience

### Community 52 - "Candidate Flow Verify Script"
Cohesion: 0.33
Nodes (4): jobCard, mockData, requiredCandidateSnippets, source

### Community 53 - "Candidate Settings Page"
Cohesion: 0.40
Nodes (3): CurrentUser, SettingsPage(), AUTH_SESSION_STORAGE_KEY

### Community 54 - "CV: Nguyen Van Hai"
Cohesion: 0.40
Nodes (5): Nguyen Van Hai (Frontend Developer, fit 25/100), Rationale: limited Java/Spring exposure, suitable for junior transition rather than senior System Replace role, Limited Backend Skills: basic Java syntax, limited Spring Boot learning, Frontend Skills: HTML, CSS, JavaScript, Bootstrap, basic TypeScript, Target Role: Enterprise Fullstack Transition (Frontend to Java/Spring)

### Community 55 - "CV: Pham Quang Huy"
Cohesion: 0.40
Nodes (5): Pham Quang Huy (Senior Java Fullstack Developer, fit 70/100), Backend Skills: Java, Spring Boot, Spring Security, JPA/Hibernate, PostgreSQL, MySQL, Domain Experience: finance, logistics, HR; moderate retail workflow exposure, Frontend Skills: HTML, CSS, JavaScript, TypeScript, React, Target Role: Senior Java Fullstack Developer

### Community 56 - "CV: Claire Moreau (Demo Low Fit)"
Cohesion: 0.40
Nodes (5): Claire Moreau (Java Backend Developer, demo low-potential-target 60-65), Rationale: retail/POS domain exposure, frontend ownership, and Japan-side collaboration are limited, so profile is a low Potential match rather than a Strong match for a senior retail system replacement role, Backend Skills: Java, Spring Boot, Spring Data JPA, PostgreSQL, MySQL, Testing Skills: JUnit, Mockito, integration tests, Postman, Target Role: Java Backend Developer

### Community 57 - "CV: Tran Minh Duc"
Cohesion: 0.40
Nodes (5): Tran Minh Duc (Fullstack Web Developer, fit 40/100), Rationale: stronger in PHP, Node.js, HTML/CSS/JavaScript and SQL than Java/Spring; would need ramp-up for senior Java/Spring architecture and Japan-facing design documents, Backend Skills: PHP/Laravel, Node.js/Express, basic Java/Spring Boot, Frontend Skills: HTML, CSS, JavaScript, Vue.js, Bootstrap, Target Role: Fullstack Web Developer (PHP/Node.js to Java/Spring transition)

### Community 58 - "CV: Tran Bao Duc (Demo Not Suitable)"
Cohesion: 0.40
Nodes (5): Tran Bao Duc (PHP/Node.js Web Developer, demo not-suitable-target 25-40), Rationale: candidate is stronger for PHP/Node.js junior-mid web development than Senior Java/Spring enterprise system replacement roles, Backend Skills: PHP, Laravel, Node.js, Express, MySQL, Limited Java/Spring: basic Spring Boot tutorial app only, no production experience, Target Role: PHP/Node.js Web Developer

### Community 59 - "JD: FPT Software AI Engineer"
Cohesion: 0.40
Nodes (5): AI Engineer / Junior AI-LLM Engineer - FPT Software NGT (Hanoi), Requirement: basic familiarity with AWS or Azure cloud services, Requirement: basic understanding of LLM/GenAI and prompt engineering, Requirement: Python programming (mandatory), Requirement: RAG pipelines, embeddings, vector search (Chroma, Pinecone, Elasticsearch)

### Community 60 - "Root Layout & Fonts"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 61 - "Line Chart Component"
Cohesion: 0.40
Nodes (3): Dataset, FALLBACK_COLORS, Props

### Community 62 - "CV: Nguyen Gia Huy (Demo Weak Fit)"
Cohesion: 0.50
Nodes (4): Nguyen Gia Huy (Frontend Developer, demo weak-target 45-55), Limited Backend Skills: basic Java syntax, limited Spring Boot learning, no production backend, Frontend Skills: HTML, CSS, JavaScript, TypeScript, React, Redux, Target Role: Frontend Developer / Junior Transition

### Community 63 - "Matching Detail UI Verify Script"
Cohesion: 0.50
Nodes (3): missing, requiredSnippets, source

### Community 65 - "Coding Guidelines Docs"
Cohesion: 0.67
Nodes (3): TASK.md Coding & Behavior Guidelines, Vietnamese Response Preference, CLAUDE.md Coding & Behavior Guidelines

## Ambiguous Edges - Review These
- `matcher.py` → `Existing/Legacy CSV Scoring System`  [AMBIGUOUS]
  matcher_evaluation_outputs/baseline_tom_tat_crosspair.md · relation: conceptually_related_to
- `Proposed Future Work` → `Recomputed Matcher Cross-pair Evaluation (After)`  [AMBIGUOUS]
  docs/report/code_extracted_report_materials.md · relation: conceptually_related_to
- `David Robe - San Francisco (Senior Full Stack Developer, fit 85/100)` → `David Robe - Paris (Java Spring Full-Stack Developer, demo potential-target 68-74)`  [AMBIGUOUS]
  backend/app/uploads/cv/c8c88219-0b80-46b6-b0b8-59888966a5c8_CV_DEMO_02_POTENTIAL_TARGET_68_74_David_Robe.pdf · relation: semantically_similar_to

## Knowledge Gaps
- **240 isolated node(s):** `$schema`, `builder`, `dockerfilePath`, `healthcheckPath`, `healthcheckTimeout` (+235 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `matcher.py` and `Existing/Legacy CSV Scoring System`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Proposed Future Work` and `Recomputed Matcher Cross-pair Evaluation (After)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `David Robe - San Francisco (Senior Full Stack Developer, fit 85/100)` and `David Robe - Paris (Java Spring Full-Stack Developer, demo potential-target 68-74)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `System Limitations` connect `CV Upload & Applications API` to `Admin Routes`, `Candidate Login & Auth Session`, `Mock CV Screening Data`, `Matcher Core Services`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `Intelligent CV Screening and Recruitment Management (Project)` connect `Database Models` to `Mock CV Screening Data`, `Legacy Candidate/Recruiter Pages`, `CV Upload & Applications API`, `Frontend Dependencies`, `Backend Deployment Config`, `Admin Routes Tests`, `AI Vectorizer Service`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `Report Chapter 1 - Introduction` connect `Database Models` to `CV-JD Matching Route`, `Legacy Candidate/Recruiter Pages`, `Matcher Core Services`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `ActivityLog` (e.g. with `CreateRecruiterRequest` and `UpdateRecruiterRequest`) actually correct?**
  _`ActivityLog` has 10 INFERRED edges - model-reasoned connections that need verification._