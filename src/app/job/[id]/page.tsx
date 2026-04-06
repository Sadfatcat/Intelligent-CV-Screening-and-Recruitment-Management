"use client";
import { useState } from "react";

// Component này sẽ nhận vào tham số url { params } từ Next.js
export default function ApplyCVPage({ params }: { params: { id: string } }) {
    // Rút xuất id từ url (ví dụ: url là /job/1 => id sẽ bằng "1")
    const jobId = params.id; 

    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Bạn đang nộp file ${file?.name} cho Job có ID là: ${jobId}`);
    };

    return (
        <div style={{ padding: "40px", maxWidth: "600px", margin: "auto" }}>
            <h1>Nộp CV ứng tuyển</h1>
            {/* IN RA MÀN HÌNH ĐỂ BẠN KIỂM TRA XEM NÓ CÓ BẮT ĐÚNG ID KHÔNG */}
            <p>Bạn đang nộp hồ sơ cho công việc ID: <strong>{jobId}</strong></p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <label>
                    Tải CV (PDF, DOC, IMG):
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        accept=".pdf,.doc,.docx,image/*" 
                    />
                </label>
                <button type="submit" style={{ padding: "10px", background: "blue", color: "white" }}>
                    Xác nhận nộp
                </button>
            </form>
        </div>
    );
}