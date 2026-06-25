const BASE_URL = "https://ingenious-laughter-production-dd87.up.railway.app";
const STUDENTS  = BASE_URL + "/students";
const ADVISORS  = BASE_URL + "/advisors";

let allStudents = [];
let allAdvisors = [];
let editingStudentId = null;
let editingAdvisorId = null;

/* ══ AUTH ══ */
function authHeaders() {
    return { "Content-Type":"application/json", "Authorization":"Bearer "+localStorage.getItem("token") };
}

/* ══ INIT ══ */
window.onload = function () {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");
    if (!token || role !== "ADMIN") { window.location.href = "/index.html"; return; }
    document.getElementById("adminEmail").innerText = localStorage.getItem("email") || "Admin";
    loadStudents();
    loadAdvisors();
};

/* ══ LOGOUT ══ */
function logout() { localStorage.clear(); window.location.href = "/index.html"; }

/* ══ TABS ══ */
function switchTab(tab, el) {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("tab-"+tab).classList.add("active");
    el.classList.add("active");
    if (tab === "analytics") renderDeptAnalytics();
    if (tab === "contests")  loadContests(); // ← add this
}

/* ══ TOAST ══ */
function showToast(msg, color) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.style.background = color || "#0f172a";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

/* ══════════════════════════════════════
   STUDENTS
══════════════════════════════════════ */

function loadStudents() {
    fetch(STUDENTS+"/all", { headers: authHeaders() })
    .then(res => { if (res.status===401||res.status===403) { window.location.href="/index.html"; return; } return res.json(); })
    .then(data => { if (!data) return; allStudents=data; renderStudentTable(data); updateSummary(data); });
}

function renderStudentTable(data) {
    updateLastUpdatedStrip(data);
    const body = document.getElementById("studentTableBody");
    body.innerHTML = "";
    if (data.length === 0) {
        body.innerHTML = `<tr><td colspan="13" style="text-align:center;color:#94a3b8;padding:30px">No students found</td></tr>`;
        return;
    }
    data.forEach((s, i) => {
        const cr = s.collegeRank;
        const dr = s.departmentRank;
        const crBadge = cr===1?"rank-1":cr===2?"rank-2":cr===3?"rank-3":"rank-badge";
        const drBadge = dr===1?"rank-1":dr===2?"rank-2":dr===3?"rank-3":"rank-badge";
        body.innerHTML += `<tr>
            <td><span class="rank-badge ${crBadge}">${cr||"-"}</span></td>
            <td><span class="rank-badge ${drBadge}">${dr||"-"}</span></td>
            <td><strong>${s.name||"-"}</strong></td>
            <td>${s.registerNumber||"-"}</td>
            <td><span class="badge ${deptBadge(s.department)}">${s.department||"-"}</span></td>
            <td>${s.year||"-"}</td>
            <td>${s.section||"-"}</td>
            <td>${s.leetcodeUsername||"-"}</td>
            <td>${s.codechefUsername||"-"}</td>
            <td>${s.codeforcesUsername||"-"}</td>
            <td><strong>${s.totalSolved||0}</strong></td>
            <td>${s.highestRating||0}</td>
            <td><div style="display:flex;gap:4px;flex-wrap:nowrap">
                <button class="btn btn-primary btn-sm" onclick="viewStudent('${s.registerNumber}')">View</button>
                <button class="btn btn-warning btn-sm" onclick="openEditStudent(${s.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id})">Del</button>
            </div></td>
        </tr>`;
    });
}

function updateSummary(data) {
    document.getElementById("totalStudents").innerText = data.length;
    document.getElementById("lcCount").innerText = data.filter(s=>s.leetcodeUsername).length;
    document.getElementById("ccCount").innerText = data.filter(s=>s.codechefUsername).length;
    document.getElementById("cfCount").innerText = data.filter(s=>s.codeforcesUsername).length;
    const avg = data.length ? Math.round(data.reduce((a,s)=>a+(s.totalSolved||0),0)/data.length) : 0;
    document.getElementById("avgSolved").innerText = avg;
}

