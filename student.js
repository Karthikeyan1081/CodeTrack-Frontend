const BASE_URL = "https://ingenious-laughter-production-dd87.up.railway.app";
const API    = BASE_URL + "/students";
const GH_API = BASE_URL + "/github";
const LC_API = BASE_URL + "/leetcode";
const CC_API = BASE_URL + "/codechef";
const CF_API = BASE_URL + "/codeforces";

let studentData = null;

/* ── AUTH ── */
function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
    };
}

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
window.onload = function () {
    if (!localStorage.getItem("token")) {
        window.location.href = "/index.html"; return;
    }
    loadStudent();
};

function logout() {
    localStorage.clear();
    window.location.href = "/index.html";
}

/* ══════════════════════════════════════
   SIDEBAR NAV
══════════════════════════════════════ */
function showTab(tab, el) {
    document.querySelectorAll(".tab-section")
        .forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".nav-item")
        .forEach(b => b.classList.remove("active"));
    document.getElementById("tab-" + tab).classList.add("active");
    if (el) el.classList.add("active");

    if (tab === "settings" && studentData) loadSettingsForm();
    if (tab === "github"   && studentData) renderGitHubFull(studentData.githubUsername);
    if (tab === "links"    && studentData) renderLinks();
    if (tab === "contests") loadContests();
}

/* ══════════════════════════════════════
   LOAD STUDENT
══════════════════════════════════════ */
function loadStudent() {
    const register = new URLSearchParams(
        window.location.search
    ).get("register");

    if (!register) {
        alert("Register Number Missing"); return;
    }

    fetch(`${API}/register/${register}`, {
        headers: authHeaders()
    })
    .then(res => {
        if (res.status === 401 || res.status === 403) {
            window.location.href = "/index.html";
            return;
        }
        return res.json();
    })
    .then(s => {
        if (!s) return;
        studentData = s;
        populateProfile(s);
        checkFirstLogin(s);
        loadAllPlatforms(s);
        renderGitHubQuick(s.githubUsername);

        // Poll if usernames exist but stats are still 0
        const hasUsernames = s.leetcodeUsername ||
                             s.codechefUsername  ||
                             s.codeforcesUsername;
        const statsEmpty = (s.totalSolved  || 0) === 0 &&
                           (s.highestRating|| 0) === 0;

        if (hasUsernames && statsEmpty) {
            pollUntilStatsReady(register);
        }
    });
}

/* ══════════════════════════════════════
   POPULATE PROFILE
══════════════════════════════════════ */
function populateProfile(s) {
    set("navName", s.name);
    set("navReg",  s.registerNumber);
    set("sidebarName", s.name);
    set("sidebarReg",  s.registerNumber);
    set("sideDept",    s.department);
    set("sideYear",    s.year);
    set("sideSection", s.section);
    set("sideBatch",   s.batch || "-");

    const dr = s.departmentRank;
    const cr = s.collegeRank;
    set("sidebarDeptRank",    "Dept: "    + (dr ? rankLabel(dr) : "-"));
    set("sidebarCollegeRank", "College: " + (cr ? rankLabel(cr) : "-"));
    set("deptRank",    dr ? rankLabel(dr) : "-");
    set("collegeRank", cr ? rankLabel(cr) : "-");
    set("totalSolved",   s.totalSolved   || 0);
    set("totalContests", s.totalContests || 0);
    set("highestRating", s.highestRating || 0);
    set("bestPlatform",  "-");

    set("lcUser",   s.leetcodeUsername   || "Not Set");
    set("ccUser",   s.codechefUsername   || "Not Set");
    set("cfUser",   s.codeforcesUsername || "Not Set");
    set("ovLcUser", s.leetcodeUsername   || "-");
    set("ovCcUser", s.codechefUsername   || "-");
    set("ovCfUser", s.codeforcesUsername || "-");

    set("lcLastUpdated", s.leetcodeRatingUpdatedAt   || "Not refreshed");
    set("ccLastUpdated", s.codechefRatingUpdatedAt   || "Not refreshed");
    set("cfLastUpdated", s.codeforcesRatingUpdatedAt || "Not refreshed");
}

function rankLabel(r) {
    return r === 1 ? "🥇 1st" :
           r === 2 ? "🥈 2nd" :
           r === 3 ? "🥉 3rd" :
           "#" + r;
}

