import styles from "../../../app/recruiter_UI/page.module.css";
import { RecruiterToast } from "./RecruiterToast";

type RecruiterLoginProps = {
    email: string;
    password: string;
    message: string;
    messageType: "success" | "error" | "";
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

// Recruiter Login: form đăng nhập recruiter.
export function RecruiterLogin({
    email,
    password,
    message,
    messageType,
    onEmailChange,
    onPasswordChange,
    onSubmit,
}: RecruiterLoginProps) {
    return (
        <div className={`${styles.page} ${styles.loginPage}`}>
            <div className={`${styles.card} ${styles.loginWrap}`}>
                <div className={styles.loginHeader}>
                    <p className={styles.loginEyebrow}>Recruiter Workspace</p>
                    <h1 className={styles.title}>Recruiter Login</h1>
                    <p className={styles.subtleText}>Sign in to upload JD, create job cards, and track candidate submissions.</p>
                </div>
                <form className={styles.loginForm} onSubmit={onSubmit}>
                    <input
                        type="email"
                        placeholder="Recruiter email"
                        value={email}
                        onChange={(event) => onEmailChange(event.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(event) => onPasswordChange(event.target.value)}
                        required
                    />
                    <button className={styles.button} type="submit">Login</button>
                </form>
            </div>
            <RecruiterToast message={message} type={messageType} />
        </div>
    );
}
