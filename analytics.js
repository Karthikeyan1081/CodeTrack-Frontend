const API_URL = "https://ingenious-laughter-production-dd87.up.railway.app/students";

let leetcodeData = emptyData();
let codechefData = emptyData();
let codeforcesData = emptyData();

let currentStudent = null;

// ==========================================
// AUTH HEADER
// ==========================================

function authHeaders() {

    const token =
        localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}

// ==========================================
// WINDOW LOAD
// ==========================================

window.onload = function () {

    if (!localStorage.getItem("token")) {

        window.location.href = "/loginnew.html";

        return;
    }

    loadAnalytics();
};

// ==========================================
// LOAD ANALYTICS
// ==========================================

function loadAnalytics() {

    const params =
        new URLSearchParams(window.location.search);

    // FIX: read "register" param instead of "id"

    const registerNumber =
        params.get("register");

    console.log("Register Number:", registerNumber);

    if (!registerNumber) {

        alert("Student ID missing");

        return;
    }

    // FIX: call /register/{registerNumber} with auth header

    fetch(`${API_URL}/register/${registerNumber}`, {

        headers: authHeaders()
    })

    .then(response => {

        if (response.status === 401 ||
            response.status === 403) {

            window.location.href =
                "/loginnew.html";

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Student not found"
            );
        }

        return response.json();
    })

    .then(student => {

        if (!student) return;

        console.log(student);

        currentStudent = student;

        // ==========================================
        // PROFILE
        // ==========================================

        document.getElementById("name").innerText =
            student.name || "-";

        document.getElementById("reg").innerText =
            student.registerNumber || "-";

        document.getElementById("dept").innerText =
            student.department || "-";

        document.getElementById("sec").innerText =
            student.section || "-";

        // ==========================================
        // LOAD PLATFORM DATA
        // ==========================================

        loadLeetCode(
            student.leetcodeUsername
        );

        loadCodeChef(
            student.codechefUsername
        );

        loadCodeforces(
            student.codeforcesUsername
        );
    })

    .catch(error => {

        console.error(error);

        alert(error.message);
    });
}

// ==========================================
// LEETCODE
// ==========================================

function loadLeetCode(username) {

    setLoading("lc");

    if (!username) {

        fillLeetCode(emptyData());

        return;
    }

    fetch(`https://ingenious-laughter-production-dd87.up.railway.app/leetcode/${username}`, {

        headers: authHeaders()
    })

        .then(response => response.json())

        .then(data => {

            console.log("LeetCode:", data);

            leetcodeData = data;

            fillLeetCode(data);

            refreshSummary();
        })

        .catch(error => {

            console.error(
                "LeetCode error:",
                error
            );

            leetcodeData = emptyData();

            fillLeetCode(emptyData());

            refreshSummary();
        });
}

// ==========================================
// CODECHEF
// ==========================================

function loadCodeChef(username) {

    setLoading("cc");

    if (!username) {

        fillCodeChef(emptyData());

        return;
    }

    fetch(`https://ingenious-laughter-production-dd87.up.railway.app/codechef/${username}`, {

        headers: authHeaders()
    })

        .then(response => response.json())

        .then(data => {

            console.log("CodeChef:", data);

            codechefData = data;

            fillCodeChef(data);

            refreshSummary();
        })

        .catch(error => {

            console.error(
                "CodeChef error:",
                error
            );

            codechefData = emptyData();

            fillCodeChef(emptyData());

            refreshSummary();
        });
}

// ==========================================
// CODEFORCES
// ==========================================

function loadCodeforces(username) {

    setLoading("cf");

    if (!username) {

        fillCodeforces(emptyData());

        return;
    }

    fetch(`https://ingenious-laughter-production-dd87.up.railway.app/codeforces/${username}`, {

        headers: authHeaders()
    })

        .then(response => response.json())

        .then(data => {

            console.log("Codeforces:", data);

            codeforcesData = data;

            fillCodeforces(data);

            refreshSummary();
        })

        .catch(error => {

            console.error(
                "Codeforces error:",
                error
            );

            codeforcesData = emptyData();

            fillCodeforces(emptyData());

            refreshSummary();
        });
}

// ==========================================
// FILL LEETCODE
// ==========================================

function fillLeetCode(data) {
    document.getElementById("lcEasy").innerText   = data.easySolved   || "-";
    document.getElementById("lcMedium").innerText = data.mediumSolved || "-";
    document.getElementById("lcHard").innerText   = data.hardSolved   || "-";
    document.getElementById("lcSolved").innerText  = data.totalSolved      || "0";
    document.getElementById("lcCurrent").innerText = data.currentRating    || "0";
    document.getElementById("lcHighest").innerText = data.highestRating    || "0";
    document.getElementById("lcRank").innerText    = data.globalRank       || "N/A";
    document.getElementById("lcContest").innerText = data.contestsAttended || "0";
    document.getElementById("lcActive").innerText  = data.lastActive       || "N/A";
}

