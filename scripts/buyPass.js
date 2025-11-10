const firebaseConfig = {
  apiKey: "AIzaSyBNuza4ltSYYZf5eml5jdrjh_FuI8Rappk",
  authDomain: "smart-bus-pass-system-b3950.firebaseapp.com",
  projectId: "smart-bus-pass-system-b3950",
  storageBucket: "smart-bus-pass-system-b3950.firebasestorage.app",
  messagingSenderId: "422432816761",
  appId: "1:422432816761:web:eb86fe0ee38153833ddea8",
  measurementId: "G-H2M8MTJE4Q"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

let selectedPlan = null;
let selectedPrice = null;

// Select plan handler
document.querySelectorAll(".plan-card").forEach(card => {
  card.addEventListener("click", () => {
    selectedPlan = card.getAttribute("data-plan");
    selectedPrice = parseInt(card.getAttribute("data-price"), 10);
    document.getElementById("plan").innerText = selectedPlan;
    document.getElementById("price").innerText = "₹" + selectedPrice;
  });
});

// Purchase button
document.getElementById("purchaseBtn").addEventListener("click", async () => {
  if (!selectedPlan) {
    alert("Please select a plan before purchasing.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("Please login first!");
    window.location.href = "./login.html";
    return;
  }

  // Razorpay checkout
  var options = {
    key: "rzp_test_RcJkKW0f4CKH0V", 
    amount: selectedPrice * 100,
    currency: "INR",
    name: "Smart Bus Pass",
    description: selectedPlan,
    handler: async function (response) {
      try {
        // Validity
        let start = new Date();
        let end = new Date(start);
        if (selectedPlan === "Daily Pass") end.setDate(start.getDate() + 1);
        if (selectedPlan === "Weekly Pass") end.setDate(start.getDate() + 7);
        if (selectedPlan === "Monthly Pass") end.setMonth(start.getMonth() + 1);

        // Save to Firestore
        const passRef = db.collection("users").doc(user.uid).collection("passes").doc();
        const passId = passRef.id;
        const qrData = `${user.uid}_${passId}`;

        await passRef.set({
          plan: selectedPlan,
          price: selectedPrice,
          startDate: firebase.firestore.Timestamp.fromDate(start),
          endDate: firebase.firestore.Timestamp.fromDate(end),
          paymentId: response.razorpay_payment_id,
          qrData: qrData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Show success
        document.getElementById("result").innerHTML = `
          <p class="success"> Pass Purchased Successfully!</p>
          <p><b>${selectedPlan}</b> valid till <b>${end.toDateString()}</b></p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" />
        `;
      } catch (err) {
        console.error("Error saving pass:", err);
        alert("Payment successful, but failed to issue pass!");
      }
    },
    prefill: {
      email: user.email || '',
      contact: ""
    },
    theme: { color: "#1a73e8" },
  };

  var rzp1 = new Razorpay(options);
  rzp1.open();
});
