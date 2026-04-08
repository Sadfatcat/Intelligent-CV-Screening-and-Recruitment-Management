export interface LoginState {
  email: string;
  password: string;
  emailError: string;
  passwordError: string;
  resultMessage: string;
  resultType: "success" | "error" | "";
}

export interface SettersType {
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setEmailError: (value: string) => void;
  setPasswordError: (value: string) => void;
  setResultMessage: (value: string) => void;
  setResultType: (value: "success" | "error" | "") => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (email.trim() === "") {
    return "Please enter your email address.";
  }
  if (!EMAIL_REGEX.test(email)) {
    return "Please enter a valid email address.";
  }
  return null;
}
//Kiểm tra password: ít nhất 6 ký tự, bao gồm cả chữ và số
const Password_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

export function validatePassword(password: string): string | null {
  if (password.trim() === "") {
    return "Please enter your password.";
  }
  return null;

  if (password.length < 6) {
    return "Please enter a password with at least 6 characters.";
  }
  if (!Password_REGEX.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}

export function handleLoginSubmit(
  email: string,
  password: string,
  setters: SettersType
): boolean {
  // Reset lỗi cũ
  setters.setEmailError("");
  setters.setPasswordError("");
  setters.setResultMessage("");
  setters.setResultType("");

  // Kiểm tra email
  const emailErrorMsg = validateEmail(email);
  if (emailErrorMsg) {
    setters.setEmailError(emailErrorMsg);
    setters.setResultType("error");
    return false;
  }

  // Kiểm tra password
  const candidates = JSON.parse(localStorage.getItem("candidates") || "[]");

  if (candidates.length === 0) {
    setters.setResultMessage(
      "No candidate account found. Please register first."
    );
    setters.setResultType("error");
    return false;
  }

  const matchedCandidate = candidates.find(
    (item: { email: string; password: string }) =>
      item.email === email && item.password === password
  );

  if (!matchedCandidate) {
    setters.setResultMessage("Wrong email or password.");
    setters.setResultType("error");
    return false;
  }

  setters.setResultMessage("Login successful!");
  setters.setResultType("success");
  return true;
}