function filterStudents() {
    const kw   = document.getElementById("studentSearch").value.toLowerCase();
    const dept = document.getElementById("deptFilter").value;
    const yr   = document.getElementById("yearFilter").value;
    const sort = document.getElementById("sortBy").value;
    let filtered = allStudents.filter(s =>
        (!kw || (s.name||"").toLowerCase().includes(kw) || (s.registerNumber||"").toLowerCase().includes(kw)) &&
        (!dept || s.department === dept) &&
        (!yr   || s.year === yr)
    );
    if (sort) filtered.sort((a,b) => (b[sort]||0) - (a[sort]||0));
    renderStudentTable(filtered);
}

function viewStudent(reg) { window.location.href = "/analytics.html?register="+reg; }

/* ── REFRESH ONE STUDENT ── */
function refreshOneStudent(id) {
    showToast("🔄 Fetching stats...", "#7c3aed");
    fetch(STUDENTS+"/refresh/"+id, { method:"POST", headers:authHeaders() })
    .then(res => res.json())
    .then(() => { loadStudents(); showToast("✅ Stats updated!", "#16a34a"); })
    .catch(() => showToast("❌ Refresh failed", "#ef4444"));
}

/* ── REFRESH ALL ── */
function refreshAllStudents() {
    const btn = document.getElementById("refreshAllBtn");
    btn.innerHTML = '<span class="spinner"></span>Refreshing...';
    btn.disabled = true;
    showToast("🔄 Fetching all platform stats... this may take a moment", "#7c3aed");
    fetch(STUDENTS+"/refresh/all", { method:"POST", headers:authHeaders() })
    .then(res => res.json())
    .then(() => { loadStudents(); showToast("✅ All stats refreshed!", "#16a34a"); })
    .catch(() => showToast("❌ Refresh failed", "#ef4444"))
    .finally(() => { btn.innerHTML = "🔄 Refresh All Stats"; btn.disabled = false; });
}

/* ── RECALCULATE RANKS ── */
function recalculateRanks() {
    const btn = document.getElementById("rankBtn");
    btn.innerHTML = '<span class="spinner"></span>Calculating...';
    btn.disabled = true;
    fetch(STUDENTS+"/recalculate-ranks", { method:"POST", headers:authHeaders() })
    .then(res => res.json())
    .then(() => { loadStudents(); showToast("🏆 Ranks recalculated!", "#0d9488"); })
    .catch(() => showToast("❌ Rank calculation failed", "#ef4444"))
    .finally(() => { btn.innerHTML = "🏆 Recalculate Ranks"; btn.disabled = false; });
}

/* ── ADD/EDIT STUDENT MODAL ── */
function openStudentModal() {
    editingStudentId = null;
    document.getElementById("studentModalTitle").innerText = "Add Student";
    document.getElementById("studentSaveBtn").innerText = "Save Student";
    clearStudentModal();
    document.getElementById("studentModal").classList.add("active");
}

