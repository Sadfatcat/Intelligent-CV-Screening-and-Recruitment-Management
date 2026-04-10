# 🎯 Hướng Dẫn Link API Frontend & Backend

## 📋 Tổng Quan

**Backend** = Máy chủ Python (FastAPI) chạy trên `http://localhost:8000`
- Nó lưu dữ liệu vào database (PostgreSQL)
- Nó xử lý business logic (login, upload file, matching CV...)
- Nó cung cấp API endpoints để frontend gọi

**Frontend** = Website React (Next.js) chạy trên `http://localhost:3000`
- Nó hiển thị giao diện cho người dùng
- Nó gõi HTTP request tới backend để lấy/gửi dữ liệu
- Nó lưu tạm thời data trong browser (localStorage)

**Cách Link**: Từ React Component trong `src/`, dùng `fetch()` để gọi `http://localhost:8000/api/...`

---

## 🔌 API Endpoints Hiện Có

### 1. **Authentication** (`/api/auth/`)

Đây là API để quản lý đăng nhập/đăng ký user. Được định nghĩa ở `backend/app/routes/auth.py`

**POST /api/auth/register** - Tạo tài khoản mới
```
Frontend gửi:
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "candidate",           // Hoặc "recruiter"
  "admin_secret_key": "..."      // Bắt buộc nếu role="recruiter"
}

Đây là API quản lý tuyển dụng. Defined ở `backend/app/routes/jobs.py`

**GET /api/jobs/** - Lấy danh sách tất cả việc làm
```
Frontend gửi:
(Không cần gửi gì cả, chỉ cần URL)

Backend trả lại:
[
  {
    "id": 1,
    "title": "Python Developer",
    "company_name": "TechCorp",
    "location": "Ho Chi Minh",
    "level": "Senior",
    "deadline": "2026-12-31",
    "description": "We need...",
    "image_url": "..."
  },
  { ...job 2... },
  { ...job 3... }
]
```
→ Tác dụng: Hiển thị danh sách job trên trang chủ để candidate xem

**GET /api/jobs/{job_id}** - Lấy chi tiết 1 job cụ thể
```
Ví dụ: GET /api/jobs/5

Backend trả lại:
{
  "id": 5,
  "title": "Python Developer",
  "company_name": "TechCorp",
  "location": "Ho Chi Minh",
  "level": "Senior",
  "deadline": "2026-12-31",
  "description": "We need an experienced...",
  "jd_file_path": "/app/uploads/jd/uuid_filename.pdf",
  "jd_parsed_text": "...text được chiết xuất từ PDF...",
  "jd_vector": "[0.1, 0.2, 0.3, ...]"  // Vector để matching CV
}
Đây là API quản lý hồ sơ ứng tuyển. Defined ở `backend/app/routes/cvs.py`

**POST /api/cvs/upload-cv** - Candidate nộp CV cho 1 job
```
Frontend gửi (FormData):
{
  "job_id": 5,
  "candidate_name": "Nguyen Van A",
  "candidate_email": "a@example.com",
  "candidate_phone": "+84912345678",
  "candidate_id": 2,  // Optional - null nếu candidate chưa register
  "cv_file": <File Object>  // PDF/DOCX/JPG/PNG từ <input type="file">
}

Backend trả lại:
{
  "message": "Nộp hồ sơ thành công",
  "cv_id": 10,
  "application_id": 15,
  "job_title": "Senior Python Developer",
  "vector_saved": true
}
```
→ Tác dụng: Candidate nộp CV, backend sẽ:
  - Lưu file CV vào /app/uploads/cv/
  - Chiết xuất text từ file (PDF/DOCX dùng pdfplumber & python-docx, ảnh dùng pytesseract)
  - Convert text thành vector 384 chiều
  - Tạo bảng JobApplication để liên kết CV với Job
  - (Sau này dùng vector để so sánh CV với JD, tính matching score)

