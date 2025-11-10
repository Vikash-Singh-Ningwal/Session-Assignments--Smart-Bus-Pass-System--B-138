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

const hiUser = document.getElementById("hiUser");
const userInfo = document.getElementById("userInfo");
const balanceEl = document.getElementById("balance");
const walletIdEl = document.getElementById("walletId");
const txListEl = document.getElementById("txList");
const validityEl = document.getElementById("validityEl");
const activePassEl = document.getElementById("activePass");
const logoutBtn = document.getElementById("logoutBtn");

function showLoader(show) {
  const lo = document.getElementById("loader");
  if (lo) lo.style.display = show ? "flex" : "none";
}

function validateUserData(data, user) {
  return {
    userID: data.userID || user.uid || "N/A",
    username: data.username || data.name || "User",
    email: data.email || user.email || "N/A",
    phone: data.phone || "N/A",
    dob: data.dob || "N/A",
    bloodGroup: data.bloodGroup || "N/A",
    balance: data.balance || 0,
    walletID: data.walletID || "N/A"
  };
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }
  showLoader(true);

  try {
    const docRef = db.collection("users").doc(user.uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      alert("User data not found!");
      await auth.signOut();
      window.location.href = "./login.html";
      return;
    }

    const data = validateUserData(docSnap.data(), user);
    hiUser.textContent = `Hi, ${data.username}`;

    // User info
    userInfo.innerHTML = `
      <p><b>User ID:</b> ${data.userID}</p>
      <p><b>Name:</b> ${data.username}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Phone:</b> ${data.phone}</p>
      <p><b>DOB:</b> ${data.dob}</p>
      <p><b>Blood Group:</b> ${data.bloodGroup}</p>
    `;

    // Wallet info
    balanceEl.textContent = `₹${Math.abs(data.balance).toFixed(2)}`;
    balanceEl.className = `wallet-balance ${data.balance < 0 ? 'negative' : ''}`;
    walletIdEl.innerHTML = `WALLET ID: <br><strong>${data.walletID}</strong>`;

    // Recent transactions
    txListEl.innerHTML = '<div style="opacity:.7;padding:8px">Loading transactions...</div>';
    const txSnap = await docRef.collection("transactions").orderBy("time", "desc").limit(10).get();
    txListEl.innerHTML = '';

    if (txSnap.empty) {
      txListEl.innerHTML = '<div style="opacity:.7;padding:8px">No transactions yet.</div>';
    } else {
      txSnap.forEach((tx) => {
        const t = tx.data();
        const timeStr = t.time && t.time.toDate ? t.time.toDate().toLocaleString() : 'N/A';
        const el = document.createElement('div');
        el.className = `transaction ${t.amount >= 0 ? 'status-in' : 'status-out'}`;
        el.innerHTML = `
          <div class="desc">${t.type || 'Transaction'}</div>
          <div class="amount">₹${Math.abs(t.amount || 0).toFixed(2)} 
            <small style="display:block;opacity:.6">${timeStr}</small>
          </div>
        `;
        txListEl.appendChild(el);
      });
    }

    // Active Pass (only one QR displayed)
    const passesSnap = await docRef.collection("passes").orderBy("createdAt", "desc").limit(10).get();

    if (passesSnap.empty) {
      validityEl.innerHTML = `VALID UNTIL<br><strong>No active pass</strong>`;
      activePassEl.innerHTML = `<div style="opacity:.7;padding:8px">No passes purchased yet.</div>`;
    } else {
      let latestPass = null;

      passesSnap.forEach((pass) => {
        const p = pass.data();
        const endDate = p.endDate && p.endDate.toDate ? p.endDate.toDate() : new Date();
        const isActive = endDate >= new Date();

        if (isActive && !latestPass) {
          latestPass = p;
          validityEl.innerHTML = `VALID UNTIL<br><strong>${endDate.toDateString()}</strong>`;
          activePassEl.innerHTML = `
            <p style="margin-top:10px;font-weight:bold;">Active Pass</p>
            <p>${p.plan || 'Pass'} — ₹${(p.price || 0).toFixed(2)}</p>
            <p style="opacity:.7">Valid till ${endDate.toLocaleDateString()}</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(p.qrData || '')}" alt="Pass QR Code">
          `;
        }
      });

      if (!latestPass) {
        validityEl.innerHTML = `VALID UNTIL<br><strong>No active pass</strong>`;
        activePassEl.innerHTML = `<div style="opacity:.7;padding:8px">No active pass</div>`;
      }
    }


  } catch (err) {
    console.error("Error loading dashboard:", err);
    alert("Failed to load dashboard: " + err.message);
  } finally {
    showLoader(false);
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  try {
    await auth.signOut();
    window.location.href = "./login.html";
  } catch (err) {
    alert("Logout failed: " + err.message);
  }
});