function openEditStudent(id) {
    const s = allStudents.find(s => s.id===id);
    if (!s) return;
    editingStudentId = id;
    document.getElementById("studentModalTitle").innerText = "Edit Student";
    document.getElementById("studentSaveBtn").innerText = "Update Student";
    sv("sName",s.name); sv("sReg",s.registerNumber); sv("sEmail",s.email); sv("sPhone",s.phoneNumber);
    sv("sDept",s.department,"sel"); sv("sYear",s.year,"sel"); sv("sSec",s.section); sv("sBatch",s.batch);
    sv("sLeetcode",s.leetcodeUsername); sv("sCodechef",s.codechefUsername); sv("sCodeforces",s.codeforcesUsername);
    sv("sGithub",s.githubUsername); sv("sHackerrank",s.hackerrankUsername); sv("sGfg",s.geeksforgeeksUsername);
    sv("sLcEasy",s.leetcodeEasySolved); sv("sLcMedium",s.leetcodeMediumSolved); sv("sLcHard",s.leetcodeHardSolved);
    sv("sLcTotal",s.leetcodeTotalSolved); sv("sLcContests",s.leetcodeContestCount); sv("sLcRating",s.leetcodeContestRating);
    sv("sLcRank",s.leetcodeGlobalRank); sv("sLcTop",s.leetcodeTopPercentage);
    sv("sCcCurrent",s.codechefCurrentRating); sv("sCcHighest",s.codechefHighestRating);
    sv("sCcDiv",s.codechefDivision); sv("sCcStars",s.codechefStars);
    sv("sCcGRank",s.codechefGlobalRank); sv("sCcCRank",s.codechefCountryRank);
    sv("sCcContests",s.codechefContests); sv("sCcSolved",s.codechefProblemsSolved);
    sv("sCfCurrent",s.codeforcesCurrentRating); sv("sCfMax",s.codeforcesMaxRating);
    sv("sCfCRank",s.codeforcesCurrentRank); sv("sCfMRank",s.codeforcesMaxRank);
    sv("sCfProblems",s.codeforcesProblemsCount); sv("sCfContests",s.codeforcesContests); sv("sCfLevel",s.codeforcesLevel);
    sv("sLinkedin",s.linkedinUrl); sv("sPortfolio",s.portfolioUrl);
    document.getElementById("studentModal").classList.add("active");
}

function sv(id, val, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = (val==null||val===0) ? "" : val;
}

function gv(id) { return document.getElementById(id).value.trim(); }
function gi(id) { const v=parseInt(document.getElementById(id).value); return isNaN(v)?0:v; }

function closeStudentModal() { document.getElementById("studentModal").classList.remove("active"); clearStudentModal(); }

