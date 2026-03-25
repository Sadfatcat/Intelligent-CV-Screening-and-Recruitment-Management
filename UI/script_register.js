const form = document.getElementById('registerform');
console.log(form);

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailError = document.getElementById('emailError');
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    emailError.textContent = '';

    if (password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        return;
    }
    if (!emailRegex.test(email)) {
        alert('Not a valid email address');
        emailError.textContent = 'Please enter a valid email address.';
        return;
    }
        
    alert('Registration successful!');
}

);