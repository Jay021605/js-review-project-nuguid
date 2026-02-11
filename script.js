/* --- DATABASE & STATE --- */
const STORAGE_KEY = "request_pro_v10";
let db = { accounts: [], requests: [] };
let currentUser = null;

/**
 * Loads the database from LocalStorage and initializes a default admin.
 */
function loadDB() {
    const data = localStorage.getItem(STORAGE_KEY);
    db = data ? JSON.parse(data) : { accounts: [], requests: [] };
    
    // Create Default Admin if it does not exist
    if (!db.accounts.find(a => a.email === 'admin@example.com')) {
        db.accounts.push({ 
            first: "Super", last: "Admin", 
            email: "admin@example.com", 
            password: "Password123!", 
            role: "admin", 
            verified: true 
        });
        saveDB();
    }
}

function saveDB() { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); 
}

/* --- NAVIGATION & AUTH --- */

/**
 * Handles view switching and triggers data rendering for specific pages.
 */
function showView(name) {
    document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
    
    const target = document.getElementById(name + 'View');
    if (target) target.style.display = 'block';
    
    if (name === 'auth') {
        document.getElementById('mainNav').style.display = 'none';
    } else {
        document.getElementById('mainNav').style.display = 'flex';
        updateNavbar();
        
        // This ensures the boxes are NOT empty when you switch views
        if(name === 'user') renderUserDash();
        if(name === 'admin') renderAdminPanel();
    }
}

function updateNavbar() {
    if (currentUser) {
        document.getElementById('navUsername').innerText = currentUser.first;
        document.querySelectorAll('.role-admin').forEach(el => {
            el.style.display = (currentUser.role === 'admin') ? 'block' : 'none';
        });
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('lEmail').value;
    const pass = document.getElementById('lPass').value;
    
    const user = db.accounts.find(a => a.email === email && a.password === pass);
    
    if (user && user.verified) { 
        currentUser = user; 
        showView('user'); 
    } else {
        alert("Access denied. Please check credentials.");
    }
}

function logout() { 
    currentUser = null; 
    showView('auth'); 
}

/* --- USER DASHBOARD RENDERING --- */

/**
 * Populates the Profile Card and the Request History list.
 */
function renderUserDash() {
    const profile = document.getElementById('profileCard');
    if (profile && currentUser) {
        profile.innerHTML = `
            <h5 class="fw-bold">${currentUser.first} ${currentUser.last}</h5>
            <p class="text-muted mb-1">${currentUser.email}</p>
            <span class="badge bg-primary">Role: ${currentUser.role}</span>
        `;
    }
    renderUserRequests();
}

function renderUserRequests() {
    const container = document.getElementById('userRequestList');
    if (!container) return;
    
    const myReqs = db.requests.filter(r => r.email === currentUser.email);
    
    if (myReqs.length === 0) {
        container.innerHTML = '<div class="alert alert-light border text-center">No history found.</div>';
        return;
    }

    container.innerHTML = myReqs.map(r => `
        <div class="card mb-2 p-3 shadow-sm border-start border-primary border-4">
            <div class="d-flex justify-content-between align-items-center">
                <strong>${r.type}</strong>
                <span class="badge ${getStatusClass(r.status)}">${r.status}</span>
            </div>
            <small class="text-muted mt-1">
                ${r.items.map(i => `${i.name} (x${i.qty})`).join(', ')}
            </small>
        </div>
    `).join("");
}

/* --- REQUEST SUBMISSION --- */

function addItem(n="", q=1) {
    const div = document.createElement("div"); 
    div.className = "d-flex gap-2 mb-2";
    div.innerHTML = `
        <input class="form-control iName" placeholder="Item Name" value="${n}">
        <input type="number" class="form-control iQty" value="${q}" style="width:80px">
        <button class="btn btn-outline-danger btn-sm" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('itemsContainer').appendChild(div);
}

function submitRequest() {
    const type = document.getElementById('reqType').value;
    const items = Array.from(document.querySelectorAll('#itemsContainer div')).map(row => ({ 
        name: row.querySelector('.iName').value, 
        qty: row.querySelector('.iQty').value 
    })).filter(i => i.name.trim() !== "");

    if (!type || items.length === 0) {
        alert("Please provide a category and at least one item.");
        return;
    }

    db.requests.unshift({ 
        id: Date.now(), 
        type: type, 
        items, 
        email: currentUser.email, 
        status: "Pending" 
    });
    
    saveDB(); 
    document.getElementById('reqType').value = "";
    document.getElementById('itemsContainer').innerHTML = "";
    addItem(); // Add fresh input for next request
    renderUserDash(); 
}

/* --- ADMIN MANAGEMENT --- */

function renderAdminPanel() {
    const query = document.getElementById('adminSearch').value.toLowerCase();
    const filtered = db.requests.filter(r => r.email.toLowerCase().includes(query));
    
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    tbody.innerHTML = filtered.map(r => `
        <tr>
            <td><small>${r.email}</small></td>
            <td>${r.type}</td>
            <td><small>${r.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</small></td>
            <td><span class="badge ${getStatusClass(r.status)}">${r.status}</span></td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-success" onclick="