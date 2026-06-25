const API = "https://ingenious-laughter-production-dd87.up.railway.app/auth";

/* =========================================
            LOGIN
========================================= */

function login() {

    const email =
        document.getElementById(
            "email"
        ).value.trim();

    const password =
        document.getElementById(
            "password"
        ).value.trim();

    const msg =
        document.getElementById(
            "msg"
        );

    const selectedRole =
        localStorage.getItem(
            "selectedRole"
        ) || "STUDENT";

    // ---------------- VALIDATION ----------------

    if (!email || !password) {

        msg.style.color = "red";

        msg.innerText =
            "Enter email and password";

        return;
    }

    // ---------------- API CALL ----------------

    fetch(API + "/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            email,
            password
        })
    })

    .then(async response => {

        const text =
            await response.text();

        if (!response.ok) {

            throw new Error(text);
        }

        return JSON.parse(text);
    })

    .then(data => {

        // ---------------- ROLE CHECK ----------------
        // ADMIN bypasses the toggle role check

        if (data.role !== "ADMIN") {

            if (
                selectedRole === "STUDENT" &&
                data.role !== "STUDENT"
            ) {

                throw new Error(
                    "Invalid Student Account"
                );
            }

            if (
                selectedRole === "ADVISOR" &&
                data.role !== "ADVISOR"
            ) {

                throw new Error(
                    "Invalid Advisor Account"
                );
            }
        }

        // ---------------- STORE DATA ----------------

        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "email",
            data.email
        );

        localStorage.setItem(
            "role",
            data.role
        );

        if(data.role === "STUDENT"){
            localStorage.setItem(
                "registerNumber",
                data.registerNumber
            );
        }

        if(data.role === "ADVISOR"){
            localStorage.setItem(
                "advisorId",
                data.advisorId
            );
        }

        localStorage.setItem(
            "department",
            data.department || ""
        );

        // ---------------- SUCCESS ----------------

        msg.style.color = "green";

        msg.innerText =
            "Login Successful";

        // ---------------- REDIRECT ----------------

        setTimeout(() => {

            // STUDENT

            if (data.role === "STUDENT") {

                window.location.href =
                    "/student-dashboard.html?register=" +
                    data.registerNumber;
            }

            // ADVISOR

            else if (
                data.role === "ADVISOR"
            ) {

                window.location.href =
                    "/advisor-dashboard.html";
            }

            // ADMIN

            else {

                window.location.href =
                    "/admin-dashboard.html";
            }

        }, 1000);
    })

    .catch(error => {

        msg.style.color = "red";

        msg.innerText =
            error.message;
    });
}

/* =========================================
            REGISTER
========================================= */

function register() {

    const name =
        document.getElementById(
            "name"
        ).value.trim();

    // DYNAMIC ID

    const userId =
        document.getElementById(
            "userId"
        ).value.trim();

    const email =
        document.getElementById(
            "email"
        ).value.trim();

    const department =
        document.getElementById(
            "department"
        ).value.trim();

    // SECTION OPTIONAL FOR ADVISOR

    const sectionElement =
        document.getElementById(
            "section"
        );

    const section =
        sectionElement
            ? sectionElement.value.trim()
            : "";

    // YEAR OPTIONAL

    const yearElement =
        document.getElementById(
            "year"
        );

    const year =
        yearElement
            ? yearElement.value.trim()
            : "";

    const password =
        document.getElementById(
            "password"
        ).value.trim();

    const role =
        document.getElementById(
            "role"
        ).value;

    const msg =
        document.getElementById(
            "msg"
        );

    // OPTIONAL PLATFORM FIELDS

    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    };

    const phoneNumber        = getValue("phoneNumber");
    const githubUsername     = getValue("githubUsername");
    const hackerrankUsername = getValue("hackerrankUsername");
    const geeksforgeeksUsername = getValue("geeksforgeeksUsername");
    const linkedinUrl        = getValue("linkedinUrl");
    const portfolioUrl       = getValue("portfolioUrl");
    const leetcodeUsername   = getValue("leetcodeUsername");
    const codechefUsername   = getValue("codechefUsername");
    const codeforcesUsername = getValue("codeforcesUsername");

    // VALIDATION

    if (
        !name ||
        !userId ||
        !email ||
        !department ||
        !password
    ) {

        msg.style.color = "red";

        msg.innerText =
            "Fill all required fields";

        return;
    }

    // API CALL

    fetch(API + "/register", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            name,

            // STUDENT uses registerNumber; ADVISOR uses advisorId field
            // Backend reads "registerNumber" for both — send userId under registerNumber

            registerNumber:
                role === "STUDENT"
                ? userId
                : "",

            advisorId:
                role === "ADVISOR"
                ? userId
                : "",

            email,
            password,
            role,

            department,
            section,
            year,

            phoneNumber,
            githubUsername,
            hackerrankUsername,
            geeksforgeeksUsername,
            linkedinUrl,
            portfolioUrl,
            leetcodeUsername,
            codechefUsername,
            codeforcesUsername
        })
    })

    .then(async response => {

        const text =
            await response.text();

        if (!response.ok) {

            throw new Error(text);
        }

        return text;
    })

    .then(data => {

        msg.style.color = "green";

        msg.innerText =
            "Registration Successful";

        setTimeout(() => {

            window.location.href =
                "/loginnew.html";

        }, 1200);
    })

    .catch(error => {

        msg.style.color = "red";

        msg.innerText =
            error.message;
    });
}