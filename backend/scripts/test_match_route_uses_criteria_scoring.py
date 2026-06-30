import os
import sys
import json
from fastapi.testclient import TestClient

# Add backend directory to sys.path to enable imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

def run_test():
    client = TestClient(app)
    
    # Exact GEO Senior Java/Spring JD text
    jd_text = """
Senior Full Stack Developer | Java/Spring
CÔNG TY TNHH GEO SYSTEM SOLUTIONS VIỆT NAM
Mô tả công việc
Mô tả dự án: System Replace
GEO Holdings Corp. là tập đoàn đa quốc gia trong lĩnh vực bán lẻ, đặc biệt là ngành hàng reuse, với mục tiêu dài
hạn là mở rộng số lượng cửa hàng 2nd Street ra toàn thế giới.
Tập đoàn hiện đầu tư mạnh vào dự án System Replace, tập trung tái cấu trúc toàn diện và phát triển mới hệ thống
Core IT lõi nhằm chuẩn hóa công nghệ, tối ưu vận hành và xóa bỏ sự chồng chéo nghiệp vụ hiện tại cho chuỗi hệ
thống kinh doanh đa quốc gia.
Lộ trình phát triển: Dự án dài hạn chia làm nhiều giai đoạn. Ở giai đoạn đầu, đội ngũ Việt Nam phối hợp chặt chẽ
với đội ngũ Nhật Bản để làm móng và triển khai toàn diện hệ thống cho mảng kinh doanh chiến lược tại thị trường
quốc tế trước khi mở rộng ra toàn tập đoàn.
Thách thức công nghệ: Ứng dụng các tiêu chuẩn thiết kế kiến trúc hệ thống tiên tiến trên nền tảng Java/Spring
Framework, giải quyết bài toán tối ưu UX/UI, xử lý dữ liệu lớn và đảm bảo tính mở rộng cao cho tốc độ tăng trưởng
của chuỗi cửa hàng tại Mỹ, Hong Kong, Taiwan, Đông Nam Á và Nhật Bản.
Nội dung công việc
• Thiết kế hệ thống, chức năng và giao diện dựa trên yêu cầu nghiệp vụ và mockup từ đội ngũ Nhật Bản.
• Phát triển phần mềm, đảm bảo chất lượng code và tuân thủ các tiêu chuẩn kỹ thuật.
• Thiết kế kịch bản kiểm thử và thực hiện kiểm thử hệ thống.
• Phối hợp với thành viên trong nhóm và đội ngũ Nhật Bản để đảm bảo sản phẩm đáp ứng đúng yêu cầu và tiến độ.
Yêu cầu ứng viên
• Có trên 5 năm kinh nghiệm trong lĩnh vực phát triển phần mềm.
• Có khả năng tạo tài liệu thiết kế bằng tiếng Anh.
• Thành thạo HTML, CSS, JavaScript.
• Có kiến thức chuyên sâu và kinh nghiệm thực tế với Java/Spring Framework.
Ưu tiên
• Có kiến thức hoặc kinh nghiệm trong lĩnh vực bán lẻ, hệ thống POS hoặc ngành tái sử dụng.

Senior Full Stack Developer | Java/Spring
CÔNG TY TNHH GEO SYSTEM SOLUTIONS VIỆT NAM
Quyền lợi
• Đóng đầy đủ các loại bảo hiểm theo quy định của Luật lao động Việt Nam.
• Phụ cấp theo trình độ chuyên môn kỹ thuật dành cho nhân viên đạt Chuẩn Kỹ sư công nghệ thông tin Nhật Bản:
AP 2,000,000 VND/tháng, FE 1,000,000 VND/tháng.
• Chứng chỉ công nghệ của các tập đoàn như AWS: Associate 1,000,000 VND/tháng, Professional 2,000,000
VND/tháng, Specialty 2,000,000 VND/tháng.
• Phụ cấp đi lại 600,000 VND/tháng; phụ cấp cơm trưa 470,000 VND/tháng.
• Hỗ trợ học phí mẫu giáo cho nhân viên có con nhỏ: tối đa 4,500,000 VND/tháng/bé.
• Học phí trường tiếng Nhật: tối đa 4,500,000 VND/tháng.
• Phụ cấp theo trình độ tiếng Nhật đối với nhân viên có bằng năng lực Nhật ngữ N1-N3.
• Khám sức khỏe 1 lần/năm, du lịch công ty 1 lần/năm, tiền chúc mừng kết hôn/sinh con và các phúc lợi khác.
Địa điểm làm việc
Hồ Chí Minh: Tòa nhà Alpha, 151-153 Nguyễn Đình Chiểu, Phường Xuân Hòa (Quận 3 cũ).
Thời gian làm việc
Thứ 2 - Thứ 6, từ 08:00 đến 17:00.
Từ khóa đánh giá CV
Java, Spring Framework, Spring Boot, Full Stack, HTML, CSS, JavaScript, UI/UX, system design, English design
documents, testing, large data processing, retail, POS, reuse business, Japan collaboration.
"""

    # Exact Lê Minh Khoa CV text
    le_minh_khoa_cv = """
CV page 1/2
Lê Minh Khoa
Senior Java Fullstack Developer
Personal Information
Phone: (+84) 909 882 771
Email: khoa.le.systemreplace@email.com
LinkedIn: linkedin.com/in/le-minh-khoa
GitHub: github.com/le-minh-khoa
Location: District 3, Ho Chi Minh City, Vietnam
Fit score: 98/100
Career Goals
Senior Java Fullstack Developer aiming to lead
System Replace-style core modernization:
scalable Java/Spring architecture, high-quality
UX/UI, English design documents, and close
collaboration with Japanese stakeholders.
Education
2010-2014 B.Sc. Software Engineering, FPT
University, Ho Chi Minh City.
Certificates
2025 AWS Solutions Architect Professional
2023 AP - Japan IT Engineer Exam
2021 Oracle Java SE 11
2020 JLPT N3
2019 TOEIC 900
Soft Skills
Technical leadership and mentoring
Business requirement analysis
English design documentation
Japan/Vietnam collaboration
Hobby
Badminton, reading Japanese retail case studies,
contributing to internal engineering guidelines.
Experience Summary
Senior Java Fullstack Developer with 11 years of experience delivering core
enterprise, retail, inventory, POS integration, and modernization systems.
Completed 35+ projects; selected below are the strongest projects for the GEO
System Replace JD. Excellent fit for Java/Spring, HTML/CSS/JavaScript, English
design documents, testing, UX/UI optimization, large data processing, and
collaboration with Japanese teams.
Selected Projects
1. Global Retail Core Replacement Program
Company project | Senior Fullstack Developer / Module Lead
A core modernization program replacing legacy product, price, inventory, and
store-operation modules for a multi-country retail business.
• Designed Spring Boot service architecture for item master, store stock, price
rules, and operation approval modules.
• Created English basic design, detailed design, API, and test design documents
from Japanese mockups and business requirements.
• Optimized large inventory queries through indexing, pagination, read models,
and Redis caching.
2. Reuse Item Intake and Valuation System
Company project | Fullstack Technical Lead
System for second-hand item intake, condition grading, price suggestion, and
store workflow tracking.
• Modeled reuse-specific workflows including item condition, buyback status,
inspection photos, and selling readiness.
• Built Java/Spring APIs and TypeScript screens for store staff with focus on UX
speed and low-error data entry.
• Collaborated with Japanese product owners to refine edge cases and
acceptance criteria.
3. POS Transaction Integration Platform
Company project | Backend-focused Fullstack Developer
Integration platform connecting POS sales, returns, stock adjustment, and
finance posting.
• Implemented idempotent REST/batch interfaces with Spring Boot, PostgreSQL,
Kafka, and audit logs.
• Handled retry, reconciliation, duplicate detection, and cross-store transaction
correction flows.
• Designed system test scenarios for sales, returns, discounts, and inventory
synchronization.

CV page 2/2
Lê Minh Khoa
Senior Java Fullstack Developer
Profile Snapshot
11 years of fullstack engineering. Strong
retail/POS/reuse-adjacent domain, Java/Spring
architecture, large-data handling, UX/UI
optimization, testing, and Japan collaboration.
Core Strengths
Java/Spring core systems
Retail/POS/inventory domain
English/Japan collaboration
Scalable data processing
Links
LinkedIn: linkedin.com/in/le-minh-khoa
GitHub: github.com/le-minh-khoa
Selected Projects and Skills
4. Multi-country Store Operations Portal
Company project | Senior Fullstack Developer
Portal for store tasks, staff role control, shift reports, and exception handling
across regions.
• Built responsive UI with HTML/CSS/JavaScript, TypeScript, and reusable
enterprise components.
• Implemented role-based access control, approval workflows, and audit trail
APIs.
• Improved UX by reducing steps for common store operations and adding clear
validation messages.
5. Large-scale Product Master Data Migration
Company project | Technical Lead
Migration of legacy product, category, supplier, and price records into a
standardized core data model.
• Created Java validation tools, batch import jobs, and exception dashboards.
• Processed millions of records with chunking, profiling, and rollback strategy.
• Prepared migration runbooks and English status reports for management
review.
6. System Quality and Test Automation Framework
Company internal project | Lead Engineer
Reusable test and quality framework for Java/Spring services and web UI
regression.
• Defined test design templates, JUnit/Mockito standards, and API testing
conventions.
• Integrated contract tests, SonarQube quality gates, and CI reports.
• Mentored engineers on defect analysis, code review, and maintainable
architecture.
Skills
Backend Development
• Java, Spring Boot, Spring Security, JPA/Hibernate, RESTful APIs, OAuth2/JWT,
Kafka, Redis, batch processing.
Frontend Development
• HTML, CSS, JavaScript, TypeScript, React, WebSquare-style enterprise UI,
responsive web/mobile UI.
Databases
• PostgreSQL, MySQL, Oracle, SQL optimization, indexing, transaction
handling, schema design, query profiling.
DevOps and Collaboration
• Git, Jira, Confluence, Docker, Kubernetes, Jenkins, GitHub Actions, Linux,
AWS, release management.
Quality Engineering
• JUnit, Mockito, integration testing, system test design, API testing,
SonarQube, code review, performance tuning.
Languages
Vietnamese native; English professional; Japanese JLPT N3, able to join
requirement clarification meetings with Japanese stakeholders.
"""

    # Exact Trần Minh Đức CV text
    tran_minh_duc_cv = """
CV page 1/2
Trần Minh Đức
Fullstack Web Developer
Personal Information
Phone: (+84) 988 224 390
Email: duc.tran.dev@email.com
LinkedIn: linkedin.com/in/tran-minh-duc
GitHub: github.com/tran-minh-duc
Location: Da Nang, Vietnam
Fit score: 40/100
Career Goals
Fullstack developer aiming to shift from
PHP/Node.js systems to Java/Spring enterprise
products. Interested in clean coding, testing, and
business system modernization.
Education
2013-2017 B.Sc. Computer Science, University of
Science and Education, Da Nang.
Certificates
2023 Scrum Fundamentals
2021 TOEIC 700
2020 Laravel Certification
Soft Skills
Requirement clarification
Ownership
Production support
Hobby
Coffee brewing, chess, tech meetups.
Experience Summary
Fullstack developer with 6 years of experience in business web systems.
Stronger in PHP, Node.js, HTML/CSS/JavaScript and SQL than Java/Spring. The
candidate can contribute to UI and API work, but would need ramp-up for
senior Java/Spring architecture and Japan-facing design documents.
Selected Projects
1. SME ERP Web System
Company project | Fullstack Developer
A web ERP for sales order, purchase request, inventory, and accounting
export.
• Built modules with Laravel, Vue.js, MySQL, and REST APIs.
• Implemented approval flows, role permissions, and report screens.
• Supported bug fixing and user acceptance testing.
2. Logistics Tracking Portal
Company project | Backend-focused Developer
Shipment tracking and delivery status portal for operations staff.
• Developed Node.js APIs and PostgreSQL queries.
• Integrated carrier webhook events and email notifications.
• Improved query performance with indexing and pagination.
3. Basic Spring Boot Training App
Internal learning project | Developer
Small training app for user management and product CRUD.
• Implemented Spring Boot controllers, services, and repositories.
• Practiced JPA, validation, and simple unit tests.
• Not yet used in a large production Java system.

CV page 2/2
Trần Minh Đức
Fullstack Web Developer
Profile Snapshot
6 years building business web systems, mostly
with PHP and Node.js. Has useful web and SQL
background but only moderate Java/Spring
depth.
Core Strengths
Business web apps
SQL and API integration
Basic Spring Boot
Team collaboration
Links
LinkedIn: linkedin.com/in/tran-minh-duc
GitHub: github.com/tran-minh-duc
Selected Projects and Skills
4. Retail Promotion Tool
Company project | Fullstack Developer
Promotion setup tool for a small retail chain.
• Built discount rule UI and CSV import features.
• Worked with business users to refine validation rules.
• No direct POS integration, but familiar with retail terms.
5. Customer Feedback Dashboard
Company project | Frontend Developer
Dashboard for satisfaction surveys and complaint categories.
• Created charts and filterable tables with Vue.js.
• Wrote test cases for common UI scenarios.
• Prepared user guide in Vietnamese.
6. Internal API Gateway Maintenance
Company project | Support Developer
Maintenance of existing gateway configuration and logs.
• Monitored API errors and fixed routing configuration.
• Collaborated with senior engineers on incident analysis.
• Documented troubleshooting steps.
Skills
Backend Development
• PHP/Laravel, Node.js, Express, basic Java/Spring Boot, REST APIs.
Frontend Development
• HTML, CSS, JavaScript, Vue.js, Bootstrap, responsive UI.
Databases
• MySQL, PostgreSQL, SQL tuning basics, schema maintenance.
DevOps and Collaboration
• Git, Jira, Docker basics, Nginx, Linux.
Quality Engineering
• Manual testing, basic PHPUnit/Jest, API smoke tests.
Languages
Vietnamese native; English intermediate reading/writing.
"""

    # Unrelated weak CV
    weak_cv = """
    John Doe - Graphic Designer & WordPress Admin
    Summary: 2 years of experience building simple WordPress landing pages and designing logos.
    Skills: HTML, CSS, Figma, WordPress, Adobe Photoshop.
    Experience: Freelance UI Designer. No backend, no Java, no Spring.
    """

    print("Sending Request for Le Minh Khoa CV...")
    khoa_response = client.post(
        "/match/cv_vs_jd_text",
        data={"cv_text": le_minh_khoa_cv, "jd_text": jd_text, "alpha": 0.7}
    )
    assert khoa_response.status_code == 200, f"Khoa CV request failed with status: {khoa_response.status_code}, detail: {khoa_response.text}"
    khoa_data = khoa_response.json()

    print("Sending Request for Tran Minh Duc CV...")
    duc_response = client.post(
        "/match/cv_vs_jd_text",
        data={"cv_text": tran_minh_duc_cv, "jd_text": jd_text, "alpha": 0.7}
    )
    assert duc_response.status_code == 200, f"Duc CV request failed with status: {duc_response.status_code}, detail: {duc_response.text}"
    duc_data = duc_response.json()

    print("Sending Request for Weak CV...")
    weak_response = client.post(
        "/match/cv_vs_jd_text",
        data={"cv_text": weak_cv, "jd_text": jd_text, "alpha": 0.7}
    )
    assert weak_response.status_code == 200, f"Weak CV request failed with status: {weak_response.status_code}, detail: {weak_response.text}"
    weak_data = weak_response.json()

    # Assert response fields for all cases
    required_fields = [
        "finalScore",
        "final_score",
        "overall_score",
        "subScores",
        "section_scores",
        "matched",
        "missingOrWeak",
        "reasoningSummary",
        "scoringEngine"
    ]
    for field in required_fields:
        assert field in khoa_data, f"Field '{field}' missing from Khoa CV response"
        assert field in duc_data, f"Field '{field}' missing from Duc CV response"
        assert field in weak_data, f"Field '{field}' missing from Weak CV response"

    # Assert scores
    khoa_score = khoa_data["finalScore"]
    duc_score = duc_data["finalScore"]
    weak_score = weak_data["finalScore"]

    print(f"Le Minh Khoa Score: {khoa_score}")
    print(f"Tran Minh Duc Score: {duc_score}")
    print(f"Weak CV Score: {weak_score}")

    assert khoa_score >= 85.0, f"Expected Le Minh Khoa score >= 85, got {khoa_score}"
    assert duc_score < 60.0, f"Expected Tran Minh Duc score < 60, got {duc_score}"
    assert weak_score < 50.0, f"Expected Weak CV score to be low, got {weak_score}"

    # Assert subScores
    sub_scores = khoa_data["subScores"]
    testing_doc = sub_scores.get("testing_documentation", 0)
    proj_domain = sub_scores.get("project_domain", 0)
    lang_collab = sub_scores.get("language_collaboration", 0)

    print(f"Subscores for Khoa - testing_documentation: {testing_doc}, project_domain: {proj_domain}, language_collaboration: {lang_collab}")
    assert testing_doc >= 80.0, f"Expected testing_documentation >= 80, got {testing_doc}"
    assert proj_domain >= 85.0, f"Expected project_domain >= 85, got {proj_domain}"
    assert lang_collab >= 80.0, f"Expected language_collaboration >= 80, got {lang_collab}"

    # Assert reasoningSummary does NOT mention missing testing or documentation
    reasoning = khoa_data["reasoningSummary"].lower()
    assert "missing testing" not in reasoning, "Reasoning mentions missing testing"
    assert "missing documentation" not in reasoning, "Reasoning mentions missing documentation"

    print("\nAPI-level match route criteria scoring test passed successfully!")

if __name__ == "__main__":
    run_test()
