// =======================
// GLOBAL VARIABLES
// =======================
let currentUser = '';
let globalRole = '';
let chatLog = [];

const STATUS_LIST = [
    "รอรับงาน",
    "กำลังดำเนินการ",
    "รออะไหล่",
    "เสร็จสิ้น",
    "ยกเลิก"
];

const ACCOUNTS_DB = [
    { user: "admin", pass: "admin", email: "admin@corp.com", dept: "IT Support", role: "admin" },
    { user: "user",  pass: "123",   email: "staff01@corp.com", dept: "Marketing", role: "staff" },
    { user: "op",    pass: "123",   email: "op@corp.com", dept: "Operation", role: "all" }
];

// =======================
// INPUT ELEMENTS
// =======================
const repName = document.getElementById("repName");
const repDept = document.getElementById("repDept");
const repPhone = document.getElementById("repPhone");
const repAssetType = document.getElementById("repAssetType");
const repAssetCode = document.getElementById("repAssetCode");
const repAssetCustom = document.getElementById("repAssetCustom");
const repLocation = document.getElementById("repLocation");
const repProblem = document.getElementById("repProblem");
const repUrgency = document.getElementById("repUrgency");
const repImage = document.getElementById("repImage");

// =======================
// CHAT ELEMENTS
// =======================
const CHAT_BOX = document.getElementById("chatBox");
const CHAT_INPUT = document.getElementById("chatInput");

// =======================
// LOGIN & LOGOUT
// =======================
function handleLogin() {
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    const selectedRole = document.getElementById('userRole').value;

    if (!u || !p) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
    }

    const account = ACCOUNTS_DB.find(acc => acc.user === u && acc.pass === p);
    if (!account) {
        alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        return;
    }

    if (account.role !== 'all' && account.role !== selectedRole) {
        alert("บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานในฐานะที่เลือก");
        return;
    }

    currentUser = account.user;
    globalRole = selectedRole;

    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('displayUser').innerText =
        `สวัสดี: ${currentUser.toUpperCase()} (${globalRole})`;

    showPage('repair');
}

function confirmLogout() {
    if (confirm("ออกจากระบบ?")) {
        location.reload();
    }
}

// =======================
// ASSET FUNCTIONS
// =======================
function genAssetCodes(type) {
    sel = repAssetCode;
    custom = repAssetCustom;

    sel.classList.remove('hidden');
    custom.classList.add('hidden');
    custom.value = "";

    if (type === "G") {
        sel.classList.add('hidden');
        custom.classList.remove('hidden');
        return;
    }

    sel.innerHTML = '<option value="">-- เลือกเลขครุภัณฑ์ --</option>';
    if (!type) return;

    for (let i = 1; i <= 10; i++) {
        const op = document.createElement('option');
        op.value = `${type}${i}`;
        op.textContent = `${type}${i}`;
        sel.appendChild(op);
    }
}

// =======================
// REPAIR SUBMISSION
// =======================
async function submitRepair() {
    const name = repName.value.trim();
    const dept = repDept.value.trim();
    const phone = repPhone.value.trim();
    const type = repAssetType.value;

    // ✅ ตรวจเบอร์โทรก่อน (สำคัญ)
    if (!/^(06|08|09)[0-9]{8}$/.test(phone)) {
        alert("กรุณากรอกเบอร์มือถือให้ถูกต้อง (06 / 08 / 09)");
        repPhone.focus();
        return;
    }

    if (type === "G" && !repAssetCustom.value.trim()) {
        alert("กรุณาระบุหมายเลขครุภัณฑ์");
        return;
    }

    if (type !== "G" && !repAssetCode.value) {
        alert("กรุณาเลือกเลขครุภัณฑ์");
        return;
    }

    let asset = type === "G"
        ? "G-" + repAssetCustom.value.trim()
        : repAssetCode.value;

    const loc = repLocation.value.trim();
    const prob = repProblem.value.trim();
    const urg = repUrgency.value;

    if (!name || !asset || !prob) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
    }

    let img = "";
    if (repImage.files[0]) {
        img = await toBase64(repImage.files[0]);
    }

    const record = {
        id: Date.now(),
        name,
        dept,
        phone,
        asset,
        location: loc,
        problem: prob,
        urgency: urg,
        status: "กำลังดำเนินการ",
        image: img,
        date: new Date().toLocaleString("th-TH")
    };

    const db = JSON.parse(localStorage.getItem("repairs") || "[]");
    db.push(record);
    localStorage.setItem("repairs", JSON.stringify(db));

    alert("ส่งแจ้งซ่อมเรียบร้อย");
    resetRepairForm();
    showPage('list');
}


function resetRepairForm() {
    repName.value = "";
    repDept.value = "";
    repPhone.value = "";
    repLocation.value = "";
    repProblem.value = "";
    repUrgency.value = "normal";
    repAssetType.value = "";
    repAssetCode.innerHTML = '<option value="">-- เลือกเลขครุภัณฑ์ --</option>';
    repAssetCustom.value = "";
    repAssetCustom.classList.add('hidden');
    repAssetCode.classList.remove('hidden');
    repImage.value = "";
}

