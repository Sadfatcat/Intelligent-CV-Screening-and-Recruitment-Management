export interface RegisterStage {
    email: string;
    password: string;
    confirmPassword: string;
    emailError: string;
    passwordError: string;
    resultMessage: string;
    resultType: "success" | "error" | "";
}

export interface SetterType {
    setEmail: (value: string) => void;
    setPassword: (value: string) => void;
    setConfirmPassword: (value: string) => void;
    setEmailError: (value: string) => void;
    setPasswordError: (value: string) => void;
    setResultMessage: (value: string) => void;
    setResultType: (value: "success" | "error" | "") => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
    if (email.trim() === "") {
        return ("Please enter your email address.");
    }
    if (!EMAIL_REGEX.test(email)) {
        return ("Please enter a valid email address.");
    }
    return null;
}

const Password_Regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

export function validatePassword(password: string): string | null {
    if (password.trim() === "") {
        return "Please enter your password";
    }
    if (!Password_Regex.test(password)) {
        return "Password must have at least 6 characters, 1 uppercase character and 1 number";
    }
    return null;
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
    if (confirmPassword.trim() === "") {
        return "Please confirm your password";
    }
    if (password !== confirmPassword) {
        return "Passwords do not match";
    }
    return null;
}

export async function handleRegisterSubmit(
    e: React.FormEvent<HTMLFormElement>,
    formData: RegisterStage,
    setters: SetterType,
    onSuccess?: () => void
): Promise<boolean> {
    e.preventDefault();

    // Clear previous errors
    setters.setEmailError("");
    setters.setPasswordError("");
    setters.setResultMessage("");
    setters.setResultType("");

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) {
        setters.setEmailError(emailError);
        setters.setResultMessage(emailError);
        setters.setResultType("error");
        return false;
    }

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
        setters.setPasswordError(passwordError);
        setters.setResultMessage(passwordError);
        setters.setResultType("error");
        return false;
    }

    // Validate confirm password
    const confirmError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmError) {
        setters.setPasswordError(confirmError);
        setters.setResultMessage(confirmError);
        setters.setResultType("error");
        return false;
    }

    // --- PHẦN LIÊN KẾT FRONTEND & BACKEND API CỐT LÕI ---
    try {
        setters.setResultMessage("Connecting to server...");
        
        // Nhấc máy gọi điện lên cổng 8000 của Backend
        const response = await fetch("http://localhost:8000/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: formData.email,
                password: formData.password,
                role: "candidate" // Ép người dùng này thành Candidate
            }),
        });

        const data = await response.json();

        // Kiểm tra xem Backend có chửi mình không (như trùng email)
        if (!response.ok) {
            setters.setResultMessage(data.detail || "Registration failed!");
            setters.setResultType("error");
            return false;
        }

        // Backend báo OK 200, thành công!
        setters.setResultMessage("Registration successful!");
        setters.setResultType("success");
        setters.setEmail("");
        setters.setPassword("");
        setters.setConfirmPassword("");

        if (onSuccess) {
            onSuccess();
        }

        return true;
    } catch (error) {
        setters.setResultMessage("Error: Cannot connect to Backend.");
        setters.setResultType("error");
        return false;
    }
}