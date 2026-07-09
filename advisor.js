const BASE_URL = "https://ingenious-laughter-production-dd87.up.railway.app";
const API = BASE_URL + "/students";
let studentsData = [];
let editingId = null;

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
    };
}

window.onload = function () {
    if (!localStorage.getItem("token")) { window.location.href = "/index.html"; return; }
    const role = localStorage.getItem("role");
    // ADMIN should never land on advisor dashboard — redirect them
    if (role === "ADMIN") { window.location.href = "/admin-dashboard.html"; return; }

    // Only ADVISOR allowed here
    if (role !== "ADVISOR") { window.location.href = "/index.html"; return; }

    document.getElementById("advisorName").innerText = localStorage.getItem("email") || "";
    const dept = localStorage.getItem("department") || "";
    document.getElementById("advisorDept").innerText = dept ? "Dept: " + dept : "";
    const panelTitleEl = document.getElementById("panelTitle");
        if (panelTitleEl) panelTitleEl.innerText = dept ? dept + " Students" : "All Students";
    loadStudents();
    initializeDragDrop();
    loadContests();
};

function logout() { localStorage.clear(); window.location.href = "/index.html"; }

function loadStudents() {
    const role = localStorage.getItem("role") || "";
    const dept = localStorage.getItem("department") || "";
    const endpoint = role === "ADMIN" ? API + "/all" : API + "/department/" + encodeURIComponent(dept);
    fetch(endpoint, { headers: authHeaders() })
    .then(res => { if (res.status === 401 || res.status === 403) { window.location.href = "/index.html"; return; } return res.json(); })
    .then(data => { 
    if (!data) return; 
    studentsData = data.sort((a, b) => 
        (a.registerNumber || "").localeCompare(b.registerNumber || "")
    ); 
    renderTable(studentsData); 
    updateSummary(studentsData); 
    updateLastUpdatedStrip(studentsData); 
});
}

function renderTable(data) {
    updateLastUpdatedStrip(data);
    const body = document.getElementById("tableBody");
    body.innerHTML = "";
    if (data.length === 0) {
        body.innerHTML = `<tr><td colspan="14" style="text-align:center;color:#94a3b8;padding:30px">No students found</td></tr>`;
        return;
    }
    data.forEach((s, i) => {
        const cr = s.collegeRank;
        const dr = s.departmentRank;
        const crBadge = cr===1?"rank-1":cr===2?"rank-2":cr===3?"rank-3":"rank-badge";
        const drBadge = dr===1?"rank-1":dr===2?"rank-2":dr===3?"rank-3":"rank-badge";
        body.innerHTML += `
        <tr>
            <td><span class="rank-badge ${crBadge}">${cr||"-"}</span></td>
            <td><span class="rank-badge ${drBadge}">${dr||"-"}</span></td>
            <td><strong>${s.name||"-"}</strong></td>
            <td>${s.registerNumber||"-"}</td>
            <td>${s.year||"-"}</td>
            <td><span class="badge ${deptBadge(s.department)}">${s.department||"-"}</span></td>
            <td>${s.section||"-"}</td>
            <td>${s.leetcodeUsername||"-"}</td>
            <td>${s.codechefUsername||"-"}</td>
            <td>${s.codeforcesUsername||"-"}</td>
            <td>${s.totalSolved||0}</td>
            <td>${s.highestRating||0}</td>
            <td><div style="display:flex;gap:4px;flex-wrap:nowrap">
                <button class="btn btn-primary btn-sm" onclick="viewStudent('${s.registerNumber}')">View</button>
                <button class="btn btn-warning btn-sm" onclick="openEditModal(${s.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id})">Delete</button>
            </div></td>
        </tr>`;
    });
}

function updateSummary(data) {
    document.getElementById("totalStudents").innerText = data.length;
    document.getElementById("leetcodeCount").innerText = data.filter(s => s.leetcodeUsername).length;
    document.getElementById("codechefCount").innerText = data.filter(s => s.codechefUsername).length;
    document.getElementById("codeforcesCount").innerText = data.filter(s => s.codeforcesUsername).length;
}

