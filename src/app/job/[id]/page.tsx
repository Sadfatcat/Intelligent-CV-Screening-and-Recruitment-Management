"use client";
import { useState } from "react";
import BackButton from "@/components/navigation/BackButton";

// Component này sẽ nhận vào tham số url { params } từ Next.js
export default function ApplyCVPage({ params }: { params: { id: string } }) {
    // Extract id from the URL (for example, /job/1 gives id = "1")
    const jobId = params.id; 

    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`You are submitting file ${file?.name} for Job ID: ${jobId}`);
    };

    return (
        <div style={{ padding: "40px", maxWidth: "600px", margin: "auto" }}>
            <BackButton
                fallbackHref="/candidate"
                style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    padding: "9px 14px",
                    marginBottom: 18,
                    background: "#ffffff",
                    color: "#111827",
                    cursor: "pointer",
                    fontWeight: 700,
                }}
            />
            <h1>Submit CV for Application</h1>
            {/* IN RA MÀN HÌNH ĐỂ BẠN KIỂM TRA XEM NÓ CÓ BẮT ĐÚNG ID KHÔNG */}
            <p>You are applying for job ID: <strong>{jobId}</strong></p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <label>
                    Upload CV (PDF, DOC, IMG):
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        accept=".pdf,.doc,.docx,image/*" 
                    />
                </label>
                <button type="submit" style={{ padding: "10px", background: "blue", color: "white" }}>
                    Confirm Submission
                </button>
            </form>
        </div>
    );
}
