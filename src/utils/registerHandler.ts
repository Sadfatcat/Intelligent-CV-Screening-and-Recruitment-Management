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

export function handleRegisterSubmit(
    e: React.FormEvent<HTMLFormElement>,
    formData: RegisterStage,
    setters: SetterType,
    onSuccess?: () => void
): boolean {
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

    // All validations passed
    setters.setResultMessage("Registration successful!");
    setters.setResultType("success");
    setters.setEmail("");
    setters.setPassword("");
    setters.setConfirmPassword("");

    const existingRecruiters = JSON.parse(
        localStorage.getItem("recruiters") || "[]"
    );

    const isEmailExist = existingRecruiters.some(
        (item: { email: string }) => item.email === formData.email
    );

    if (isEmailExist) {
        setters.setResultMessage("This email is already registered.");
        setters.setResultType("error");
        return false;
    }

    const newRecruiter = {
        email: formData.email,
        password: formData.password,
    };

    const updatedRecruiters = [...existingRecruiters, newRecruiter];

    localStorage.setItem("recruiters", JSON.stringify(updatedRecruiters));
    localStorage.setItem("savedRecruiter", JSON.stringify(newRecruiter));

    if (onSuccess) {
        onSuccess();
    }

    return true;
}