function searchStudent() {
    const kw = document.getElementById("searchBox").value.toLowerCase();
    const yr = document.getElementById("yearFilter").value;
    const filtered = studentsData.filter(s =>
        ((s.name||"").toLowerCase().includes(kw) || (s.registerNumber||"").toLowerCase().includes(kw)) &&
        (!yr || s.year === yr)
    );
    renderTable(filtered);
}

function viewStudent(reg) { window.location.href = "/analytics.html?register=" + reg; }

// ── MODAL OPEN/CLOSE ──

function openAddModal() {
    editingId = null;
    document.getElementById("modalTitle").innerText = "Add Student";
    document.getElementById("saveBtn").innerText = "Save Student";
    clearModal();
    const dept = localStorage.getItem("department");
    if (dept) document.getElementById("sDept").value = dept;
    document.getElementById("studentModal").classList.add("active");
}

function openEditModal(id) {
    const s = studentsData.find(s => s.id === id);
    if (!s) return;
    editingId = id;
    document.getElementById("modalTitle").innerText = "Edit Student";
    document.getElementById("saveBtn").innerText = "Update Student";
    // Basic
    setVal("sName", s.name); setVal("sReg", s.registerNumber);
    setVal("sEmail", s.email); setVal("sPhone", s.phoneNumber);
    setVal("sDept", s.department); setVal("sYear", s.year);
    setVal("sSec", s.section); setVal("sBatch", s.batch);
    // Usernames
    setVal("sLeetcode", s.leetcodeUsername); setVal("sCodechef", s.codechefUsername);
    setVal("sCodeforces", s.codeforcesUsername); setVal("sGithub", s.githubUsername);
    setVal("sHackerrank", s.hackerrankUsername); setVal("sGfg", s.geeksforgeeksUsername);
    // Links
    setVal("sLinkedin", s.linkedinUrl); setVal("sPortfolio", s.portfolioUrl);
    document.getElementById("studentModal").classList.add("active");
}

function closeStudentModal() { document.getElementById("studentModal").classList.remove("active"); clearModal(); }

function setVal(id, v) { document.getElementById(id).value = (v == null || v === 0) ? "" : v; }
function getVal(id) { return document.getElementById(id).value.trim(); }
function getInt(id) { const v = parseInt(document.getElementById(id).value); return isNaN(v) ? 0 : v; }

function clearModal() {
    const ids = ["sName","sReg","sEmail","sPhone","sDept","sYear","sSec","sBatch",
        "sLeetcode","sCodechef","sCodeforces","sGithub","sHackerrank","sGfg",
        "sLinkedin","sPortfolio"];
    ids.forEach(id => document.getElementById(id).value = "");
    document.getElementById("modalMsg").innerText = "";
    editingId = null;
}

function saveStudent() {
    const msg = document.getElementById("modalMsg");
    if (!getVal("sName") || !getVal("sReg")) {
        msg.style.color = "red"; msg.innerText = "Name and Register Number are required"; return;
    }
    const student = {
        name: getVal("sName"), registerNumber: getVal("sReg"),
        email: getVal("sEmail"), phoneNumber: getVal("sPhone"),
        department: getVal("sDept"), year: getVal("sYear"),
        section: getVal("sSec"), batch: getVal("sBatch"),
        leetcodeUsername: getVal("sLeetcode"), codechefUsername: getVal("sCodechef"),
        codeforcesUsername: getVal("sCodeforces"), githubUsername: getVal("sGithub"),
        hackerrankUsername: getVal("sHackerrank"), geeksforgeeksUsername: getVal("sGfg"),
        linkedinUrl: getVal("sLinkedin"), portfolioUrl: getVal("sPortfolio")
    };
    const isEdit = editingId !== null;
    msg.style.color = "#64748b"; msg.innerText = "Saving...";
    fetch(isEdit ? API+"/update/"+editingId : API+"/add", {
        method: isEdit ? "PUT" : "POST", headers: authHeaders(), body: JSON.stringify(student)
    })
    .then(res => { if (!res.ok) throw new Error("Register Number already exists"); return res.json(); })
    .then(() => { closeStudentModal(); loadStudents(); })
    .catch(err => { msg.style.color = "red"; msg.innerText = err.message; });
}