function clearStudentModal() {
    ["sName","sReg","sEmail","sPhone","sSec","sBatch",
     "sLeetcode","sCodechef","sCodeforces","sGithub","sHackerrank","sGfg",
     "sLcEasy","sLcMedium","sLcHard","sLcTotal","sLcContests","sLcRating","sLcRank","sLcTop",
     "sCcCurrent","sCcHighest","sCcDiv","sCcStars","sCcGRank","sCcCRank","sCcContests","sCcSolved",
     "sCfCurrent","sCfMax","sCfCRank","sCfMRank","sCfProblems","sCfContests","sCfLevel",
     "sLinkedin","sPortfolio"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
    document.getElementById("sDept").value=""; document.getElementById("sYear").value="";
    document.getElementById("studentModalMsg").innerText="";
    editingStudentId = null;
}

function saveStudent() {
    const msg = document.getElementById("studentModalMsg");
    if (!gv("sName")||!gv("sReg")||!gv("sDept")) {
        msg.style.color="red"; msg.innerText="Name, Register Number and Department are required"; return;
    }
    const student = {
        name:gv("sName"), registerNumber:gv("sReg"), email:gv("sEmail"), phoneNumber:gv("sPhone"),
        department:gv("sDept"), year:gv("sYear"), section:gv("sSec"), batch:gv("sBatch"),
        leetcodeUsername:gv("sLeetcode"), codechefUsername:gv("sCodechef"), codeforcesUsername:gv("sCodeforces"),
        githubUsername:gv("sGithub"), hackerrankUsername:gv("sHackerrank"), geeksforgeeksUsername:gv("sGfg"),
        leetcodeEasySolved:gi("sLcEasy"), leetcodeMediumSolved:gi("sLcMedium"), leetcodeHardSolved:gi("sLcHard"),
        leetcodeTotalSolved:gi("sLcTotal"), leetcodeContestCount:gi("sLcContests"), leetcodeContestRating:gi("sLcRating"),
        leetcodeGlobalRank:gv("sLcRank"), leetcodeTopPercentage:gv("sLcTop"),
        codechefCurrentRating:gi("sCcCurrent"), codechefHighestRating:gi("sCcHighest"),
        codechefDivision:gv("sCcDiv"), codechefStars:gv("sCcStars"),
        codechefGlobalRank:gv("sCcGRank"), codechefCountryRank:gv("sCcCRank"),
        codechefContests:gi("sCcContests"), codechefProblemsSolved:gi("sCcSolved"),
        codeforcesCurrentRating:gi("sCfCurrent"), codeforcesMaxRating:gi("sCfMax"),
        codeforcesCurrentRank:gv("sCfCRank"), codeforcesMaxRank:gv("sCfMRank"),
        codeforcesProblemsCount:gi("sCfProblems"), codeforcesContests:gi("sCfContests"),
        codeforcesLevel:gv("sCfLevel"), linkedinUrl:gv("sLinkedin"), portfolioUrl:gv("sPortfolio")
    };
    const isEdit = editingStudentId !== null;
    msg.style.color="#64748b"; msg.innerText="Saving...";
    fetch(isEdit ? STUDENTS+"/update/"+editingStudentId : STUDENTS+"/add", {
        method: isEdit?"PUT":"POST", headers:authHeaders(), body:JSON.stringify(student)
    })
    .then(res=>{ if(!res.ok) throw new Error("Save failed"); return res.json(); })
    .then(()=>{ closeStudentModal(); loadStudents(); showToast("✅ Student saved!","#16a34a"); })
    .catch(err=>{ msg.style.color="red"; msg.innerText=err.message; });
}

function deleteStudent(id) {
    if (!confirm("Delete this student permanently?")) return;
    fetch(STUDENTS+"/delete/"+id, { method:"DELETE", headers:authHeaders() })
    .then(()=>{ loadStudents(); showToast("🗑 Student deleted","#ef4444"); });
}

/* ══════════════════════════════════════
   ADVISORS
══════════════════════════════════════ */

function loadAdvisors() {
    fetch(ADVISORS+"/all", { headers:authHeaders() })
    .then(res=>res.json())
    .then(data=>{ allAdvisors=data; renderAdvisorTable(data); });
}

function renderAdvisorTable(data) {
    const body = document.getElementById("advisorTableBody");
    body.innerHTML = "";
    if (data.length===0) {
        body.innerHTML=`<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:30px">No advisors found</td></tr>`;
        return;
    }
    data.forEach((a,i)=>{
        body.innerHTML+=`<tr>
            <td>${i+1}</td>
            <td><strong>${a.name||"-"}</strong></td>
            <td>${a.email||"-"}</td>
            <td><span class="badge ${deptBadge(a.department)}">${a.department||"-"}</span></td>
            <td>${a.section||"-"}</td>
            <td>${a.designation||"-"}</td>
            <td>${a.phoneNumber||"-"}</td>
            <td><div style="display:flex;gap:5px">
                <button class="btn btn-warning btn-sm" onclick="openEditAdvisor(${a.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteAdvisor(${a.id})">Delete</button>
            </div></td>
        </tr>`;
    });
}

function filterAdvisors() {
    const kw   = document.getElementById("advisorSearch").value.toLowerCase();
    const dept = document.getElementById("advisorDeptFilter").value;
    renderAdvisorTable(allAdvisors.filter(a =>
        (!kw||(a.name||"").toLowerCase().includes(kw)||(a.email||"").toLowerCase().includes(kw)) &&
        (!dept||a.department===dept)
    ));
}

function openAdvisorModal() {
    editingAdvisorId=null;
    document.getElementById("advisorModalTitle").innerText="Add Advisor";
    clearAdvisorModal();
    document.getElementById("advisorModal").classList.add("active");
}

function openEditAdvisor(id) {
    const a=allAdvisors.find(a=>a.id===id); if(!a) return;
    editingAdvisorId=id;
    document.getElementById("advisorModalTitle").innerText="Edit Advisor";
    document.getElementById("aName").value=a.name||"";
    document.getElementById("aEmail").value=a.email||"";
    document.getElementById("aDept").value=a.department||"";
    document.getElementById("aSec").value=a.section||"";
    document.getElementById("aDesig").value=a.designation||"";
    document.getElementById("aPhone").value=a.phoneNumber||"";
    document.getElementById("advisorModal").classList.add("active");
}

function closeAdvisorModal() { document.getElementById("advisorModal").classList.remove("active"); clearAdvisorModal(); }
function clearAdvisorModal() {
    ["aName","aEmail","aSec","aDesig","aPhone"].forEach(id=>document.getElementById(id).value="");
    document.getElementById("aDept").value="";
    document.getElementById("advisorModalMsg").innerText="";
}

function saveAdvisor() {
    const msg=document.getElementById("advisorModalMsg");
    const advisor={
        name:document.getElementById("aName").value.trim(),
        email:document.getElementById("aEmail").value.trim(),
        department:document.getElementById("aDept").value,
        section:document.getElementById("aSec").value.trim(),
        designation:document.getElementById("aDesig").value.trim(),
        phoneNumber:document.getElementById("aPhone").value.trim()
    };
    if(!advisor.name||!advisor.email||!advisor.department){
        msg.style.color="red"; msg.innerText="Name, Email and Department required"; return;
    }
    const isEdit=editingAdvisorId!==null;
    msg.style.color="#64748b"; msg.innerText="Saving...";
    fetch(isEdit?ADVISORS+"/update/"+editingAdvisorId:ADVISORS+"/add",{
        method:isEdit?"PUT":"POST", headers:authHeaders(), body:JSON.stringify(advisor)
    })
    .then(res=>{if(!res.ok)throw new Error("Save failed");return res.json();})
    .then(()=>{closeAdvisorModal();loadAdvisors();showToast("✅ Advisor saved!","#16a34a");})
    .catch(err=>{msg.style.color="red";msg.innerText=err.message;});
}

function deleteAdvisor(id) {
    if(!confirm("Delete this advisor?")) return;
    fetch(ADVISORS+"/delete/"+id,{method:"DELETE",headers:authHeaders()})
    .then(()=>{loadAdvisors();showToast("🗑 Advisor deleted","#ef4444");});
}

/* ══════════════════════════════════════
   DEPARTMENT ANALYTICS
══════════════════════════════════════ */

function renderDeptAnalytics() {
    const depts=[...new Set(allStudents.map(s=>s.department).filter(Boolean))].sort();
    const grid=document.getElementById("deptAnalyticsGrid");
    grid.innerHTML="";
    if(!depts.length){grid.innerHTML=`<p style="color:#94a3b8">No data yet</p>`;return;}
    depts.forEach(dept=>{
        const ds=allStudents.filter(s=>s.department===dept);
        const advisorCount=allAdvisors.filter(a=>a.department===dept).length;
        const lcUsers=ds.filter(s=>s.leetcodeUsername).length;
        const ccUsers=ds.filter(s=>s.codechefUsername).length;
        const cfUsers=ds.filter(s=>s.codeforcesUsername).length;
        const avgSolved=ds.length?Math.round(ds.reduce((a,s)=>a+(s.totalSolved||0),0)/ds.length):0;
        const topStudent=ds.sort((a,b)=>(b.totalSolved||0)-(a.totalSolved||0))[0];
        const coverage=ds.length?Math.round(((lcUsers+ccUsers+cfUsers)/(ds.length*3))*100):0;
        grid.innerHTML+=`
        <div class="dept-card">
            <h3><span class="badge ${deptBadge(dept)}">${dept}</span></h3>
            <div class="dept-stat"><span>Total Students</span><span>${ds.length}</span></div>
            <div class="dept-stat"><span>Advisors</span><span>${advisorCount}</span></div>
            <div class="dept-stat"><span>LeetCode Users</span><span>${lcUsers}</span></div>
            <div class="dept-stat"><span>CodeChef Users</span><span>${ccUsers}</span></div>
            <div class="dept-stat"><span>Codeforces Users</span><span>${cfUsers}</span></div>
            <div class="dept-stat"><span>Avg Total Solved</span><span>${avgSolved}</span></div>
            <div class="dept-stat"><span>Platform Coverage</span><span>${coverage}%</span></div>
            <div class="dept-stat"><span>Top Student</span><span>${topStudent?topStudent.name:"-"}</span></div>
            <div class="dept-actions">
                <button class="btn btn-purple btn-sm" style="flex:1" onclick="refreshDept('${dept}')">🔄 Refresh ${dept}</button>
                <button class="btn btn-primary btn-sm" style="flex:1" onclick="exportDept('${dept}')">📥 Export</button>
            </div>
        </div>`;
    });
}

function refreshDept(dept) {
    showToast("🔄 Refreshing "+dept+" students...", "#7c3aed");
    fetch(STUDENTS+"/refresh/department/"+encodeURIComponent(dept),{method:"POST",headers:authHeaders()})
    .then(res=>res.json())
    .then(()=>{loadStudents();renderDeptAnalytics();showToast("✅ "+dept+" refreshed!","#16a34a");})
    .catch(()=>showToast("❌ Refresh failed","#ef4444"));
}

function exportDept(dept) {
    fetch(STUDENTS+"/export/department/"+encodeURIComponent(dept),{headers:authHeaders()})
    .then(res=>res.blob())
    .then(blob=>{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="students_"+dept+".xlsx";a.click();URL.revokeObjectURL(url);});
}

/* ══════════════════════════════════════
   EXPORT MODAL
══════════════════════════════════════ */

function openExportModal(){document.getElementById("exportModal").classList.add("active");initDragDrop();}
function closeExportModal(){document.getElementById("exportModal").classList.remove("active");}

function toggleSelectAll(){
    const cbs=document.querySelectorAll("#sortableColumns .column-card input");
    const btn=document.querySelector(".sel-all-btn");
    const all=[...cbs].every(cb=>cb.checked);
    cbs.forEach(cb=>cb.checked=!all);
    btn.innerText=all?"Select All":"Deselect All";
}

function exportCustomExcel(){
    const cols=[];
    document.querySelectorAll("#sortableColumns .column-card input").forEach(cb=>{if(cb.checked)cols.push(cb.value);});
    if(!cols.length){alert("Select at least one column");return;}
    const query=cols.map(c=>"columns="+encodeURIComponent(c)).join("&");
    fetch(STUDENTS+"/export/custom?"+query,{headers:authHeaders()})
    .then(res=>res.blob())
    .then(blob=>{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="students_custom.xlsx";a.click();URL.revokeObjectURL(url);closeExportModal();});
}

function initDragDrop(){
    const sortable=document.getElementById("sortableColumns");
    let draggedItem=null;
    document.querySelectorAll(".column-card").forEach(card=>{
        card.addEventListener("dragstart",()=>{draggedItem=card;card.classList.add("dragging");});
        card.addEventListener("dragend",()=>{card.classList.remove("dragging");});
        card.addEventListener("dragover",e=>{
            e.preventDefault();
            const after=getDragAfter(sortable,e.clientY);
            after==null?sortable.appendChild(draggedItem):sortable.insertBefore(draggedItem,after);
        });
    });
}

function getDragAfter(container,y){
    return [...container.querySelectorAll(".column-card:not(.dragging)")].reduce((closest,child)=>{
        const box=child.getBoundingClientRect();
        const offset=y-box.top-box.height/2;
        return offset<0&&offset>closest.offset?{offset,element:child}:closest;
    },{offset:Number.NEGATIVE_INFINITY}).element;
}

/* ══ HELPERS ══ */
function deptBadge(dept){return{"ECE":"badge-ece","CSE":"badge-cse","MECH":"badge-mech","IT":"badge-it","EEE":"badge-eee"}[dept]||"badge-dept";}

window.onclick=function(e){
    if(e.target===document.getElementById("studentModal"))closeStudentModal();
    if(e.target===document.getElementById("advisorModal"))closeAdvisorModal();
    if(e.target===document.getElementById("exportModal"))closeExportModal();
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
        fetch(BASE_URL +"/contests/codeforces",
            { headers: authHeaders() }).then(r => r.json()),
        fetch(BASE_URL +"/contests/leetcode",
            { headers: authHeaders() }).then(r => r.json()),
        fetch(BASE_URL +"/contests/codechef",
            { headers: authHeaders() }).then(r => r.json())
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
    // Find the most recent timestamp across all students per platform
    const latest = (arr) => arr.filter(Boolean).sort().pop() || "Not refreshed";

    const lcTimes  = data.map(s => s.leetcodeLastUpdated);
    const ccTimes  = data.map(s => s.codechefLastUpdated);
    const cfTimes  = data.map(s => s.codeforcesLastUpdated);

    const lcEl = document.getElementById("stripLC");
    const ccEl = document.getElementById("stripCC");
    const cfEl = document.getElementById("stripCF");

    if (lcEl) lcEl.innerText = "🟡 LeetCode: " + latest(lcTimes);
    if (ccEl) ccEl.innerText = "⭐ CodeChef: " + latest(ccTimes);
    if (cfEl) cfEl.innerText = "🔵 Codeforces: " + latest(cfTimes);
}

// ══════════════════════════════════════
// CREATE ADVISOR ACCOUNT
// ══════════════════════════════════════
function openCreateAdvisorModal() {
    document.getElementById("createAdvisorModal")
        .classList.add("active");
    document.getElementById("createAdvisorMsg")
        .innerText = "";
}

function closeCreateAdvisorModal() {
    document.getElementById("createAdvisorModal")
        .classList.remove("active");
    ["caName","caEmail","caPassword",
     "caSection","caDesignation","caPhone"]
        .forEach(id => {
            document.getElementById(id).value = "";
        });
    document.getElementById("caDept").value = "";
}

function createAdvisorAccount() {
    const msg = document.getElementById(
        "createAdvisorMsg");
    const name  = document.getElementById("caName").value.trim();
    const email = document.getElementById("caEmail").value.trim();
    const pass  = document.getElementById("caPassword").value.trim();
    const dept  = document.getElementById("caDept").value;

    if (!name || !email || !pass || !dept) {
        msg.style.color = "red";
        msg.innerText = "Name, Email, Password and Department required";
        return;
    }

    msg.style.color = "#64748b";
    msg.innerText = "Creating account...";

    fetch(BASE_URL + "/auth/admin/create-advisor", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            name,
            email,
            password: pass,
            department: dept,
            section: document.getElementById(
                "caSection").value.trim(),
            designation: document.getElementById(
                "caDesignation").value.trim(),
            phoneNumber: document.getElementById(
                "caPhone").value.trim()
        })
    })
    .then(r => {
        if (!r.ok) throw new Error(
            "Failed to create advisor");
        return r.text();
    })
    .then(() => {
        closeCreateAdvisorModal();
        loadAdvisors();
        showToast("✅ Advisor account created!", "#16a34a");
    })
    .catch(err => {
        msg.style.color = "red";
        msg.innerText = err.message;
    });
}

// Close modal on outside click
window.onclick = function(e) {
    if (e.target === document.getElementById(
            "createAdvisorModal"))
        closeCreateAdvisorModal();
    // ... keep existing onclick logic
};