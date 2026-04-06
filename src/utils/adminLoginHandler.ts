export const handleAdminLogin = (username: string, password: string) => {
    // 1. Check for empty fields
    if (!username.trim()) {
        return { success: false, errorType: "username", message: "Username cannot be empty" };
    }

    if (!password) {
        return { success: false, errorType: "password", message: "Password cannot be empty" };
    }

    // 2. Hardcode the single admin account credential
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "123";

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Validation exactly matches -> Success
        return { success: true, message: "Admin login successful! Redirecting..." };
    } else {
        // Invalid match -> Deny access
        return { success: false, errorType: "system", message: "Invalid credentials! You do not have permission." };
    }
};
