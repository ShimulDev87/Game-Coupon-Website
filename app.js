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
    const customerName = document.getElementById("customerName").value.trim();
    const customerPhone = document.getElementById("customerPhone").value.trim();
    const coinAmount = parseInt(document.getElementById("coinAmount").value);

    if (!customerName || !customerPhone) {
        alert("Please enter User Name");
        return;
    }

    if (!coinAmount || coinAmount <= 0) {
        alert("Please enter Valid Coin Amount");
        return;
    }

    // Random Alpha-Numeric Code with GAME prefix
    const randomCode = "GAME-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        await db.collection("coupons").doc(randomCode).set({
            code: randomCode,
            customer_name: customerName,
            customer_phone: customerPhone,
            coin_amount: coinAmount,
            is_used: false,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            used_by: ""
        });
        
        alert(`Coupon Created Successfully: ${randomCode}`);
        
        // Clear inputs after successful generation
        document.getElementById("customerName").value = "";
        document.getElementById("customerPhone").value = "";
        
        loadCoupons(); // Refresh Table
    } catch (error) {
        console.error("Error generating coupon: ", error);
    }
}

// 2. Fetch and Display Coupons in Table        
function loadCoupons() {
    const tableBody = document.getElementById("couponTableBody");
    tableBody.innerHTML = "";

    db.collection("coupons").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = `
                <tr>
                    <td><b>${data.code}</b></td>
                    <td>
                        <div style="font-weight: 600; color: #f39c12;">${data.customer_name || 'N/A'}</div>
                        <div style="font-size: 12px; color: #b19cd9;">${data.customer_phone || ''}</div>
                    </td>
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

// Page Load e automatic table load korar jonno
window.onload = function() {
    loadCoupons();
};