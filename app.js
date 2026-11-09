// Firebase Config Initialize 
const firebaseConfig = {
  apiKey: "AIzaSyBzflkC5-A4UaQKEN37LQUbyORSff855kY",
  authDomain: "game-coupon-db.firebaseapp.com",
  projectId: "game-coupon-db",
  storageBucket: "game-coupon-db.firebasestorage.app",
  messagingSenderId: "1006356631359",
  appId: "1:1006356631359:web:880a62dca18da059858d8a",
  measurementId: "G-X50G4K1TCT"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// 1. Coupon Generator Function
async function generateCoupon() {
    const coinAmount = parseInt(document.getElementById("coinAmount").value);
    if (!coinAmount || coinAmount <= 0) {
        alert("Valid coin amount দিন");
        return;
    }

    // Random 8-character Alpha-Numeric Code (e.g. LUDO-X89A)
    const randomCode = "LUDO-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        await db.collection("coupons").doc(randomCode).set({
            code: randomCode,
            coin_amount: coinAmount,
            is_used: false,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            used_by: ""
        });
        alert(`Coupon Created Successfully: ${randomCode}`);
        loadCoupons(); // Refresh Table
    } catch (error) {
        console.error("Error generating coupon: ", error);
    }
}
// 2. Fetch and Display Coupons in Table         

function loadCoupons() {
    const tableBody = document.getElementById("couponTableBody");
    tableBody.innerHTML = "";

    db.collection("coupons").orderBy("created_at", "desc").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = `
                <tr>
                    <td><b>${data.code}</b></td>
                    <td>${data.coin_amount} Coins</td>
                    <td><span class="${data.is_used ? 'used' : 'active'}">${data.is_used ? 'USED' : 'ACTIVE'}</span></td>
                    <td>
                        <button onclick="navigator.clipboard.writeText('${data.code}')">Copy Code</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    });
}

window.onload = function() {
    loadCoupons();
};