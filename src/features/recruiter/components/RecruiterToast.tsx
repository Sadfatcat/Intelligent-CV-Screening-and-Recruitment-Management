import styles from "../../../app/recruiter_UI/page.module.css";

type RecruiterToastProps = {
    message: string;
    type: "success" | "error" | "";
};

// Toast: hiển thị thông báo ngắn cho thao tác recruiter.
export function RecruiterToast({ message, type }: RecruiterToastProps) {
    if (!message) return null;

    return (
        <div className={`${styles.toast} ${type === "success" ? styles.toastSuccess : styles.toastError}`} role="status">
            <strong>{type === "success" ? "Success" : "Error"}</strong>
            <span>{message}</span>
        </div>
    );
}
