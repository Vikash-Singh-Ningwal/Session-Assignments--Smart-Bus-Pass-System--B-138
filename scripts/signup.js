// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBNuza4ltSYYZf5eml5jdrjh_FuI8Rappk",
  authDomain: "smart-bus-pass-system-b3950.firebaseapp.com",
  projectId: "smart-bus-pass-system-b3950",
  storageBucket: "smart-bus-pass-system-b3950.firebasestorage.app",
  messagingSenderId: "422432816761",
  appId: "1:422432816761:web:eb86fe0ee38153833ddea8",
  measurementId: "G-H2M8MTJE4Q"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Utility functions
function generateUserID() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let id = '';
  for (let i = 0; i < 5; i++) id += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 5; i++) id += numbers[Math.floor(Math.random() * numbers.length)];
  return id;
}

function generateWalletID() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let id = '';
  for (let i = 0; i < 3; i++) id += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 6; i++) id += numbers[Math.floor(Math.random() * numbers.length)];
  return id;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const username = document.getElementById('username');
  const phone = document.getElementById('phone');
  const email = document.getElementById('email');
  const dob = document.getElementById('dob');
  const bloodGroup = document.getElementById('bloodGroup');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirm-password');
  const submitBtn = form.querySelector('.sign-btn');
  const togglePassword = document.getElementById('toggle-password');
  const toggleConfirmPassword = document.getElementById('toggle-confirm-password');

  // Validation functions
  const validateUsername = () => {
    const value = username.value.trim();
    const error = document.getElementById('username-error');
    if (value.length < 3) {
      error.textContent = 'Username must be at least 3 characters long';
      error.style.display = 'block';
      return false;
    }
    error.style.display = 'none';
    return true;
  };

  const validatePhone = () => {
    const value = phone.value.trim();
    const error = document.getElementById('phone-error');
    const phoneRegex = /^\+?\d{10}$/;
    if (!phoneRegex.test(value)) {
      error.textContent = 'Enter a valid phone number (With Out Country code)';
      error.style.display = 'block';
      return false;
    }
    error.style.display = 'none';
    return true;
  };

  const validateEmail = () => {
    const value = email.value.trim();
    const error = document.getElementById('email-error');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      error.textContent = 'Enter a valid email address';
      error.style.display = 'block';
      return false;
    }
    error.style.display = 'none';
    return true;
  };

  const validateDob = () => {
    const value = dob.value;
    const error = document.getElementById('dob-error');
    const today = new Date();
    const inputDate = new Date(value);
    if (!value || inputDate >= today) {
      error.textContent = 'Enter a valid DOB';
      error.style.display = 'block';
      return false;
    }
    error.style.display = 'none';
    return true;
  };

  const validateBloodGroup = () => {
    const value = bloodGroup.value;
    const error = document.getElementById('bloodGroup-error');
    if (!value) {
      error.textContent = 'Please select a blood group';
      error.style.display = 'block';
      return false;
    }
    error.style.display = 'none';
    return true;
  };

  const validatePassword = () => {
    const value = password.value;
    const error = document.getElementById('password-error');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(value)) {
      error.textContent = 'Password must be 8+ characters with uppercase, lowercase, number, and special character';
      error.style.display = 'block';
      return false;
    }
    error.style.display = 'none';
    return true;
  };

  const validateConfirmPassword = () => {
    const value = confirmPassword.value;
    const error = document.getElementById('confirm-password-error');
    if (value !== password.value) {
      error.textContent = 'Passwords do not match';
      error.style.display = 'block';
      return false;
    }
    error.style.display = 'none';
    return true;
  };

  // Enable/disable submit button
  const validateForm = () => {
    const isValid = validateUsername() && validatePhone() && validateEmail() && validateDob() && 
                    validateBloodGroup() && validatePassword() && validateConfirmPassword();
    submitBtn.disabled = !isValid;
  };

  // Real-time validation
  username.addEventListener('input', validateForm);
  phone.addEventListener('input', validateForm);
  email.addEventListener('input', validateForm);
  dob.addEventListener('input', validateForm);
  bloodGroup.addEventListener('change', validateForm);
  password.addEventListener('input', validateForm);
  confirmPassword.addEventListener('input', validateForm);

  // Toggle password visibility
  togglePassword.addEventListener('click', () => {
    const type = password.type === 'password' ? 'text' : 'password';
    password.type = type;
    togglePassword.textContent = type === 'password' ? 'Show' : 'Hide';
  });

  toggleConfirmPassword.addEventListener('click', () => {
    const type = confirmPassword.type === 'password' ? 'text' : 'password';
    confirmPassword.type = type;
    toggleConfirmPassword.textContent = type === 'password' ? 'Show' : 'Hide';
  });

  // Form submission with Firebase integration
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email.value, password.value);
      const userID = generateUserID();
      const walletID = generateWalletID();
      await db.collection('users').doc(userCredential.user.uid).set({
        userID: userID,
        walletID: walletID,
        username: username.value,
        phone: phone.value,
        email: email.value,
        dob: dob.value,
        bloodGroup: bloodGroup.value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('Sign-up successful! User ID: ' + userID + ', Wallet ID: ' + walletID);
      form.reset();
      submitBtn.disabled = true;
    } catch (error) {
      alert('Error: ' + error.message);
    }
  });
});