**GET /api/cvs/job/{job_id}** - Recruiter xem danh sách CV nộp cho 1 job
```
Ví dụ: GET /api/cvs/job/5

Backend trả lại:
[
  {
    "cv_id": 10,
    "candidate_name": "Nguyen Van A",
    "candidate_email": "a@example.com",
    "candidate_phone": "+84912345678",
    "status": "pending",  // Trạng thái: pending, reviewed, accepted, rejected
    "matching_score": 0.85  // Điểm matching (nếu đã tính)
  },
  {
    "cv_id": 11,
    "candidate_name": "Tran Thi B",
    "candidate_email": "b@example.com",
    "candidate_phone": "+84912345679",
    "status": "pending",
    "matching_score": 0.72
  }
]
```
→ Tác dụng: Recruiter xem tất cả CV nộp cho job, sắp xếp theo matching score cao nhấtrecruiter_id": 1,
  "title": "Senior Python Developer",
  "company_name": "TechCorp",
  "location": "Ho Chi Minh",
  "level": "Senior",
  "deadline": "2026-12-31",
  "description": "We are looking for...",
  "jd_file": <File Object>  // File PDF từ <input type="file">
}

Backend trả lại:
{
  "message": "Đăng JD thành công",
  "job_id": 5,
  "vector_saved": true  // Có lưu vector để matching không
}
```
→ Tác dụng: Recruiter upload file JD, backend sẽ:
  - Lưu file PDF vào /app/uploads/jd/
  - Chuyển PDF thành text bằng pdfplumber
  - Convert text thành vector 384 chiều bằng sentence-transformers
  - Lưu tất cả vào database
Frontend gửi:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Backend trả lại:
{
  "message": "Đăng nhập thành công",
  "user_id": 1,
  "role": "candidate"
}
```
→ Tác dụng: Kiểm tra email & password có đúng không. Nếu đúng, trả về user_id để frontend lưu vào localStorage.

### 2. **Jobs** (`/api/jobs/`)

```
GET /api/jobs/
└─ Response: [{ id, title, company_name, location, level, deadline, description, image_url }]

GET /api/jobs/{job_id}
└─ Response: { id, title, ...all job details }

POST /api/jobs/upload-jd
├─ Request: FormData (recruiter_id, title, company_name, location, level, deadline, description, jd_file)
└─ Response: { message, job_id, vector_saved }
```

### 3. **CVs** (`/api/cvs/`)

```
POST /api/cvs/upload-cv
├─ Request: FormData (job_id, candidate_name, candidate_email, candidate_phone, candidate_id?, cv_file)
└─ Response: { message, cv_id, application_id, job_title, vector_saved }

GET /api/cvs/job/{job_id}
└─ Response: [{ cv_id, candidate_name, candidate_email, candidate_phone, status }]
```

---

## 🛠️ Step-by-Step Hướng Dẫn

### **BƯỚC 1: Tạo Configuration File**

**Tất cả code cần gọi API frontend sẽ cần URL base.** Tốt nhất là tập chung vào 1 file để dễ sửa.

**Tạo** `src/utils/apiConfig.ts`:

```typescript
// Lấy base URL từ .env.local
// Nếu không có, dùng "http://localhost:8000"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Định nghĩa tất cả endpoint ở đây để dễ bảo trì
// Nếu backend đổi endpoint, chỉ cần sửa ở 1 chỗ
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  
  // Jobs
  LIST_JOBS: "/api/jobs/",
  GET_JOB: (id: number) => `/api/jobs/${id}`,
  UPLOAD_JD: "/api/jobs/upload-jd",
  
  // CVs
  UPLOAD_CV: "/api/cvs/upload-cv",
  LIST_CVS_FOR_JOB: (id: number) => `/api/cvs/job/${id}`,
};

// Helper function kết hợp base URL + endpoint
// Ví dụ: getFullUrl("/api/auth/login") → "http://localhost:8000/api/auth/login"
export function getFullUrl(endpoint: string) {
  return `${API_BASE_URL}${endpoint}`;
}
```

**Tại sao viết vậy?**
- `process.env.NEXT_PUBLIC_API_URL` = biến environment từ `.env.local` (sẽ giải thích ở bước 2)
- `API_ENDPOINTS` = Object chứa tất cả endpoint, dễ sửa & reuse
- `getFullUrl()` = Function helper, tránh phải gõ `http://localhost:8000` ở mọi nơi

---

### **BƯỚC 2: Tạo .env.local**

