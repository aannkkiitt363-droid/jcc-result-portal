document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // 🔗 API
    // =========================
    const API_URL = "https://script.google.com/macros/s/AKfycbwXzn_wifhG4AfHYEwAEKIyAlrBmgHXRZYJLj-brCgCI_ryIBAZmHQkjWBsX1fuMlsX/exec";

    const SHEET_URL =
        "https://docs.google.com/spreadsheets/d/1Pw-HD49R7WVjzAlqL11oelwXLDH-2nywxrw8SkxXv1U/export?format=csv&gid=0";

    // =========================
    // ELEMENTS
    // =========================
    const button = document.getElementById("getResultBtn");
    const input = document.getElementById("enrollment");

    const loader = document.getElementById("loader");
    const resultCard = document.getElementById("resultCard");
    const pdfBtn = document.getElementById("pdfBtn");
    const certificate = document.getElementById("certificate");

    const adminTableBody = document.getElementById("adminTableBody");
    const searchBox = document.getElementById("searchBox");
    const saveBtn = document.getElementById("saveBtn");

    let allStudents = [];

    // =========================
    // UI HELPERS
    // =========================
    function setLoading(state) {
        button.disabled = state;
        button.textContent = state ? "Loading..." : "Get Result";
        button.style.opacity = state ? "0.7" : "1";
    }

    function showLoader(state) {
        loader.style.display = state ? "block" : "none";
    }

    function hideResult() {
        resultCard.style.display = "none";
        pdfBtn.style.display = "none";
    }

    function showResultSmooth() {
        resultCard.style.display = "block";
        resultCard.style.opacity = "0";
        resultCard.style.transform = "translateY(12px)";

        requestAnimationFrame(() => {
            resultCard.style.transition = "0.4s ease";
            resultCard.style.opacity = "1";
            resultCard.style.transform = "translateY(0)";
        });
    }

    // =========================
    // FETCH DATA
    // =========================
    async function fetchData() {
        const response = await fetch(SHEET_URL);
        const csv = await response.text();

        const rows = csv.trim().split("\n").map(row => row.split(","));

        return {
            headers: rows[0],
            data: rows.slice(1)
        };
    }

    // =========================
    // ADMIN TABLE
    // =========================
    async function loadAdminTable() {
        try {
            const { data } = await fetchData();
            allStudents = data;
            renderAdminTable(allStudents);
        } catch (err) {
            console.error(err);
            alert("Failed to load admin data");
        }
    }

    function renderAdminTable(data) {
        adminTableBody.innerHTML = "";

        data.forEach(row => {
            adminTableBody.innerHTML += `
                <tr>
                    <td>${row[0]}</td>
                    <td>${row[1]}</td>
                    <td>Digital Marketing</td>
                    <td>Semester-I</td>
                    <td>
                        <button onclick="editStudent('${row[0]}')">Edit</button>
                        <button onclick="deleteStudent('${row[0]}')">Delete</button>
                    </td>
                </tr>
            `;
        });
    }

    searchBox?.addEventListener("input", () => {
        const value = searchBox.value.toLowerCase();

        const filtered = allStudents.filter(row =>
            row[0].toLowerCase().includes(value) ||
            row[1].toLowerCase().includes(value)
        );

        renderAdminTable(filtered);
    });

    saveBtn.addEventListener("click", async () => {

        const payload = {
            action: "add",
            enrollment: document.getElementById("a_enrollment").value,
            name: document.getElementById("a_name").value,
            course: document.getElementById("a_course").value,
            session: document.getElementById("a_session").value
        };

        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        alert("Student Added Successfully");
        loadAdminTable();
    });

    // =========================
    // 🎓 RESULT SEARCH (FIXED STATUS ISSUE)
    // =========================
    button.addEventListener("click", async () => {

        const enrollment = input.value.trim();

        if (!enrollment) {
            alert("Please enter Enrollment Number");
            return;
        }

        setLoading(true);
        showLoader(true);
        hideResult();

        try {
            const { headers, data } = await fetchData();

            const student = data.find(row => row[0].trim() === enrollment);

            setLoading(false);
            showLoader(false);

            if (!student) {
                alert("Result Not Found");
                return;
            }

            // =========================
            // STUDENT INFO
            // =========================
            document.getElementById("roll").textContent = student[0];
            document.getElementById("name").textContent = student[1];
            document.getElementById("course").textContent = "Digital Marketing";
            document.getElementById("semester").textContent = "Semester-I";
            document.getElementById("session").textContent = "2025-26";

            // =========================
            // MARKS
            // =========================
            const marksBody = document.getElementById("marksBody");
            marksBody.innerHTML = "";

            let total = 0;
            let maxTotal = 0;

            for (let i = 2; i <= 11; i++) {
                const marks = Number(student[i]) || 0;

                total += marks;
                maxTotal += 100;

                marksBody.innerHTML += `
                    <tr>
                        <td>${headers[i]}</td>
                        <td>100</td>
                        <td>${marks}</td>
                    </tr>
                `;
            }

            document.getElementById("totalMarks").textContent =
                `${total} / ${maxTotal}`;

            const percentage = ((total / maxTotal) * 100).toFixed(2);
            document.getElementById("percentage").textContent = `${percentage}%`;

            // =========================
            // ✅ FIXED STATUS LOGIC (MAIN FIX)
            // =========================
            const rawStatus = (student[13] || "PASS").toString().trim().toUpperCase();

            const resultStatus = document.getElementById("resultStatus");

            resultStatus.textContent = rawStatus;

            // IMPORTANT: remove old classes first
            resultStatus.classList.remove("pass", "fail");

            if (rawStatus === "PASS") {
                resultStatus.classList.add("pass");
            } else {
                resultStatus.classList.add("fail");
            }

            // =========================
            // CERTIFICATE
            // =========================
            document.getElementById("c_name").textContent = student[1];
            document.getElementById("c_roll").textContent = student[0];
            document.getElementById("c_course").textContent = "Digital Marketing";
            document.getElementById("c_session").textContent = "2025-26";
            document.getElementById("c_status").textContent = rawStatus;

            const certMarks = document.getElementById("c_marks");
            certMarks.innerHTML = "";

            for (let i = 2; i <= 11; i++) {
                certMarks.innerHTML += `
                    <tr>
                        <td>${headers[i]}</td>
                        <td>${student[i]}</td>
                    </tr>
                `;
            }

            showResultSmooth();
            pdfBtn.style.display = "block";

        } catch (error) {
            console.error(error);
            setLoading(false);
            showLoader(false);
            alert("Unable to load result.");
        }
    });

    // =========================
    // PDF
    // =========================
    pdfBtn.addEventListener("click", () => {

        certificate.style.display = "block";

        setTimeout(() => {
            html2pdf()
                .set({
                    margin: 0,
                    filename: "JCC_Official_Certificate.pdf",
                    image: { type: "jpeg", quality: 1 },
                    html2canvas: { scale: 3, useCORS: true },
                    jsPDF: { unit: "px", format: [820, 1120], orientation: "portrait" }
                })
                .from(certificate)
                .save()
                .then(() => {
                    certificate.style.display = "none";
                });
        }, 400);
    });

    // =========================
    // ADMIN
    // =========================
    window.editStudent = async function (enrollment) {
        const name = prompt("Enter new name:");
        const course = prompt("Enter new course:");
        const session = prompt("Enter new session:");

        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "update",
                enrollment,
                name,
                course,
                session
            })
        });

        alert("Updated Successfully");
        loadAdminTable();
    };

    window.deleteStudent = async function (enrollment) {

        if (!confirm("Are you sure?")) return;

        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "delete",
                enrollment
            })
        });

        alert("Deleted Successfully");
        loadAdminTable();
    };

    loadAdminTable();
});