function deleteStudent(id) {
    if (!confirm("Delete this student?")) return;
    fetch(API+"/delete/"+id, { method:"DELETE", headers:authHeaders() }).then(() => loadStudents());
}

function openExportModal() { document.getElementById("exportModal").classList.add("active"); }
function closeExportModal() { document.getElementById("exportModal").classList.remove("active"); }

function toggleSelectAll() {
    const cbs = document.querySelectorAll("#sortableColumns .column-card input");
    const btn = document.querySelector(".select-all-btn");
    const allChecked = [...cbs].every(cb => cb.checked);
    cbs.forEach(cb => cb.checked = !allChecked);
    btn.innerText = allChecked ? "Select All" : "Deselect All";
}

function exportCustomExcel() {
    const cols = [];
    document.querySelectorAll("#sortableColumns .column-card input").forEach(cb => { if (cb.checked) cols.push(cb.value); });
    if (cols.length === 0) { alert("Select at least one column"); return; }
    const role = localStorage.getItem("role") || "";
    const dept = localStorage.getItem("department") || "";
    const query = cols.map(c => "columns="+encodeURIComponent(c)).join("&");
    const endpoint = role === "ADMIN"
        ? API+"/export/custom?"+query
        : API+"/export/custom/department/"+encodeURIComponent(dept)+"?"+query;
    fetch(endpoint, { headers: authHeaders() })
    .then(res => res.blob())
    .then(blob => { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download="students_custom.xlsx"; a.click(); URL.revokeObjectURL(url); closeExportModal(); });
}

function initializeDragDrop() {
    const sortable = document.getElementById("sortableColumns");
    let draggedItem = null;
    document.querySelectorAll(".column-card").forEach(card => {
        card.addEventListener("dragstart", () => { draggedItem = card; card.classList.add("dragging"); });
        card.addEventListener("dragend", () => { card.classList.remove("dragging"); });
        card.addEventListener("dragover", e => {
            e.preventDefault();
            const after = getDragAfterElement(sortable, e.clientY);
            after == null ? sortable.appendChild(draggedItem) : sortable.insertBefore(draggedItem, after);
        });
    });
}

function getDragAfterElement(container, y) {
    return [...container.querySelectorAll(".column-card:not(.dragging)")].reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height/2;
        return offset < 0 && offset > closest.offset ? {offset, element:child} : closest;
    }, {offset: Number.NEGATIVE_INFINITY}).element;
}

function deptBadge(dept) {
    return {"ECE":"badge-ece","CSE":"badge-cse","MECH":"badge-mech","IT":"badge-it","EEE":"badge-eee"}[dept] || "badge-dept";
}

window.onclick = function(e) {
    if (e.target === document.getElementById("studentModal")) closeStudentModal();
    if (e.target === document.getElementById("exportModal")) closeExportModal();
};

/* ══════════════════════════════════════
   CONTESTS
══════════════════════════════════════ */
function loadContests() {
    fetchUpcoming();
    fetchPast();
}

function toIST(unixSec) {
    return new Date(unixSec * 1000).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true
    }) + " IST";
}

function isoToIST(isoStr) {
    return new Date(isoStr).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true
    }) + " IST";
}

function durStr(mins) {
    mins = parseInt(mins);
    if (mins >= 60) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
}

function durFromSec(sec) {
    return durStr(Math.round(sec / 60));
}

function contestCard(cls, platform, name, timeHtml,
                     link, isUpcoming) {
    const btnCls = isUpcoming ? "" : "grey";
    const btnTxt = isUpcoming ? "Register →" : "View →";
    return `
    <div class="contest-card ${cls}">
        <span class="contest-platform">${platform}</span>
        <div style="flex:1">
            <div class="contest-name">${name}</div>
            <div class="contest-time">${timeHtml}</div>
        </div>
        <a href="${link}" target="_blank"
           class="contest-link ${btnCls}">${btnTxt}</a>
    </div>`;
}