/* ══════════════════════════════════════
   FIRST LOGIN CHECK
══════════════════════════════════════ */
function checkFirstLogin(s) {
    if (!s.leetcodeUsername && !s.codechefUsername &&
        !s.codeforcesUsername && !s.githubUsername) {
        document.getElementById("firstLoginModal")
            .classList.add("active");
    }
}

function skipFirstLogin() {
    document.getElementById("firstLoginModal")
        .classList.remove("active");
}

function saveFirstLoginProfile() {
    const lc = val("modalLeetcode");
    const cc = val("modalCodechef");
    const cf = val("modalCodeforces");
    const gh = val("modalGithub");
    const msg = document.getElementById("modalMsg");

    if (!lc && !cc && !cf && !gh) {
        msg.style.color = "red";
        msg.innerText = "Enter at least one username";
        return;
    }

    const updated = {
        ...studentData,
        leetcodeUsername:   lc || studentData.leetcodeUsername,
        codechefUsername:   cc || studentData.codechefUsername,
        codeforcesUsername: cf || studentData.codeforcesUsername,
        githubUsername:     gh || studentData.githubUsername
    };

    msg.style.color = "#64748b";
    msg.innerText = "Saving...";

    fetch(`${API}/update/${studentData.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(updated)
    })
    .then(r => r.json())
    .then(data => {
        studentData = data;
        populateProfile(data);
        document.getElementById("firstLoginModal")
            .classList.remove("active");
        loadAllPlatforms(data);
        renderGitHubQuick(data.githubUsername);
    })
    .catch(() => {
        msg.style.color = "red";
        msg.innerText = "Failed to save. Try again.";
    });
}

/* ══════════════════════════════════════
   LOAD ALL PLATFORMS
══════════════════════════════════════ */
function loadAllPlatforms(s) {
    loadLeetCode(s.leetcodeUsername);
    loadCodeChef(s.codechefUsername);
    loadCodeforces(s.codeforcesUsername);
}

function loadLeetCode(username) {
    if (!username) return;
    fetch(`${LC_API}/${username}`, { headers: authHeaders() })
    .then(r => r.json())
    .then(d => {
        set("ovLcSolved",   d.totalSolved       || "-");
        set("ovLcRating",   d.currentRating     || "-");
        set("ovLcContests", d.contestsAttended  || "-");
        set("ovLcRank",     d.globalRank        || "-");
        set("lcSolved",     d.totalSolved       || "-");
        set("lcRating",     d.currentRating     || "-");
        set("lcHighest",    d.highestRating     || "-");
        set("lcRank",       d.globalRank        || "-");
        set("lcContest",    d.contestsAttended  || "-");
        set("lcEasy",   studentData.leetcodeEasySolved   || "-");
        set("lcMedium", studentData.leetcodeMediumSolved || "-");
        set("lcHard",   studentData.leetcodeHardSolved   || "-");
        updateBestPlatform();
    })
    .catch(() => {});
}

function loadCodeChef(username) {
    if (!username) return;
    fetch(`${CC_API}/${username}`, { headers: authHeaders() })
    .then(r => r.json())
    .then(d => {
        set("ovCcRating",   d.currentRating    || "-");
        set("ovCcStars",    d.stars            || "-");
        set("ovCcContests", d.contestsAttended || "-");
        set("ovCcRank",     d.globalRank       || "-");
        set("ccRating",     d.currentRating    || "-");
        set("ccHighest",    d.highestRating    || "-");
        set("ccStars",      d.stars            || "-");
        set("ccRank",       d.globalRank       || "-");
        set("ccCountry",    d.countryRank      || "-");
        set("ccDivision",   d.division         || "-");
        set("ccContest",    d.contestsAttended || "-");
        set("ccSolved",     d.totalSolved      || "-");
        updateBestPlatform();
    })
    .catch(() => {});
}

function loadCodeforces(username) {
    if (!username) return;
    fetch(`${CF_API}/${username}`, { headers: authHeaders() })
    .then(r => r.json())
    .then(d => {
        set("ovCfRating",   d.currentRating    || "-");
        set("ovCfMax",      d.highestRating    || "-");
        set("ovCfContests", d.contestsAttended || "-");
        set("ovCfSolved",   d.totalSolved      || "-");
        set("cfRating",     d.currentRating    || "-");
        set("cfMax",        d.highestRating    || "-");
        set("cfRank",       d.globalRank       || "-");
        set("cfMaxRank",    d.globalRank       || "-");
        set("cfSolved",     d.totalSolved      || "-");
        set("cfContest",    d.contestsAttended || "-");
        set("cfLevel",      "-");
        set("cfActive",     d.lastActive       || "-");
        updateBestPlatform();
    })
    .catch(() => {});
}

function updateBestPlatform() {
    const platforms = [
        { name:"LeetCode",   v: parseInt(document.getElementById("lcSolved")?.innerText) || 0 },
        { name:"CodeChef",   v: parseInt(document.getElementById("ccSolved")?.innerText) || 0 },
        { name:"Codeforces", v: parseInt(document.getElementById("cfSolved")?.innerText) || 0 }
    ];
    platforms.sort((a, b) => b.v - a.v);
    set("bestPlatform", platforms[0].name);
}

/* ══════════════════════════════════════
   GITHUB — QUICK (overview tab)
══════════════════════════════════════ */
function renderGitHubQuick(username) {
    const el = document.getElementById("ghQuickCard");
    if (!username) {
        el.innerHTML = `<div class="gh-not-set">
            GitHub username not set.
            <a href="#" onclick="showTab('settings',document.querySelectorAll('.nav-item')[5])" style="color:#2563eb">Add it in Settings →</a>
        </div>`;
        return;
    }
    el.innerHTML = `<div class="gh-loading"><span class="spinner"></span> Loading GitHub stats...</div>`;
    fetch(`${GH_API}/${username}`, { headers: authHeaders() })
    .then(r => r.json())
    .then(d => { el.innerHTML = buildGhCard(d, false); })
    .catch(() => { el.innerHTML = `<div class="gh-not-set">Failed to load GitHub stats</div>`; });
}

/* ══════════════════════════════════════
   GITHUB — FULL (github tab)
══════════════════════════════════════ */
function renderGitHubFull(username) {
    const el = document.getElementById("githubFullCard");
    if (!username) {
        el.innerHTML = `<div class="gh-not-set" style="padding:40px">
            <div style="font-size:40px;margin-bottom:12px">🐙</div>
            <div style="font-size:15px;color:#374151;font-weight:600;margin-bottom:8px">GitHub username not set</div>
            <div style="font-size:13px;color:#94a3b8;margin-bottom:16px">GitHub is mandatory. Please add it in Settings.</div>
            <button onclick="showTab('settings',document.querySelectorAll('.nav-item')[5])"
                style="padding:10px 20px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600">
                Go to Settings →
            </button>
        </div>`;
        return;
    }
    el.innerHTML = `<div class="gh-loading" style="padding:30px"><span class="spinner"></span> Loading GitHub profile...</div>`;
    fetch(`${GH_API}/${username}`, { headers: authHeaders() })
    .then(r => r.json())
    .then(d => { el.innerHTML = buildGhCard(d, true); })
    .catch(() => { el.innerHTML = `<div class="gh-not-set">Failed to load GitHub data</div>`; });
}

function buildGhCard(d, full) {
    const avatar = d.avatarUrl && d.avatarUrl !== "-"
        ? d.avatarUrl
        : "https://github.com/identicons/" + d.username + ".png";

    return `
    <div class="github-card">
        <div class="gh-header">
            <img src="${avatar}" class="gh-avatar"
                 onerror="this.src='https://cdn-icons-png.flaticon.com/512/25/25231.png'">
            <div class="gh-meta">
                <h3>${d.name && d.name !== "-" ? d.name : d.username}</h3>
                <p>@${d.username}${d.location && d.location !== "-" ? " · 📍 " + d.location : ""}</p>
                ${d.bio && d.bio !== "-" ? `<p style="margin-top:4px;color:#64748b;font-size:12px">${d.bio}</p>` : ""}
            </div>
            <a href="${d.profileUrl}" target="_blank" style="margin-left:auto">
                <button class="gh-btn">View GitHub →</button>
            </a>
        </div>
        <div class="gh-stats-grid">
            <div class="gh-stat"><div class="num">${d.publicRepos||0}</div><div class="lbl">Repositories</div></div>
            <div class="gh-stat"><div class="num">${d.totalStars||0}</div><div class="lbl">Total Stars ⭐</div></div>
            <div class="gh-stat"><div class="num">${d.followers||0}</div><div class="lbl">Followers</div></div>
            <div class="gh-stat"><div class="num">${d.totalCommits||0}</div><div class="lbl">Recent Commits</div></div>
        </div>
        ${full ? `
        <div class="gh-details">
            ${d.topLanguage && d.topLanguage !== "-" ? `<div class="gh-detail-item">💬 Top Language: <span class="lang-badge">${d.topLanguage}</span></div>` : ""}
            ${d.totalForks ? `<div class="gh-detail-item">🍴 ${d.totalForks} Forks</div>` : ""}
            ${d.following  ? `<div class="gh-detail-item">👣 Following ${d.following}</div>` : ""}
            ${d.company && d.company !== "-" ? `<div class="gh-detail-item">🏢 ${d.company}</div>` : ""}
            ${d.blog && d.blog !== "-" ? `<div class="gh-detail-item">🌐 <a href="${d.blog}" target="_blank" style="color:#2563eb">${d.blog}</a></div>` : ""}
            ${d.createdAt && d.createdAt !== "-" ? `<div class="gh-detail-item">📅 Joined ${d.createdAt.substring(0,10)}</div>` : ""}
        </div>` : ""}
    </div>`;
}

/* ══════════════════════════════════════
   LINKS TAB
══════════════════════════════════════ */
function renderLinks() {
    const s = studentData;
    const links = [
        { icon:"🟡", name:"LeetCode",      val:s.leetcodeUsername,      url: s.leetcodeUsername      ? "https://leetcode.com/"+s.leetcodeUsername : null },
        { icon:"⭐", name:"CodeChef",      val:s.codechefUsername,      url: s.codechefUsername      ? "https://www.codechef.com/users/"+s.codechefUsername : null },
        { icon:"🔵", name:"Codeforces",    val:s.codeforcesUsername,    url: s.codeforcesUsername    ? "https://codeforces.com/profile/"+s.codeforcesUsername : null },
        { icon:"🐙", name:"GitHub",        val:s.githubUsername,        url: s.githubUsername        ? "https://github.com/"+s.githubUsername : null, mandatory:true },
        { icon:"🟢", name:"HackerRank",    val:s.hackerrankUsername,    url: s.hackerrankUsername    ? "https://www.hackerrank.com/profile/"+s.hackerrankUsername : null },
        { icon:"🟩", name:"GeeksforGeeks", val:s.geeksforgeeksUsername, url: s.geeksforgeeksUsername ? "https://www.geeksforgeeks.org/user/"+s.geeksforgeeksUsername : null },
        { icon:"💼", name:"LinkedIn",      val:s.linkedinUrl,           url: s.linkedinUrl },
        { icon:"🌐", name:"Portfolio",     val:s.portfolioUrl,          url: s.portfolioUrl }
    ];

    const grid = document.getElementById("linksGrid");
    grid.innerHTML = "";
    links.forEach(link => {
        const isSet = link.val && link.val !== "-";
        grid.innerHTML += `
        <${isSet && link.url ? `a href="${link.url}" target="_blank"` : "div"}
            class="link-card"
            style="${!isSet ? "opacity:0.5;cursor:default;" : ""}"
        >
            <div class="link-icon">${link.icon}</div>
            <div class="link-info">
                <div class="link-name">
                    ${link.name}
                    ${link.mandatory ? '<span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:4px;font-size:10px;margin-left:4px">Required</span>' : ""}
                </div>
                <div class="link-val">${isSet ? link.val : "Not set — add in Settings"}</div>
            </div>
            ${isSet ? '<div class="link-arrow">→</div>' : ""}
        </${isSet && link.url ? "a" : "div"}>`;
    });
}

/* ══════════════════════════════════════
   OPEN PROFILE
══════════════════════════════════════ */
function openProfile(platform) {
    if (!studentData) return;
    const map = {
        leetcode:   ["leetcodeUsername",   "https://leetcode.com/"],
        codechef:   ["codechefUsername",   "https://www.codechef.com/users/"],
        codeforces: ["codeforcesUsername", "https://codeforces.com/profile/"]
    };
    const [field, base] = map[platform];
    const username = studentData[field];
    if (!username) { alert(platform + " username not set"); return; }
    window.open(base + username, "_blank");
}

/* ══════════════════════════════════════
   SETTINGS
══════════════════════════════════════ */
function loadSettingsForm() {
    const s = studentData;
    setVal("updateName",       s.name);
    setVal("updateEmail",      s.email);
    setVal("updatePhone",      s.phoneNumber);
    setVal("updateBatch",      s.batch);
    setVal("updateLeetcode",   s.leetcodeUsername);
    setVal("updateCodechef",   s.codechefUsername);
    setVal("updateCodeforces", s.codeforcesUsername);
    setVal("updateHackerrank", s.hackerrankUsername);
    setVal("updateGFG",        s.geeksforgeeksUsername);
    setVal("updateGithub",     s.githubUsername);
    setVal("updateLinkedin",   s.linkedinUrl);
    setVal("updatePortfolio",  s.portfolioUrl);
}

function saveSettings() {
    const msg = document.getElementById("settingsMsg");
    const updated = {
        ...studentData,
        name:                  val("updateName"),
        email:                 val("updateEmail"),
        phoneNumber:           val("updatePhone"),
        batch:                 val("updateBatch"),
        leetcodeUsername:      val("updateLeetcode"),
        codechefUsername:      val("updateCodechef"),
        codeforcesUsername:    val("updateCodeforces"),
        hackerrankUsername:    val("updateHackerrank"),
        geeksforgeeksUsername: val("updateGFG"),
        githubUsername:        val("updateGithub"),
        linkedinUrl:           val("updateLinkedin"),
        portfolioUrl:          val("updatePortfolio")
    };

    msg.style.color = "#64748b";
    msg.innerText = "Saving...";

    fetch(`${API}/update/${studentData.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(updated)
    })
    .then(r => r.json())
    .then(data => {
        studentData = data;
        populateProfile(data);
        loadAllPlatforms(data);
        renderGitHubQuick(data.githubUsername);
        msg.style.color = "#16a34a";
        msg.innerText = "✅ Profile updated successfully!";
        setTimeout(() => msg.innerText = "", 3000);
    })
    .catch(() => {
        msg.style.color = "red";
        msg.innerText = "Failed to save. Try again.";
    });
}

