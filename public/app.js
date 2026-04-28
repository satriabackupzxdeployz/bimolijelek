const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const toggleLink = document.getElementById('toggleLink');
const toggleText = document.getElementById('toggleText');
const formTagline = document.getElementById('formTagline');
const regUsername = document.getElementById('regUsername');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const regConfirm = document.getElementById('regConfirmPassword');
const regBirthdate = document.getElementById('regBirthdate');
const regUsernameError = document.getElementById('regUsernameError');
const regEmailError = document.getElementById('regEmailError');
const regPasswordError = document.getElementById('regPasswordError');
const regConfirmError = document.getElementById('regConfirmError');
const regBirthError = document.getElementById('regBirthError');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginUserError = document.getElementById('loginUserError');
const loginPassError = document.getElementById('loginPassError');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const sliderContainer = document.getElementById('sliderContainer');
const sliderThumb = document.getElementById('sliderThumb');
const sliderTrack = document.getElementById('sliderTrack');
const sliderText = document.getElementById('sliderText');
const captchaWarning = document.getElementById('captchaWarning');
const captchaWarningText = document.getElementById('captchaWarningText');
const captchaSuccess = document.getElementById('captchaSuccess');
const successOverlay = document.getElementById('successOverlay');
const successMessage = document.getElementById('successMessage');
const successBtn = document.getElementById('successBtn');
const googleAuthBtn = document.getElementById('googleAuthBtn');

let isCaptchaVerified = false;
let isDragging = false;
let startX = 0;
let currentLeft = 0;
let sliderMax = 0;
let lastDataState = { username: '', email: '', password: '', confirm: '', birthdate: '' };
let firebaseAuth = null;

// Inisialisasi Firebase Auth dari config endpoint
async function initFirebase() {
    try {
        const res = await fetch('/api/config');
        const config = await res.json();
        const app = firebase.initializeApp(config);
        firebaseAuth = firebase.auth();
    } catch (e) {
        console.error('Gagal inisialisasi Firebase:', e);
    }
}

document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = this.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });
});

function initSlider() {
    const containerRect = sliderContainer.getBoundingClientRect();
    const thumbRect = sliderThumb.getBoundingClientRect();
    sliderMax = Math.max(0, containerRect.width - thumbRect.width);
}

function setThumbPosition(leftPos) {
    if (sliderMax <= 0) return;
    let newLeft = Math.max(0, Math.min(leftPos, sliderMax));
    sliderThumb.style.left = newLeft + 'px';
    let percent = (newLeft / sliderMax) * 100;
    sliderTrack.style.width = percent + '%';
    if (newLeft >= sliderMax - 1 && !isCaptchaVerified && sliderMax > 0) {
        isCaptchaVerified = true;
        sliderText.textContent = '✓ Terverifikasi';
        sliderText.style.color = '#000000';
        captchaSuccess.classList.add('show');
        captchaWarning.classList.remove('show');
        sliderThumb.innerHTML = '<i class="fas fa-check"></i>';
        sliderContainer.classList.add('verified');
        validateRegisterForm();
    }
}

function resetCaptcha() {
    if (isCaptchaVerified) {
        isCaptchaVerified = false;
        setThumbPosition(0);
        sliderText.textContent = 'Geser ke kanan untuk verifikasi';
        sliderText.style.color = '#a0a0a0';
        captchaSuccess.classList.remove('show');
        sliderThumb.innerHTML = '<i class="fas fa-arrow-right"></i>';
        sliderContainer.classList.remove('verified');
        validateRegisterForm();
    } else {
        setThumbPosition(0);
    }
}

function showCaptchaError(message) {
    captchaWarningText.textContent = message;
    captchaWarning.classList.add('show');
    sliderContainer.classList.add('error-slide');
    setTimeout(() => sliderContainer.classList.remove('error-slide'), 300);
}

function isAllDataValid() {
    const username = regUsername.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;
    const confirm = regConfirm.value;
    const birthdate = regBirthdate.value;
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    const isEmailValid = email && emailRegex.test(email);
    const isPasswordValid = password && password.length >= 6;
    const isConfirmValid = confirm && password === confirm;
    return username && isEmailValid && isPasswordValid && isConfirmValid && birthdate;
}

function checkDataChangeAndReset() {
    if (!isCaptchaVerified) return;
    const current = {
        username: regUsername.value.trim(),
        email: regEmail.value.trim(),
        password: regPassword.value,
        confirm: regConfirm.value,
        birthdate: regBirthdate.value
    };
    if (current.username !== lastDataState.username ||
        current.email !== lastDataState.email ||
        current.password !== lastDataState.password ||
        current.confirm !== lastDataState.confirm ||
        current.birthdate !== lastDataState.birthdate) {
        resetCaptcha();
    }
    lastDataState = {...current};
}

function onMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    let delta = e.clientX - startX;
    let newLeft = currentLeft + delta;
    setThumbPosition(newLeft);
}

function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    if (!isCaptchaVerified) setThumbPosition(0);
}

function onTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    let delta = e.touches[0].clientX - startX;
    let newLeft = currentLeft + delta;
    setThumbPosition(newLeft);
}

function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    if (!isCaptchaVerified) setThumbPosition(0);
}

function startDrag(e) {
    if (!isAllDataValid()) {
        showCaptchaError('Isi semua data terlebih dahulu (Username, Email, Password, Konfirmasi, Tanggal Lahir)');
        return;
    }
    e.preventDefault();
    initSlider();
    if (sliderMax <= 0) return;
    isDragging = true;
    let clientX = e.clientX || (e.touches && e.touches[0].clientX);
    startX = clientX;
    let leftStr = sliderThumb.style.left;
    currentLeft = leftStr ? parseFloat(leftStr) : 0;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
}

sliderThumb.addEventListener('mousedown', startDrag);
sliderThumb.addEventListener('touchstart', startDrag, { passive: false });

window.addEventListener('resize', () => {
    initSlider();
    if (isCaptchaVerified) setThumbPosition(sliderMax);
    else setThumbPosition(0);
});

function validateRegisterForm() {
    let isValid = true;
    const username = regUsername.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;
    const confirm = regConfirm.value;
    const birthdate = regBirthdate.value;
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    const isEmailValid = email && emailRegex.test(email);
    const isPasswordValid = password && password.length >= 6;
    const isConfirmValid = confirm && password === confirm;
    if (!username) isValid = false;
    if (!isEmailValid) isValid = false;
    if (!isPasswordValid) isValid = false;
    if (!isConfirmValid) isValid = false;
    if (!birthdate) isValid = false;
    if (!isCaptchaVerified) isValid = false;
    registerBtn.disabled = !isValid;
    return isValid;
}

function showRegisterErrors() {
    let hasError = false;
    const username = regUsername.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;
    const confirm = regConfirm.value;
    const birthdate = regBirthdate.value;
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    const isEmailValid = email && emailRegex.test(email);
    if (!username) {
        regUsernameError.classList.add('show');
        regUsername.classList.add('error');
        hasError = true;
    } else {
        regUsernameError.classList.remove('show');
        regUsername.classList.remove('error');
    }
    if (!email || !isEmailValid) {
        regEmailError.classList.add('show');
        regEmail.classList.add('error');
        hasError = true;
    } else {
        regEmailError.classList.remove('show');
        regEmail.classList.remove('error');
    }
    if (!password || password.length < 6) {
        regPasswordError.classList.add('show');
        regPassword.classList.add('error');
        hasError = true;
    } else {
        regPasswordError.classList.remove('show');
        regPassword.classList.remove('error');
    }
    if (password !== confirm || !confirm) {
        regConfirmError.classList.add('show');
        regConfirm.classList.add('error');
        hasError = true;
    } else {
        regConfirmError.classList.remove('show');
        regConfirm.classList.remove('error');
    }
    if (!birthdate) {
        regBirthError.classList.add('show');
        regBirthdate.classList.add('error');
        hasError = true;
    } else {
        regBirthError.classList.remove('show');
        regBirthdate.classList.remove('error');
    }
    if (!isCaptchaVerified) {
        showCaptchaError('Selesaikan verifikasi captcha terlebih dahulu');
        hasError = true;
    }
    return !hasError;
}

function handleInputChange() {
    validateRegisterForm();
    checkDataChangeAndReset();
}

function realtimePasswordMatch() {
    const password = regPassword.value;
    const confirm = regConfirm.value;
    if (confirm.length > 0 && password !== confirm) {
        regConfirmError.classList.add('show');
        regConfirm.classList.add('error');
    } else {
        regConfirmError.classList.remove('show');
        regConfirm.classList.remove('error');
    }
    handleInputChange();
}

function realtimeEmailValidation() {
    const email = regEmail.value.trim();
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (email.length > 0 && !emailRegex.test(email)) {
        regEmailError.classList.add('show');
        regEmail.classList.add('error');
    } else {
        regEmailError.classList.remove('show');
        regEmail.classList.remove('error');
    }
    handleInputChange();
}

regUsername.addEventListener('input', handleInputChange);
regEmail.addEventListener('input', () => { realtimeEmailValidation(); handleInputChange(); });
regPassword.addEventListener('input', () => { realtimePasswordMatch(); handleInputChange(); });
regConfirm.addEventListener('input', () => { realtimePasswordMatch(); handleInputChange(); });
regBirthdate.addEventListener('change', handleInputChange);

function validateLoginForm() {
    let valid = !!(loginUsername.value.trim() && loginPassword.value);
    loginBtn.disabled = !valid;
    return valid;
}