function fetchUpcoming() {
    const el = document.getElementById("upcomingContests");
    if (!el) return;
    el.innerHTML = `<div style="color:#94a3b8;font-size:13px">
        Loading...</div>`;

    Promise.all([
        fetch(BASE_URL + "/contests/codeforces", { headers: authHeaders() }).then(r => r.json()),
        fetch(BASE_URL + "/contests/leetcode",   { headers: authHeaders() }).then(r => r.json()),
        fetch(BASE_URL + "/contests/codechef",   { headers: authHeaders() }).then(r => r.json())
    ])
    .then(([cf, lc, cc]) => {
        let cards = [];

        // ── CODEFORCES ──
        (cf.upcoming || []).forEach(c => {
            cards.push({
                ts: c.startTimeSeconds,
                html: contestCard(
                    "cf", "🔵 Codeforces", c.name,
                    `🕐 Start: ${toIST(c.startTimeSeconds)}<br>` +
                    `🏁 End: ${toIST(c.startTimeSeconds +
                        c.durationSeconds)} &nbsp; ⏱ ${durFromSec(c.durationSeconds)}`,
                    `https://codeforces.com/contest/${c.id}`,
                    true
                )
            });
        });

        // ── LEETCODE ──
        (lc.upcoming || []).forEach(c => {
            cards.push({
                ts: c.startTime,
                html: contestCard(
                    "lc", "🟡 LeetCode", c.title,
                    `🕐 Start: ${toIST(c.startTime)}<br>` +
                    `🏁 End: ${toIST(c.startTime +
                        c.duration)} &nbsp; ⏱ ${durFromSec(c.duration)}`,
                    `https://leetcode.com/contest/${c.titleSlug}`,
                    true
                )
            });
        });

        // ── CODECHEF ──
        (cc.upcoming || []).forEach(c => {
            cards.push({
                ts: new Date(c.contest_start_date_iso)
                    .getTime() / 1000,
                html: contestCard(
                    "cc", "⭐ CodeChef", c.contest_name,
                    `🕐 Start: ${isoToIST(c.contest_start_date_iso)}<br>` +
                    `🏁 End: ${isoToIST(c.contest_end_date_iso)}` +
                    ` &nbsp; ⏱ ${durStr(c.contest_duration)}`,
                    `https://www.codechef.com/${c.contest_code}`,
                    true
                )
            });
        });

        // Sort by start time ascending
        cards.sort((a, b) => a.ts - b.ts);

        el.innerHTML = cards.length
            ? cards.map(c => c.html).join("")
            : `<div style="color:#94a3b8;font-size:13px">
                No upcoming contests found</div>`;
    })
    .catch(() => {
        el.innerHTML = `<div style="color:#ef4444;font-size:13px">
            Failed to load upcoming contests</div>`;
    });
}

function fetchPast() {
    const el = document.getElementById("pastContests");
    if (!el) return;
    el.innerHTML = `<div style="color:#94a3b8;font-size:13px">
        Loading...</div>`;

    Promise.all([
        fetch(BASE_URL + "/contests/codeforces", { headers: authHeaders() }).then(r => r.json()),
        fetch(BASE_URL + "/contests/leetcode",   { headers: authHeaders() }).then(r => r.json()),
        fetch(BASE_URL + "/contests/codechef",   { headers: authHeaders() }).then(r => r.json())
    ])
    .then(([cf, lc, cc]) => {
        let cards = [];

        // ── CODEFORCES ──
        (cf.past || []).forEach(c => {
            cards.push({
                ts: c.startTimeSeconds,
                html: contestCard(
                    "past-card", "🔵 Codeforces", c.name,
                    `🕐 Started: ${toIST(c.startTimeSeconds)}<br>` +
                    `✅ Ended: ${toIST(c.startTimeSeconds +
                        c.durationSeconds)} &nbsp; ⏱ ${durFromSec(c.durationSeconds)}`,
                    `https://codeforces.com/contest/${c.id}`,
                    false
                )
            });
        });

        // ── LEETCODE ──
        (lc.past || []).forEach(c => {
            cards.push({
                ts: c.startTime,
                html: contestCard(
                    "past-card", "🟡 LeetCode", c.title,
                    `🕐 Started: ${toIST(c.startTime)}<br>` +
                    `✅ Ended: ${toIST(c.startTime +
                        c.duration)} &nbsp; ⏱ ${durFromSec(c.duration)}`,
                    `https://leetcode.com/contest/${c.titleSlug}`,
                    false
                )
            });
        });

        // ── CODECHEF ──
        (cc.past || []).forEach(c => {
            cards.push({
                ts: new Date(c.contest_start_date_iso)
                    .getTime() / 1000,
                html: contestCard(
                    "past-card", "⭐ CodeChef", c.contest_name,
                    `🕐 Started: ${isoToIST(c.contest_start_date_iso)}<br>` +
                    `✅ Ended: ${isoToIST(c.contest_end_date_iso)}` +
                    ` &nbsp; ⏱ ${durStr(c.contest_duration)}`,
                    `https://www.codechef.com/${c.contest_code}`,
                    false
                )
            });
        });

        // Sort by most recent first
        cards.sort((a, b) => b.ts - a.ts);

        // Limit to 15
        el.innerHTML = cards.slice(0, 15)
            .map(c => c.html).join("") ||
            `<div style="color:#94a3b8;font-size:13px">
                No recent contests found</div>`;
    })
    .catch(() => {
        el.innerHTML = `<div style="color:#ef4444;font-size:13px">
            Failed to load recent contests</div>`;
    });
}