/* ══════════════════════════════════════
   CONTESTS  (single definition)
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

function contestCard(cls, platform, name, timeHtml, link, isUpcoming) {
    const btnCls = isUpcoming ? "" : "grey";
    const btnTxt = isUpcoming ? "Register →" : "View →";
    return `
    <div class="contest-card ${cls}">
        <span class="contest-platform">${platform}</span>
        <div style="flex:1">
            <div class="contest-name">${name}</div>
            <div class="contest-time">${timeHtml}</div>
        </div>
        <a href="${link}" target="_blank" class="contest-link ${btnCls}">${btnTxt}</a>
    </div>`;
}

function fetchUpcoming() {
    const el = document.getElementById("upcomingContests");
    if (!el) return;
    el.innerHTML = `<div style="color:#94a3b8;font-size:13px">Loading...</div>`;

    Promise.all([
        fetch(BASE_URL +"/contests/codeforces", { headers: authHeaders() }).then(r => r.json()),
        fetch(BASE_URL +"/contests/leetcode",   { headers: authHeaders() }).then(r => r.json()),
        fetch(BASE_URL +"/contests/codechef",   { headers: authHeaders() }).then(r => r.json())
    ])
    .then(([cf, lc, cc]) => {
        let cards = [];
        (cf.upcoming||[]).forEach(c => { cards.push({ ts: c.startTimeSeconds, html: contestCard("cf","🔵 Codeforces",c.name,`🕐 Start: ${toIST(c.startTimeSeconds)}<br>🏁 End: ${toIST(c.startTimeSeconds+c.durationSeconds)} &nbsp; ⏱ ${durFromSec(c.durationSeconds)}`,`https://codeforces.com/contest/${c.id}`,true) }); });
        (lc.upcoming||[]).forEach(c => { cards.push({ ts: c.startTime, html: contestCard("lc","🟡 LeetCode",c.title,`🕐 Start: ${toIST(c.startTime)}<br>🏁 End: ${toIST(c.startTime+c.duration)} &nbsp; ⏱ ${durFromSec(c.duration)}`,`https://leetcode.com/contest/${c.titleSlug}`,true) }); });
        (cc.upcoming||[]).forEach(c => { cards.push({ ts: new Date(c.contest_start_date_iso).getTime()/1000, html: contestCard("cc","⭐ CodeChef",c.contest_name,`🕐 Start: ${isoToIST(c.contest_start_date_iso)}<br>🏁 End: ${isoToIST(c.contest_end_date_iso)} &nbsp; ⏱ ${durStr(c.contest_duration)}`,`https://www.codechef.com/${c.contest_code}`,true) }); });
        cards.sort((a,b) => a.ts - b.ts);
        el.innerHTML = cards.length
            ? cards.map(c => c.html).join("")
            : `<div style="color:#94a3b8;font-size:13px">No upcoming contests found</div>`;
    })
    .catch(() => { el.innerHTML = `<div style="color:#ef4444;font-size:13px">Failed to load upcoming contests</div>`; });
}

function fetchPast() {
    const el = document.getElementById("pastContests");
    if (!el) return;
    el.innerHTML = `<div style="color:#94a3b8;font-size:13px">Loading...</div>`;

    Promise.all([
        fetch(BASE_URL +"/contests/codeforces", { headers: authHeaders() }).then(r => r.json()),
        fetch(BASE_URL +"/contests/leetcode",   { headers: authHeaders() }).then(r => r.json()),
        fetch(BASE_URL +"/contests/codechef",   { headers: authHeaders() }).then(r => r.json())
    ])
    .then(([cf, lc, cc]) => {
        let cards = [];
        (cf.past||[]).forEach(c => { cards.push({ ts: c.startTimeSeconds, html: contestCard("past-card","🔵 Codeforces",c.name,`🕐 Started: ${toIST(c.startTimeSeconds)}<br>✅ Ended: ${toIST(c.startTimeSeconds+c.durationSeconds)} &nbsp; ⏱ ${durFromSec(c.durationSeconds)}`,`https://codeforces.com/contest/${c.id}`,false) }); });
        (lc.past||[]).forEach(c => { cards.push({ ts: c.startTime, html: contestCard("past-card","🟡 LeetCode",c.title,`🕐 Started: ${toIST(c.startTime)}<br>✅ Ended: ${toIST(c.startTime+c.duration)} &nbsp; ⏱ ${durFromSec(c.duration)}`,`https://leetcode.com/contest/${c.titleSlug}`,false) }); });
        (cc.past||[]).forEach(c => { cards.push({ ts: new Date(c.contest_start_date_iso).getTime()/1000, html: contestCard("past-card","⭐ CodeChef",c.contest_name,`🕐 Started: ${isoToIST(c.contest_start_date_iso)}<br>✅ Ended: ${isoToIST(c.contest_end_date_iso)} &nbsp; ⏱ ${durStr(c.contest_duration)}`,`https://www.codechef.com/${c.contest_code}`,false) }); });
        cards.sort((a,b) => b.ts - a.ts);
        el.innerHTML = cards.slice(0,15).map(c => c.html).join("") ||
            `<div style="color:#94a3b8;font-size:13px">No recent contests found</div>`;
    })
    .catch(() => { el.innerHTML = `<div style="color:#ef4444;font-size:13px">Failed to load recent contests</div>`; });
}

/* ══════════════════════════════════════
   POLL UNTIL STATS READY
══════════════════════════════════════ */
function pollUntilStatsReady(register, attempts = 0) {
    if (attempts > 10) return;
    setTimeout(() => {
        fetch(`${API}/register/${register}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(s => {
            if (!s) return;
            if ((s.totalSolved || 0) > 0 || (s.highestRating || 0) > 0) {
                studentData = s;
                set("totalSolved",   s.totalSolved   || 0);
                set("totalContests", s.totalContests || 0);
                set("highestRating", s.highestRating || 0);
                const dr = s.departmentRank;
                const cr = s.collegeRank;
                set("deptRank",           dr ? rankLabel(dr) : "-");
                set("collegeRank",        cr ? rankLabel(cr) : "-");
                set("sidebarDeptRank",    "Dept: "    + (dr ? rankLabel(dr) : "-"));
                set("sidebarCollegeRank", "College: " + (cr ? rankLabel(cr) : "-"));
                set("lcLastUpdated", s.leetcodeRatingUpdatedAt   || "Not refreshed");
                set("ccLastUpdated", s.codechefRatingUpdatedAt   || "Not refreshed");
                set("cfLastUpdated", s.codeforcesRatingUpdatedAt || "Not refreshed");
            } else {
                pollUntilStatsReady(register, attempts + 1);
            }
        })
        .catch(() => {});
    }, 3000);
}

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function set(id, v) {
    const el = document.getElementById(id);
    if (el) el.innerText = (v == null || v === "") ? "-" : v;
}
function setVal(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = (v == null) ? "" : v;
}
function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}