// =======================
// HELPER FUNCTIONS
// =======================
function toBase64(file) {
    return new Promise(res => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(file);
    });
}
// =======================
// RENDER TABLE
// =======================
function renderTable() {
    const body = document.getElementById("repairBody");
    body.innerHTML = "";
    const db = JSON.parse(localStorage.getItem("repairs") || "[]");
    if (db.length === 0) {
        document.getElementById("noDataMessage").classList.remove("hidden");
        return;
    }
    document.getElementById("noDataMessage").classList.add("hidden");
    db.slice().reverse().forEach(item => {
        const tr = document.createElement("tr");
        if (item.urgency === "critical") tr.classList.add("row-critical");
        else if (item.urgency === "urgent") tr.classList.add("row-urgent");
        else tr.classList.add("row-normal");
        tr.innerHTML = `
            <td>${urgencyBadge(item.urgency)}</td>
            <td>${formatDate(item.date)}</td>
            <td>${item.name}</td>
            <td>${item.dept}</td>
            <td>${item.location}</td>
            <td><code>${item.asset}</code></td>
            <td>${assetTypeName(item.asset)}</td>
            <td>${globalRole === "admin"? statusDropdown(item.id, item.status) : `<span class="status">${item.status}</span>`}</td>
            <td>${item.image ? `<img src="${item.image}" style="width:40px;cursor:pointer" ondblclick="openImg('${item.image}')">` : "-"}</td>
            <td><button class="btn-cancel" onclick="cancelRepair(${item.id})">ยกเลิก</button></td>
        `;
        body.appendChild(tr);
    });
}

function urgencyBadge(level) {
    if (level === "critical") return `<span class="urgency-badge critical">🔴 ด่วนที่สุด</span>`;
    if (level === "urgent") return `<span class="urgency-badge urgent">🟠 ด่วน</span>`;
    return `<span class="urgency-badge normal">🟢 ปกติ</span>`;
}

function statusDropdown(id, currentStatus) {
    const options = STATUS_LIST.map(st => `<option value="${st}" ${st === currentStatus ? "selected" : ""}>${st}</option>`).join("");
    return `<select onchange="updateStatus(${id}, this.value)">${options}</select>`;
}

function updateStatus(id, newStatus) {
    const db = JSON.parse(localStorage.getItem("repairs") || "[]");
    const idx = db.findIndex(item => item.id === id);
    if(idx !== -1){
        db[idx].status = newStatus;
        localStorage.setItem("repairs", JSON.stringify(db));
        renderTable();
    }
}

function assetTypeName(assetCode) {
    if (!assetCode) return "-";
    const map = { A:"คอมพิวเตอร์", B:"เครื่องปรับอากาศ", C:"โต๊ะ", D:"โซฟา", E:"เครื่องถ่ายเอกสาร", F:"โปรเจกเตอร์", G:"อื่นๆ"};
    return map[assetCode.charAt(0)] || "ไม่ทราบประเภท";
}

function cancelRepair(id) {
    let db = JSON.parse(localStorage.getItem("repairs") || "[]");
    db = db.filter(item => item.id !== id);
    localStorage.setItem("repairs", JSON.stringify(db));
    renderTable();
}

function openImg(src) {
    document.getElementById("modalImg").src = src;
    document.getElementById("imgModal").classList.remove("hidden");
}

function closeImg() {
    document.getElementById("imgModal").classList.add("hidden");
}

// =======================
// DATE FORMAT FIX
// =======================
function formatDate(datetime) {
    if (!datetime) return "-";
    const parts = datetime.split(" ");
    const date = parts[0] || "";
    const time = parts[1] || "";
    return `
        <div class="date-cell">
            <div class="date">${date}</div>
            <div class="time">${time}</div>
        </div>
    `;
}

// =======================
// EMAIL SEARCH (placeholder)
// =======================
function searchEmail() {}

// =======================
// CHAT
// =======================
function sendMessage() {
    const msg = CHAT_INPUT.value.trim();
    if (!msg) return;

    const userRole = globalRole === "admin" ? "admin" : "staff";
    const now = new Date();
    const time = now.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });

    chatLog.push({ user: userRole.toUpperCase(), role: userRole, text: msg, time });
    renderChat();
    CHAT_INPUT.value = "";
}

function renderChat() {
    CHAT_BOX.innerHTML = "";
    chatLog.forEach(msg => {
        const div = document.createElement("div");
        div.classList.add("chat-message", msg.role);
        div.innerHTML = `
            <div class="chat-user">${msg.user}</div>
            <div class="chat-text">${msg.text}</div>
            <div class="chat-time">${msg.time}</div>
        `;
        CHAT_BOX.appendChild(div);
    });
    CHAT_BOX.scrollTop = CHAT_BOX.scrollHeight;
}
function showPage(pid) {
    document.querySelectorAll('.page')
        .forEach(p => p.classList.add('hidden'));

    const page = document.getElementById('page-' + pid);
    if (page) page.classList.remove('hidden');

    document.querySelectorAll('.sidebar li')
        .forEach(li => li.classList.remove('active'));

    const menu = document.getElementById('menu-' + pid);
    if (menu) menu.classList.add('active');

    // ⭐ ปิด sidebar บนมือถือ
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('active');
    }

    if (pid === 'list') renderTable();
}
// ===============================
// MOBILE HAMBURGER MENU
// ===============================
function toggleMenu() {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("overlay");

    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
}
function onlyNumber(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10);
    }
}
function validatePhone(input) {
    const error = document.getElementById("phoneError");

    // ลบทุกอย่างที่ไม่ใช่ตัวเลข
    input.value = input.value.replace(/[^0-9]/g, '');

    // จำกัด 10 หลัก
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10);
    }

    // ตรวจรูปแบบเบอร์มือถือไทย
    const isValid =
        input.value.length === 10 &&
        /^(06|08|09)/.test(input.value);

    if (!isValid && input.value.length > 0) {
        input.classList.add("error");
        error.classList.remove("hidden");
    } else {
        input.classList.remove("error");
        error.classList.add("hidden");
    }
}