// ADD this new function anywhere in admin.js
function updateLastUpdatedStrip(data) {
    const latest = (arr) => arr.filter(Boolean).sort().pop() || "Not refreshed";

    const lcEl = document.getElementById("stripLC");
    const ccEl = document.getElementById("stripCC");
    const cfEl = document.getElementById("stripCF");

    // Use per-platform fields if available, else fall back to lastUpdated
    const lcTimes = data.map(s => s.leetcodeRatingUpdatedAt || s.lastUpdated);
    const ccTimes = data.map(s => s.codechefRatingUpdatedAt  || s.lastUpdated);
    const cfTimes = data.map(s => s.codeforcesRatingUpdatedAt|| s.lastUpdated);

    if (lcEl) lcEl.innerText = "🟡 LeetCode: " + latest(lcTimes);
    if (ccEl) ccEl.innerText = "⭐ CodeChef: " + latest(ccTimes);
    if (cfEl) cfEl.innerText = "🔵 Codeforces: " + latest(cfTimes);
}

// ══════════════════════════════════════
// CREATE STUDENT ACCOUNT
// ══════════════════════════════════════
function openCreateStudentModal() {
    document.getElementById("createStudentModal")
        .classList.add("active");
    document.getElementById("createStudentMsg")
        .innerText = "";
    // Auto-fill department from advisor's dept
    const dept = localStorage.getItem("department");
}

function closeCreateStudentModal() {
    document.getElementById("createStudentModal")
        .classList.remove("active");
    ["csName","csReg","csEmail","csPassword",
     "csYear","csSection","csBatch","csPhone"]
        .forEach(id => {
            document.getElementById(id).value = "";
        });
}

function createStudentAccount() {
    const msg = document.getElementById(
        "createStudentMsg");
    const name  = document.getElementById("csName").value.trim();
    const reg   = document.getElementById("csReg").value.trim();
    const email = document.getElementById("csEmail").value.trim();
    const pass  = document.getElementById("csPassword").value.trim();
    const dept  = localStorage.getItem("department") || "";

    if (!name || !reg || !email || !pass) {
        msg.style.color = "red";
        msg.innerText =
            "Name, Register Number, Email and Password required";
        return;
    }

    msg.style.color = "#64748b";
    msg.innerText = "Creating account...";

    fetch(BASE_URL + "/auth/advisor/create-student", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            name,
            registerNumber: reg,
            email,
            password: pass,
            department: dept,
            year: document.getElementById(
                "csYear").value.trim(),
            section: document.getElementById(
                "csSection").value.trim(),
            batch: document.getElementById(
                "csBatch").value.trim(),
            phoneNumber: document.getElementById(
                "csPhone").value.trim()
        })
    })
   .then(r => r.text().then(text => ({ ok: r.ok, text })))
       .then(({ ok, text }) => {
           if (!ok) throw new Error(text);
           closeCreateStudentModal();
           loadStudents();
           msg.style.color = "#16a34a";
           msg.innerText = "✅ Student account created!";
       })
       .catch(err => {
               msg.style.color = "red";
               msg.innerText = err.message || "Failed to create account";
               console.error("Create student error:", err);
       });
}
