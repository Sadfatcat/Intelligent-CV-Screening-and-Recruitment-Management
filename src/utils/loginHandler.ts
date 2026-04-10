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

export async function handleLoginSubmit(
  email: string,
  password: string,
  setters: SettersType
): Promise<boolean> {
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

  // --- PHẦN LIÊN KẾT FRONTEND & BACKEND API LOGIN ---
  try {
    setters.setResultMessage("Logging in...");
    
    const response = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setters.setResultMessage(data.detail || "Login failed!");
      setters.setResultType("error");
      return false;
    }

    // Backend báo OK 200, thành công!
    setters.setResultMessage("Login successful!");
    setters.setResultType("success");
    // Tuỳ vào logic ứng dụng (ví dụ lưu user_id/role vào Redux hoặc Context)
    // Ở bản demo này, ta lưu response JSON vào localStorage để phiên làm việc nhớ
    localStorage.setItem("currentUser", JSON.stringify(data));

    return true;
  } catch (error) {
    setters.setResultMessage("Error: Cannot connect to Backend.");
    setters.setResultType("error");
    return false;
  }
}