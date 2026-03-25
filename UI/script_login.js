const form = document.getElementById('loginform');
console.log(form);

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email'),value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailError = document.getElementById('emailError');
    const password = document.getElementById('password'),value;
    const loginError = document.getElementById('loginError');

    emailError.textContent = '';
    loginError.textContent = '';

    if (!emailRegex.test(email)) {
        alert('Wrong email address');
        emailError.textContent = 'Please enter your email address.';
        return;
    }
    if (password === '') {
        passwordError.textContent = 'Please enter your password.';
        return;
    }
    alert ('Login successful!');
}