function showLoginErrors() {
    let hasError = false;
    if (!loginUsername.value.trim()) {
        loginUserError.classList.add('show');
        loginUsername.classList.add('error');
        hasError = true;
    } else {
        loginUserError.classList.remove('show');
        loginUsername.classList.remove('error');
    }
    if (!loginPassword.value) {
        loginPassError.classList.add('show');
        loginPassword.classList.add('error');
        hasError = true;
    } else {
        loginPassError.classList.remove('show');
        loginPassword.classList.remove('error');
    }
    return !hasError;
}

loginUsername.addEventListener('input', validateLoginForm);
loginPassword.addEventListener('input', validateLoginForm);

let isRegisterMode = false;

function toggleForm() {
    if (isRegisterMode) {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        formTagline.textContent = 'Masuk ke akun Anda';
        toggleText.textContent = 'Belum punya akun? ';
        toggleLink.textContent = 'Daftar';
        isRegisterMode = false;
        validateLoginForm();
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        formTagline.textContent = 'Bergabung dengan Coders';
        toggleText.textContent = 'Sudah punya akun? ';
        toggleLink.textContent = 'Masuk';
        isRegisterMode = true;
        isCaptchaVerified = false;
        setThumbPosition(0);
        sliderText.textContent = 'Geser ke kanan untuk verifikasi';
        sliderText.style.color = '#a0a0a0';
        captchaSuccess.classList.remove('show');
        sliderThumb.innerHTML = '<i class="fas fa-arrow-right"></i>';
        sliderContainer.classList.remove('verified');
        lastDataState = { username: '', email: '', password: '', confirm: '', birthdate: '' };
        validateRegisterForm();
    }
}

toggleLink.addEventListener('click', toggleForm);

// Tukar customToken dari backend ke Firebase ID Token lalu simpan
async function signInAndGetIdToken(customToken) {
    if (!firebaseAuth) throw new Error('Firebase Auth belum siap');
    const userCred = await firebaseAuth.signInWithCustomToken(customToken);
    const idToken = await userCred.user.getIdToken();
    return idToken;
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!showRegisterErrors()) return;
    const username = regUsername.value.trim();
    try {
        const checkResponse = await fetch('/api/check-username?username=' + encodeURIComponent(username));
        const checkData = await checkResponse.json();
        if (checkData.exists) {
            alert('Username sudah dipakai, silakan pilih username lain.');
            regUsername.classList.add('error');
            regUsernameError.classList.add('show');
            regUsernameError.innerHTML = '<i class="fas fa-exclamation-circle"></i> Username sudah dipakai';
            return;
        }
    } catch (err) {
        alert('Gagal memeriksa ketersediaan username. Silakan coba lagi.');
        return;
    }
    const userData = {
        username,
        email: regEmail.value.trim(),
        password: regPassword.value,
        birthdate: regBirthdate.value
    };
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const result = await response.json();
        if (response.ok) {
            // Tukar customToken ke Firebase ID Token
            const idToken = await signInAndGetIdToken(result.customToken);
            localStorage.setItem('coders_token', idToken);
            localStorage.setItem('coders_user', JSON.stringify(result.user));
            successMessage.textContent = `Selamat datang, ${result.user.displayName}!`;
            successOverlay.classList.add('active');
        } else {
            alert(result.error || 'Registrasi gagal');
        }
    } catch (err) {
        alert('Terjadi kesalahan. Silakan coba lagi.');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!showLoginErrors()) return;
    const credentials = {
        username: loginUsername.value.trim(),
        password: loginPassword.value
    };
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const result = await response.json();
        if (response.ok) {
            // Tukar customToken ke Firebase ID Token
            const idToken = await signInAndGetIdToken(result.customToken);
            localStorage.setItem('coders_token', idToken);
            localStorage.setItem('coders_user', JSON.stringify(result.user));
            successMessage.textContent = `Selamat datang kembali, ${result.user.displayName}!`;
            successOverlay.classList.add('active');
        } else {
            alert(result.error || 'Login gagal');
        }
    } catch (err) {
        alert('Terjadi kesalahan. Silakan coba lagi.');
    }
});

googleAuthBtn.addEventListener('click', () => {
    alert('Fitur login dengan Google belum tersedia.');
});

successBtn.addEventListener('click', () => {
    window.location.href = '/dashboard';
});

function init() {
    initSlider();
    setThumbPosition(0);
    validateRegisterForm();
    validateLoginForm();
    const today = new Date();
    const maxYear = today.getFullYear() - 13;
    const maxDate = `${maxYear}-12-31`;
    const minYear = today.getFullYear() - 100;
    const minDate = `${minYear}-01-01`;
    regBirthdate.setAttribute('min', minDate);
    regBirthdate.setAttribute('max', maxDate);
}

init();
initFirebase();
