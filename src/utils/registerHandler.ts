export interface RegisterStage {
    email : string;
    password : string;
    confirmPassword : string;
    emailError : string;
    passwordError : string;
    resultMessage : string;
    resultType : "success" | "error" | "";
}

export interface SetterType {
    setEmail : (value : string) => void;
    setPassword : (value : string) => void;
    setConfirmPassword : (value :string) => void;
    setEmailError : (value : string) => void;
    setPasswordError : (value : string) => void;
    setResultMessage : (value : string) => void;
    setResultType : (value : "success" | "error" | "") => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string) : string | null {
    if (email.trim() === "") {
        return ("Please enter your email address.");
    }
    if (!EMAIL_REGEX.test(email)) {
        return ("Please enter a valid email address.");
    }
}