// ==========================================
// FILL CODECHEF
// ==========================================

function fillCodeChef(data) {
    document.getElementById("ccSolved").innerText      = data.totalSolved      || "0";
    document.getElementById("ccCurrent").innerText     = data.currentRating    || "0";
    document.getElementById("ccHighest").innerText     = data.highestRating    || "0";
    document.getElementById("ccRank").innerText        = data.globalRank       || "N/A";
    document.getElementById("ccCountryRank").innerText = data.countryRank      || "N/A";
    document.getElementById("ccContest").innerText     = data.contestsAttended || "0";
    document.getElementById("ccActive").innerText      = data.lastActive       || "N/A";
}

// ==========================================
// FILL CODEFORCES
// ==========================================

function fillCodeforces(data) {

    document.getElementById("cfSolved").innerText =
        data.totalSolved || "0";

    document.getElementById("cfCurrent").innerText =
        data.currentRating || "0";

    document.getElementById("cfHighest").innerText =
        data.highestRating || "0";

    document.getElementById("cfRank").innerText =
        data.globalRank || "N/A";

    document.getElementById("cfContest").innerText =
        data.contestsAttended || "0";

    document.getElementById("cfActive").innerText =
        data.lastActive || "N/A";
}

// ==========================================
// SUMMARY
// ==========================================

function refreshSummary() {

    updateOverallSummary(
        leetcodeData,
        codechefData,
        codeforcesData
    );
}

function updateOverallSummary(lc, cc, cf) {

    const lcSolved =
        parseInt(lc.totalSolved) || 0;

    const ccSolved =
        parseInt(cc.totalSolved) || 0;

    const cfSolved =
        parseInt(cf.totalSolved) || 0;

    const totalSolved =
        lcSolved + ccSolved + cfSolved;

    const lcContest =
        parseInt(lc.contestsAttended) || 0;

    const ccContest =
        parseInt(cc.contestsAttended) || 0;

    const cfContest =
        parseInt(cf.contestsAttended) || 0;

    const totalContest =
        lcContest + ccContest + cfContest;

    document.getElementById("overallSolved")
        .innerText = totalSolved;

    document.getElementById("overallContest")
        .innerText = totalContest;

    const ratings = [

        parseInt(lc.currentRating) || 0,

        parseInt(cc.currentRating) || 0,

        parseInt(cf.currentRating) || 0
    ];

    document.getElementById("highestRating")
        .innerText =
        Math.max(...ratings);

    const platforms = [

        {
            name: "LeetCode",
            solved: lcSolved
        },

        {
            name: "CodeChef",
            solved: ccSolved
        },

        {
            name: "Codeforces",
            solved: cfSolved
        }
    ];

    platforms.sort(
        (a, b) => b.solved - a.solved
    );

    document.getElementById("bestPlatform")
        .innerText =
        platforms[0].name;
}

// ==========================================
// LOADING
// ==========================================

function setLoading(prefix) {
    const ids = [prefix+"Solved", prefix+"Current", prefix+"Highest",
                 prefix+"Rank", prefix+"Contest", prefix+"Active"];
    if (prefix === "lc") ids.push("lcEasy", "lcMedium", "lcHard");
    if (prefix === "cc") ids.push("ccCountryRank");
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = "Loading...";
    });
}

// ==========================================
// EMPTY DATA
// ==========================================

function emptyData() {

    return {

        totalSolved: "0",

        currentRating: "0",

        highestRating: "0",

        globalRank: "N/A",

        contestsAttended: "0",

        lastActive: "N/A"
    };
}

// ==========================================
// OPEN PROFILE
// ==========================================

function openProfile(platform) {

    if (!currentStudent) {

        alert("Student data not loaded");

        return;
    }

    let username = "";
    let url = "";

    if (platform === "leetcode") {

        username =
            currentStudent.leetcodeUsername;

        if (!username) {

            alert("LeetCode username not available");

            return;
        }

        url =
            "https://leetcode.com/" +
            username;
    }

    else if (platform === "codechef") {

        username =
            currentStudent.codechefUsername;

        if (!username) {

            alert("CodeChef username not available");

            return;
        }

        url =
            "https://www.codechef.com/users/" +
            username;
    }

    else if (platform === "codeforces") {

        username =
            currentStudent.codeforcesUsername;

        if (!username) {

            alert("Codeforces username not available");

            return;
        }

        url =
            "https://codeforces.com/profile/" +
            username;
    }

    window.open(url, "_blank");
}