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

// ১. র্যান্ডম কোড জেনারেটর (Uppercase, Lowercase & Numbers)
function generateRandomCode(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result; 
}

// ২. Coupon Generator Function
async function generateCoupon() {
    const customerName = document.getElementById("customerName").value.trim();
    const customerPhone = document.getElementById("customerPhone").value.trim();
    const coinAmount = parseInt(document.getElementById("coinAmount").value);

    if (!customerName || !customerPhone) {
        alert("Please enter User Name and Phone");
        return;
    }

    if (!coinAmount || coinAmount <= 0) {
        alert("Please enter Valid Coin Amount");
        return;
    }
    
    const randomCode = generateRandomCode(8);

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
        
        loadCoupons(); // Refresh Table & Analytics
    } catch (error) {
        console.error("Error generating coupon: ", error);
    }
}

// ৩. Fetch and Display Coupons, Daily Redeemed Coins, & Active Players
function loadCoupons() {
    const tableBody = document.getElementById("couponTableBody");
    tableBody.innerHTML = "";

    let totalDailyCoins = 0;
    let totalCouponsCount = 0;

    // orderBy("created_at", "desc") ব্যবহার করা হয়েছে যাতে নতুন কুপনগুলো সবার উপরে থাকে
    db.collection("coupons").orderBy("created_at", "desc").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalCouponsCount++;
            
            // যদি কুপনটি ব্যবহৃত (USED) হয়ে থাকে, তবেই সেটি আজকের মোট রিডিম হওয়া কয়েনের সাথে যোগ হবে
            if (data.is_used) {
                totalDailyCoins += data.coin_amount; 
            }

            // ফায়ারবেস টাইমস্ট্যাম্পকে রিডেবল ডেট ফরম্যাটে রূপান্তর
            let formattedDate = "N/A";
            if (data.created_at && data.created_at.toDate) {
                formattedDate = data.created_at.toDate().toLocaleString(); 
            }

           const row = `
                <tr>
                    <td><b>${data.code}</b></td>
                    <td>
                        <div style="font-weight: 600; color: #f39c12;">${data.customer_name || 'N/A'}</div>
                        <div style="font-size: 12px; color: #b19cd9;">${data.customer_phone || ''}</div>
                    </td>
                    <td>${data.coin_amount} Coins</td>
                    <td style="font-size: 11px; color: #aaa;">${formattedDate}</td>
                    <td><span class="${data.is_used ? 'used' : 'active'}">${data.is_used ? 'USED' : 'ACTIVE'}</span></td>
                    <td>
                        
                        <button onclick="copyCouponCode(this, '${data.code}')" style="margin-right: 5px;">Copy</button>
                        
                        
                        ${data.is_used ? `<button onclick="deleteCoupon('${data.code}')" style="background-color: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>` : ''}
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        // Analytics UI Update (Total Coins & Total Coupons Count)
        updateAnalyticsUI(totalDailyCoins, totalCouponsCount);
    }).catch((error) => {
        console.error("Error loading coupons: ", error);
    });

    
    fetchActivePlayersCount();
}


async function deleteCoupon(couponCode) {
    if (confirm(`Are you sure you want to delete coupon: ${couponCode}?`)) {
        try {
            await db.collection("coupons").doc(couponCode).delete();
            alert("Coupon deleted successfully!");
            loadCoupons(); 
        } catch (error) {
            console.error("Error deleting coupon: ", error);
            alert("Failed to delete coupon.");
        }
    }
}


function fetchActivePlayersCount() {
    db.collection("analytics").doc("online_status").onSnapshot((doc) => {
        const activeElem = document.getElementById("activePlayersText");
        if (doc.exists && activeElem) {
            let onlineCount = doc.data().count || 0;
            activeElem.innerText = onlineCount;
        } else if (activeElem) {
            activeElem.innerText = "0";
        }
    }, (error) => {
        console.error("Error getting active players: ", error);
    });
}

// কুপন কোড কপি করার এবং বাটনে "Copied!" দেখানোর ফাংশন
function copyCouponCode(btnElement, code) {
    navigator.clipboard.writeText(code).then(() => {
        // আগের লেখা এবং স্টাইল সেভ করে রাখা
        let originalText = btnElement.innerText;
        let originalBg = btnElement.style.backgroundColor;

        // বাটনের লেখা ও রঙ পরিবর্তন করে "Copied!" করা
        btnElement.innerText = "Copied!";
        btnElement.style.backgroundColor = "#27ae60"; // সবুজ কালার (Success)
        btnElement.disabled = true;

        // ২ সেকেন্ড (২০০০ মিলিগ্রাম) পর আবার আগের অবস্থায় ফিরিয়ে আনা
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.style.backgroundColor = originalBg;
            btnElement.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy coupon code.");
    });
}

// ৬. Unified Analytics UI Update Function
function updateAnalyticsUI(totalCoins, totalCoupons) {
    const dailyCoinsElem = document.getElementById("dailyCoinsText");
    if (dailyCoinsElem) {
        dailyCoinsElem.innerText = totalCoins.toLocaleString() + " Coins";
    }

    const totalCouponsElem = document.getElementById("totalCouponsText");
    if (totalCouponsElem) {
        totalCouponsElem.innerText = totalCoupons;
    }
}

// Page Load এ automatic table load করার জন্য
window.onload = function() {
    loadCoupons();
};