**Tạo** `.env.local` trong root project (cùng cấp với `package.json`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Tại sao?**

- **`NEXT_PUBLIC_`** = Prefix bắt buộc trong Next.js để variable có thể truy cập từ browser
  - Nếu không có prefix, variable chỉ dùng được ở server-side (Node.js)
  - Vì frontend (browser) cần gọi API, nên cần `NEXT_PUBLIC_`

- **`NEXT_PUBLIC_API_URL`** = Tên biến, có thể đặt tên gì cũng được (ví dụ `NEXT_PUBLIC_BACKEND_URL`)

- **`http://localhost:8000`** = Địa chỉ backend khi phát triển (development)

**Khi deploy production, sẽ sửa thành:**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**Cách Next.js sử dụng:**
- Khi build project, Next.js sẽ replace `process.env.NEXT_PUBLIC_API_URL` bằng giá trị trong `.env.local`
- Ví dụ nếu `.env.local` có `NEXT_PUBLIC_API_URL=http://localhost:8000`, thì:
  ```typescript
  process.env.NEXT_PUBLIC_API_URL  // Sẽ là "http://localhost:8000"
  ```

---

### **BƯỚC 3: Tạo Fetch Helper (Optional nhưng nên làm)**

**Tạo** `src/utils/api.ts`:

```typescript
// Tạo function helper để gọi API
// Tác dụng: Tập chung xử lý request/response, error handling ở 1 chỗ
export async function callAPI<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  // Lấy base URL từ environment variable
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${baseUrl}${endpoint}`;
  
  try {
    // Fetch = function sẵn có trong browser để gọi HTTP request
    const response = await fetch(url, {
      headers: {
        // "Content-Type: application/json" = báo cho backend biết dữ liệu gửi lên là JSON
        "Content-Type": "application/json",
        // Merge thêm các headers khác nếu có
        ...options?.headers,
      },
      // Spread các options khác (method, body, etc.)
      ...options,
    });

    // Nếu HTTP status không phải 200-299, là lỗi
    if (!response.ok) {
      // Lấy message lỗi từ backend
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    // Parse JSON response từ backend
    return await response.json();
  } catch (error) {
    // Log lỗi vào console để debug
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}
```

**Giải thích từng phần:**

- **`async function`** = Function bất đồng bộ (không chặn UI khi chờ response)
  - `await` = chờ kết quả trước khi tiếp tục

- **`<T>`** = Generic type trong TypeScript
  - Ví dụ: `callAPI<{ user_id: number }>(...)` sẽ return `{ user_id: number }`
  - Nếu không dùng TypeScript, bỏ `<T>` đi không sao

- **`fetch(url, options)`** = Browser API sẵn có để gọi HTTP request
  - `method` = GET/POST/PUT/DELETE (mặc định GET)
  - `body` = dữ liệu gửi lên (JSON string hoặc FormData)
  - `headers` = metadata về request

- **`response.ok`** = boolean, đúng nếu HTTP status 200-299, sai nếu 4xx/5xx

- **`await response.json()`** = parse JSON response thành object JavaScript

---

## 🚀 Cách Sử Dụng Trong Component

### **Ví dụ 1: LOGIN**

```typescript
"use client";
import { useState } from "react";
import { getFullUrl } from "@/utils/apiConfig";

export default function LoginPage() {
  // State để lưu giá trị input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // State để tracking lỗi
  const [error, setError] = useState<string | null>(null);
  // State để disable button khi đang loading
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();  // Prevent reload page
    
    try {
      // Reset lỗi cũ
      setError(null);
      setLoading(true);
      
      // BƯỚC 1: Gọi fetch
      // - URL: "http://localhost:8000/api/auth/login" (getFullUrl() sẽ kết hợp base URL)
      // - METHOD: "POST" (gửi dữ liệu lên, không phải GET)
      const response = await fetch(getFullUrl("/api/auth/login"), {
        method: "POST",
        headers: { 
          // "Content-Type: application/json" = báo backend dữ liệu format là JSON
          "Content-Type": "application/json" 
        },
        // JSON.stringify() = convert object JavaScript thành JSON string
        // Backend sẽ nhận: {"email":"user@example.com", "password":"pass123"}
        body: JSON.stringify({ email, password }),
      });

      // BƯỚC 2: Kiểm tra response status
      // response.ok = true nếu 200-299, false nếu 4xx/5xx
      if (!response.ok) {
        throw new Error("Login failed");
      }

      // BƯỚC 3: Parse JSON response
      // Backend trả: {"message":"...", "user_id":1, "role":"candidate"}
      const data = await response.json();
      
      // BƯỚC 4: Lưu user info vào localStorage
      // localStorage = storage trong browser (persist ngay cả khi close tab)
      // Sau này có thể lấy ra: localStorage.getItem("user_id")
      localStorage.setItem("user_id", String(data.user_id));
      localStorage.setItem("role", data.role);
      
      // BƯỚC 5: Thông báo thành công
      alert("Login successful!");
      // Hoặc redirect: window.location.href = "/dashboard";
    } catch (err) {
      // Nếu có lỗi, hiển thị message
      const errorMsg = err instanceof Error ? err.message : "Login failed";
      setError(errorMsg);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          required
        />
      </div>

      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          required
        />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

**Luồng hoạt động:**
1. User nhập email & password
2. Click "Login" → `handleLogin()` chạy
3. `fetch()` gửi POST request tới backend
4. Backend kiểm tra email/password, trả lại `{user_id, role}` nếu đúng
5. Frontend lưu user_id & role vào localStorage
6. Redirect hoặc refresh trang (dựa vào logic)

---

### **Ví dụ 2: DANH SÁCH JOBS**

```typescript
"use client";
import { useState, useEffect } from "react";

// Định nghĩa type cho Job
// Dùng để TypeScript check nếu ta access property không tồn tại
interface Job {
  id: number;
  title: string;
  company_name: string;
  location: string;
  deadline: string;
}

export default function JobsList() {
  // State để lưu danh sách jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  // State để track loading state
  const [loading, setLoading] = useState(true);
  // State để track error
  const [error, setError] = useState<string | null>(null);

  // useEffect = React hook chạy 1 lần khi component mount
  // [] = dependency array trống = chỉ chạy lần đầu
  useEffect(() => {
    // Hàm fetch data
    async function loadJobs() {
      try {
        // Gọi GET /api/jobs/
        // GET = không cần body, chỉ cần URL
        const response = await fetch("http://localhost:8000/api/jobs/");
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        // Backend trả lại array of jobs
        // [{ id: 1, title: "...", company_name: "...", location: "..." }, ...]
        const data = await response.json();
        setJobs(data);
        setLoading(false);
      } catch (err) {
        // Nếu có lỗi (network error, parse error, etc.)
        const errorMsg = err instanceof Error ? err.message : "Failed to load jobs";
        setError(errorMsg);
        setLoading(false);
      }
    }
    
    loadJobs();
  }, []);

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div>
      <h1>Available Jobs ({jobs.length})</h1>
      
      {jobs.length === 0 ? (
        <p>No jobs found</p>
      ) : (
        jobs.map(job => (
          // Hiển thị mỗi job như 1 card
          <div key={job.id} style={{ border: "1px solid #ddd", padding: "10px", margin: "10px 0" }}>
            <h3>{job.title}</h3>
            <p><strong>Company:</strong> {job.company_name}</p>
            <p><strong>Location:</strong> {job.location}</p>
            <p><strong>Deadline:</strong> {job.deadline}</p>
            <button onClick={() => {
              // Ví dụ: navigate tới job detail
              // hoặc open modal để upload CV
              console.log(`Selected job ${job.id}`);
            }}>
              Apply Now
            </button>
          </div>
        ))
      )}
    </div>
  );
}
```

**Giải thích:**
- **`useEffect` + `[]`** = Chạy 1 lần khi component mount (tương tự componentDidMount)
- **`fetch()` không có method** = Mặc định là GET
- **`response.json()`** = Parse JSON response từ backend thành array of objects
- **`jobs.map()`** = Render mỗi job thành HTML

---

### **Ví dụ 3: UPLOAD CV (FormData)**

```typescript
"use client";
import { useState } from "react";

export default function UploadCV() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState("");
  const [candidateName, setCandidateName] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    // Tạo FormData
    const formData = new FormData();
    formData.append("job_id", jobId);
    formData.append("candidate_name", candidateName);
    formData.append("candidate_email", "test@example.com");
    formData.append("candidate_phone", "0123456789");
    formData.append("cv_file", file);

    try {
      const response = await fetch("http://localhost:8000/api/cvs/upload-cv", {
        method: "POST",
        body: formData,
        // ⚠️ Không set Content-Type header - browser tự set multipart/form-data
      });

      const data = await response.json();
      alert(`Upload successful! CV ID: ${data.cv_id}`);
    } catch (error) {
      alert("Upload failed!");
    }
  }

  return (
    <form onSubmit={handleUpload}>
      <input
        type="number"
        value={jobId}
        onChange={(e) => setJobId(e.target.value)}
        placeholder="Job ID"
      />
      <input
        type="text"
        value={candidateName}
        onChange={(e) => setCandidateName(e.target.value)}
        placeholder="Your Name"
      />
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => setFile(e.files?.[0] || null)}
      />
      <button type="submit">Upload</button>
    </form>
  );
}
```
---

### **Ví dụ 3: UPLOAD CV (FormData)**
---
**⚠️ QUAN TRỌNG:** Khi upload file, không thể dùng JSON. Phải dùng **FormData** để gửi multipart/form-data.

```typescript
"use client";
import { useState } from "react";

export default function UploadCV() {
  // State cho form fields
  const [jobId, setJobId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  
  // State cho file
  const [file, setFile] = useState<File | null>(null);
  
  // State cho UI feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    
    if (!file) {
      setMessage({ type: "error", text: "Please select a file" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      // *** FormData là cách duy nhất để upload file ***
      // FormData = object đặc biệt để gửi dữ liệu multipart/form-data
      // (không phải JSON, không phải query string)
      const formData = new FormData();
      
      // append() = thêm field vào FormData
      formData.append("job_id", jobId);
      formData.append("candidate_name", candidateName);
      formData.append("candidate_email", candidateEmail);
      formData.append("candidate_phone", candidatePhone);
      
      // Thêm file object vào FormData
      // Backend sẽ nhận file qua UploadFile = File(...)
      formData.append("cv_file", file);

      const response = await fetch("http://localhost:8000/api/cvs/upload-cv", {
        method: "POST",
        body: formData,
        
        // ⚠️ QUAN TRỌNG: Không set Content-Type header!!!
        // Nếu set Content-Type: application/json, backend sẽ error (vì FormData không phải JSON)
        // Browser sẽ tự động set "Content-Type: multipart/form-data; boundary=..."
        // (Nếu bạn tự set, boundary sẽ sai và backend không parse được)
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      // Backend response: { message: "...", cv_id: 10, application_id: 15, ... }
      
      setMessage({
        type: "success",
        text: `Upload successful! CV ID: ${data.cv_id}, Application ID: ${data.application_id}`
      });
      
      // Reset form
      setJobId("");
      setCandidateName("");
      setCandidateEmail("");
      setCandidatePhone("");
      setFile(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Upload failed";
      setMessage({ type: "error", text: errorMsg });
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleUpload}>
      <div>
        <label>Job ID:</label>
        <input
          type="number"
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          placeholder="Enter job ID"
          required
        />
      </div>

      <div>
        <label>Your Name:</label>
        <input
          type="text"
          value={candidateName}
          onChange={(e) => setCandidateName(e.target.value)}
          placeholder="Your full name"
          required
        />
      </div>

      <div>
        <label>Your Email:</label>
        <input
          type="email"
          value={candidateEmail}
          onChange={(e) => setCandidateEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
      </div>

      <div>
        <label>Your Phone:</label>
        <input
          type="tel"
          value={candidatePhone}
          onChange={(e) => setCandidatePhone(e.target.value)}
          placeholder="+84912345678"
          required
        />
      </div>

      <div>
        <label>CV File (PDF, DOCX, JPG, PNG):</label>
        <input
          type="file"
          // accept = chỉ cho chọn file với extension nào
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          onChange={(e) => {
            // e.files = FileList (array-like object)
            // [0] = file được chọn (nếu chọn nhiều file, [0] là file đầu tiên)
            // || null = nếu không chọn file nào, set null
            setFile(e.files?.[0] || null);
          }}
          required
        />
        {file && <p>Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>}
      </div>

      {message && (
        <p style={{ color: message.type === "success" ? "green" : "red" }}>
          {message.text}
        </p>
      )}

      <button type="submit" disabled={loading || !file}>
        {loading ? "Uploading..." : "Upload CV"}
      </button>
    </form>
  );
}
```

**Luồng hoạt động:**
1. User điền form + chọn file
2. Click "Upload" → `handleUpload()` chạy
3. Tạo FormData với tất cả fields + file
4. `fetch()` gửi POST request (multipart/form-data)
5. Backend nhận FormData, lưu file, extract text, convert thành vector
6. Backend trả lại `{cv_id, application_id, ...}`
7. Frontend hiển thị success message

**Tại sao dùng FormData?**
- JSON không thể chứa file object
- FormData có thể chứa: string, number, File object
- Format multipart/form-data = cách standard để upload file qua HTTP
## ⚠️ Các Lưu Ý Quan Trọng

### 1. **FormData cho File Upload**
```typescript
// ✅ Đúng - dùng FormData cho upload file
const formData = new FormData();
formData.append("file", fileInput.files[0]);

fetch("http://localhost:8000/api/cvs/upload-cv", {
  method: "POST",
  body: formData,  // Không set Content-Type header
});

// ❌ Sai - JSON.stringify cho file
body: JSON.stringify({ file: fileInput.files[0] })
```

### 2. **JSON Request**
```typescript
// ✅ Đúng
fetch("http://localhost:8000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

### 3. **Lưu User Info**
```typescript
// Sau login, lưu user_id và role
localStorage.setItem("user_id", String(data.user_id));
localStorage.setItem("role", data.role);

// Lấy sau này
const userId = localStorage.getItem("user_id");
const role = localStorage.getItem("role");

// Logout - xóa localStorage
localStorage.removeItem("user_id");
localStorage.removeItem("role");
```

### 4. **Environment Variable trong Production**
```
# .env.local (Dev)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 🔍 Debug & Testing

### **Test Backend Đang Chạy**
```bash
curl http://localhost:8000/health
# Response: {"status":"ok"}
```

### **Xem Swagger UI**
```
http://localhost:8000/docs
# Có thể test tất cả API endpoints ở đây
```

### **Trong Browser Console**
```javascript
// Test fetch
fetch("http://localhost:8000/api/jobs/")
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));

// Check localStorage
console.log(localStorage.getItem("user_id"));
```

---

## 📊 Sơ Đồ Request-Response

```
## 🔍 Debug & Testing
┌─── Frontend Component ───┐
### **1. Kiểm Tra Backend Đang Chạy**
│  - Form input            │
**Dùng Terminal:**
```bash
# Health check = ping backend để xem có sống không
curl http://localhost:8000/health

# Response nếu OK: {"status":"ok"}
# Nếu lỗi: Cannot connect to localhost:8000
# → Backend chưa chạy, hãy: docker-compose up hoặc uvicorn app.main:app --reload
```
│  - Button click          │
**Dùng Browser:**
```
# Mở tab browser -> address bar
http://localhost:8000/health
## ⚠️ Các Lưu Ý Quan Trọng
# Hoặc kiểm tra root endpoint
http://localhost:8000/
# Response: {"message":"backend đang chạy"}
```
           │ Fetch Call
---
### 1. **FormData vs JSON - Khi nào dùng cái nào?**
### **2. Test API Endpoints - Sử Dụng Swagger UI**
           │ POST /api/auth/login
**Swagger UI là giao diện tương tác để test API**
**FormData (dùng cho file upload):**
```
Mở: http://localhost:8000/docs

Bạn sẽ thấy:
- Danh sách tất cả endpoints (/api/auth/login, /api/jobs/, etc.)
- Có thể click "Try it out" để test
- Input request body
- Xem response từ backend
```
```typescript
**Ví dụ: Test login API**
1. Mở http://localhost:8000/docs
2. Tìm "/api/auth/login" section
3. Click "Try it out"
4. Nhập request body:
   ```json
   {
     "email": "test@example.com",
     "password": "testpass123"
   }
   ```
5. Click "Execute"
6. Xem response (nếu có lỗi, backend sẽ báo)
// ✅ Đúng khi upload file
---
const formData = new FormData();
### **3. Test Fetch từ Browser Console**
formData.append("candidate_name", "Nguyen Van A");
**Browser Console = nơi debug JavaScript**
formData.append("cv_file", fileInput.files[0]);  // File object
```javascript
// Mở: F12 hoặc Ctrl+Shift+I -> Console tab
           ▼
// TEST 1: Gọi API Get jobs
fetch("http://localhost:8000/api/jobs/")
  .then(r => r.json())  // Parse response thành object
  .then(d => console.log(d))  // In data ra console
  .catch(e => console.error(e));  // In lỗi nếu có

// Xem console output:
// (0) [{…}, {…}, {…}]  = array of 3 jobs
// Nếu có lỗi: 
// - "Failed to fetch" = backend offline
// - CORS error = backend không cho FE call
// - "401 Unauthorized" = authentication error
```
fetch("http://localhost:8000/api/cvs/upload-cv", {
```javascript
// TEST 2: Login
fetch("http://localhost:8000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "test@example.com",
    password: "testpass123"
  })
})
  .then(r => r.json())
  .then(d => {
    console.log(d);  // In response
    console.log("User ID:", d.user_id);  // Lấy specific field
    console.log("Role:", d.role);
  })
  .catch(e => console.error(e));
```
  method: "POST",
```javascript
// TEST 3: Check localStorage
console.log(localStorage.getItem("user_id"));
// Output: "1" (string, hoặc null nếu chưa login)
  body: formData,
console.log(localStorage.getItem("role"));
// Output: "candidate"
  // Không set Content-Type - browser tự set multipart/form-data
// Xem tất cả localStorage
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`${key}: ${value}`);
}
```
});
---
┌─── Backend (FastAPI) ───┐
### **4. Common Debug Patterns**
// ❌ Sai - JSON.stringify không thể chứa File object
**Pattern 1: Kiểm tra request được gửi hay chưa**
```javascript
const url = "http://localhost:8000/api/jobs/";
console.log("Fetching:", url);  // Print trước gọi API
body: JSON.stringify({ cv_file: fileInput.files[0] })
fetch(url)
  .then(r => {
    console.log("Status:", r.status);  // 200, 404, 500, etc.
    console.log("Headers:", r.headers);
    return r.json();
  })
  .then(d => console.log("Data:", d))
  .catch(e => console.error("Error:", e));
```
// Error: File object không convert được thành JSON string
**Pattern 2: Inspect full response object**
```javascript
fetch("http://localhost:8000/api/jobs/")
  .then(r => {
    console.log("Full response:", r);  // In toàn bộ response object
    // response.status, response.ok, response.headers, etc.
    return r.json();
  })
  .then(d => console.log("Parsed data:", d))
  .catch(e => console.error(e));
```
```
**Pattern 3: Network tab xem request details**
```
F12 -> Network tab -> Refresh page
│  - Validate data        │
Bạn sẽ thấy:
- Tất cả HTTP requests (JS files, API calls, images, etc.)
- Click vào API request để xem:
  - Request headers
  - Request body
  - Response headers
  - Response body
  - Timing (bao lâu)
```
**Tại sao?**
---
- JSON = text format, chỉ chứa: string, number, boolean, object, array, null
### **5. Common Errors & Solutions**
- File object = binary data (ảnh, PDF, etc.), không thể chứa trong JSON
| Error | Nguyên Nhân | Giải Pháp |
|-------|-----------|---------|
| "Failed to fetch" | Backend offline | Chạy `docker-compose up` |
| "CORS policy: No Access-Control-Allow-Origin header" | Backend chưa set CORS | Kiểm tra CORSMiddleware ở main.py |
| "404 Not Found" | Endpoint sai | Kiểm tra endpoint ở Swagger UI |
| "400 Bad Request" | Data gửi lên sai format | Kiểm tra request body |
| "401 Unauthorized" | Thiếu auth token | Cần backend hỗ trợ auth (nếu có) |
| "422 Unprocessable Entity" | Validation error | Check response.detail để xem lỗi gì |
| API response là HTML thay vì JSON | Endpoint sai, backend trả error page | Kiểm tra URL & method |
- FormData = dùng multipart/form-data format, có thể chứa binary
---
│  - Query database       │
**JSON (dùng cho login, submit form không có file):**
```typescript
// ✅ Đúng khi gửi data thường (không có file)
fetch("http://localhost:8000/api/auth/login", {
  method: "POST",
  headers: { 
    "Content-Type: application/json"
    // Báo backend: "Dữ liệu được gửi dưới dạng JSON string"
  },
  body: JSON.stringify({ 
    email: "user@example.com",
    password: "pass123"
    // JSON.stringify() = convert object thành JSON string
    // Result: "{\"email\":\"user@example.com\",\"password\":\"pass123\"}"
  }),
});
```
│  - Return response      │
---
└──────────┬───────────────┘
### 2. **localStorage - Lưu dữ liệu vĩnh viễn trong browser**
           │ JSON Response
**Tác dụng:**
- Lưu dữ liệu vào browser local storage (vĩnh viễn, ngay cả khi close tab)
- Dùng để nhớ user info, preferences, etc.
           │ { user_id, role }
**Cách dùng:**
           ▼
```typescript
// LƯỚI: Sau khi login thành công
const response = await loginUser({ email, password });
// Response: { message: "...", user_id: 1, role: "candidate" }
┌─── Frontend Component ───┐
localStorage.setItem("user_id", String(response.user_id));
// setItem(key, value) = lưu key-value vào localStorage
// String() = convert number thành string (localStorage chỉ lưu string)
│  - Parse response       │
localStorage.setItem("role", response.role);
│  - Save localStorage    │
// LẤYTLẠI: Kiểm tra user đã login chưa
const userId = localStorage.getItem("user_id");
// getItem(key) = lấy giá trị từ localStorage
// return null nếu key không tồn tại
│  - Update UI / Redirect │
if (userId) {
  // User đã login
} else {
  // Chưa login, redirect tới login page
}
└──────────────────────────┘
// XÓA: Khi logout
localStorage.removeItem("user_id");
localStorage.removeItem("role");
// Hoặc xóa tất cả: localStorage.clear();
```
```
**Lưu ý:**
- localStorage chỉ lưu **string**, không lưu được object/array trực tiếp
- Nếu cần lưu object: `localStorage.setItem("user", JSON.stringify(userData))`
- Lấy ra: `const user = JSON.parse(localStorage.getItem("user"))`

---
---
### 3. **Headers - Metadata của HTTP Request**

**Là gì?**
Headers = thông tin metadata kèm theo request, báo cho backend biết request này là gì
## ✅ Checklist Khi Link API
**Common headers:**
```typescript
{
  "Content-Type": "application/json",
  // Báo: "Dữ liệu gửi lên là JSON"
  // Backend sẽ parse body dưới dạng JSON
  
  "Authorization": "Bearer token123",
  // Dùng khi có JWT/Auth token
  // Backend sẽ check token trong header
  
  "Accept": "application/json",
  // Báo: "Tôi muốn response dưới dạng JSON"
}

- [ ] Backend chạy trên port 8000
**Khi nào không set Content-Type?**
```typescript
// FormData upload file
const formData = new FormData();
formData.append("file", file);
- [ ] Frontend chạy trên port 3000
fetch("/api/upload", {
  method: "POST",
  body: formData,
  // Không set Content-Type!!!
  // Browser tự động set: "Content-Type: multipart/form-data; boundary=..."
  // Nếu bạn set Content-Type: "application/json", boundary sẽ sai
});
```
- [ ] `.env.local` có `NEXT_PUBLIC_API_URL=http://localhost:8000`
---
- [ ] Fetch URL đúng: `http://localhost:8000/api/...`
### 4. **Environment Variable (.env.local)**
- [ ] Method đúng: GET/POST/PUT/DELETE
**Tại sao cần?**
- Backend URL khác nhau ở dev vs production
- Dev: `http://localhost:8000`
- Production: `https://api.yourdomain.com`
- Thay vì hardcode, dùng env variable
- [ ] Headers đúng: JSON request set `Content-Type: application/json`
**Cách dùng:**
- [ ] File upload dùng FormData, không set Content-Type
**Step 1: Tạo `.env.local`** (trong root project)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
- [ ] Error handling có try-catch
**Step 2: Sử dụng trong code**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_API_URL;
// process.env = object chứa tất cả environment variables
// Next.js sẽ thay thế bằng giá trị từ .env.local khi build
```
- [ ] Response parsing: `await response.json()`
**Step 3: Khi deploy production**
```
# Vercel, Netlify, hoặc hosting khác
# Set environment variable: NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```
- [ ] localStorage để lưu user info
**Lưu ý:**
- Prefix `NEXT_PUBLIC_` = Next.js yêu cầu để variable có thể access từ browser
- Không có prefix = chỉ access được từ server-side (Node.js)
- Không để hardcode URL trong code!

---
---

## 🆘 Troubleshooting

| Lỗi | Nguyên Nhân | Cách Fix |
|-----|-----------|---------|
| CORS Error | Backend không cho FE gọi | Kiểm tra CORSMiddleware trong `main.py` |
| 404 Not Found | Endpoint sai | Kiểm tra trong Swagger UI |
| Network Error | Backend offline | Chạy `docker-compose up` hoặc `uvicorn` |
| File upload 400 | Lỗi FormData hoặc file format | Kiểm tra file extension |
| localStorage undefined | Chạy ở server-side | Sử dụng `useEffect` với `"use client"` |

---

## 📝 Template Nhanh

**React Component cơ bản:**
```typescript
"use client";
import { useState } from "react";

export default function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/endpoint");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={fetchData}>Load</button>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

---

**Đó là hướng dẫn chi tiết! Bạn có thể bắt đầu link API ngay bây giờ.** 🚀
