const API_URL = "https://ingenious-laughter-production-dd87.up.railway.app/students";
let editStudentId = null;

window.onload = function () {
    getAllStudents();
};

function addStudent() {

    const student = {
        name: document.getElementById("stname").value.trim(),
        registerNumber: document.getElementById("streg").value.trim(),
        year: document.getElementById("styear").value.trim(),
        department: document.getElementById("stdept").value.trim(),
        section: document.getElementById("stsec").value.trim(),
        leetcodeUsername: document.getElementById("leetcode").value.trim(),
        codechefUsername: document.getElementById("codechef").value.trim(),
        codeforcesUsername: document.getElementById("codeforces").value.trim()
    };

    const url = editStudentId ? `${API_URL}/update/${editStudentId}` : `${API_URL}/add`;
    const method = editStudentId ? "PUT" : "POST";

    fetch(url,{
        method: method,
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify(student)
    })
    .then(res => res.json())
    .then(() => {
        clearForm();
        getAllStudents();
    });
}

function getAllStudents() {
    fetch(`${API_URL}/all`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch students");
            }
            return response.json();
        })
        .then(students => {
            displayStudents(students);
        })
        .catch(error => {
            console.error("Error while fetching:", error);
        });
}

function displayStudents(students) {

    students.sort((a, b) => {
        return a.registerNumber.localeCompare(b.registerNumber);
    });

    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    students.forEach(student => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.registerNumber}</td>
            <td>${student.year}</td>
            <td>${student.department}</td>
            <td>${student.section}</td>
            <td>${student.leetcodeUsername || "-"}</td>
            <td>${student.codechefUsername || "-"}</td>
            <td>${student.codeforcesUsername || "-"}</td>
            <td>
                <button class="analytics-btn" onclick="openAnalytics(${student.id})">Analytics</button>
                <button class="edit-btn" onclick="editStudentById(${student.id})">Edit</button>
                <button class="delete-btn" onclick="deleteStudent(${student.id})">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function clearForm() {
    document.getElementById("stname").value = "";
    document.getElementById("streg").value = "";
    document.getElementById("styear").value = "";
    document.getElementById("stdept").value = "";
    document.getElementById("stsec").value = "";
    document.getElementById("leetcode").value = "";
    document.getElementById("codechef").value = "";
    document.getElementById("codeforces").value = "";
}

function searchStudent() {

    const input = document.getElementById("searchBox").value.toUpperCase();
    const table = document.getElementById("tableBody");
    const rows = table.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {

        const regCell = rows[i].getElementsByTagName("td")[1];

        if (regCell) {
            const regText = regCell.textContent || regCell.innerText;

            if (regText.toUpperCase().indexOf(input) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}

function editStudentById(id){

    fetch(`${API_URL}/${id}`)
        .then(res => res.json())
        .then(student => {

            document.getElementById("stname").value = student.name;
            document.getElementById("streg").value = student.registerNumber;
            document.getElementById("styear").value = student.year;
            document.getElementById("stdept").value = student.department;
            document.getElementById("stsec").value = student.section;
            document.getElementById("leetcode").value = student.leetcodeUsername || "";
            document.getElementById("codechef").value = student.codechefUsername || "";
            document.getElementById("codeforces").value = student.codeforcesUsername || "";

            editStudentId = id;
            document.getElementById("addbtn").innerText = "Update Student";
        });


}

function deleteStudent(id){

    const confirmDelete = confirm("Are you sure to delete this student?");

    if(!confirmDelete){
        return;
    }

    fetch(`${API_URL}/delete/${id}`, {
        method: "DELETE"
    })
    .then(() => {
        getAllStudents();
    });
}
function openAnalytics(id) {
    window.location.href = `analytics.html?id=${id}`;
}
