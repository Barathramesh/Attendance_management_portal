// Function to fetch data from the server
function fetchStudents() {
  fetch('/api/students')
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw err; });
      }
      return response.json();
    })
    .then(data => {
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      
      const studentsList = document.getElementById('students-list');
      if (!studentsList) {
        throw new Error('Students list element not found');
      }

      studentsList.innerHTML = "";

      data.forEach((student) => {
        const studentDiv = document.createElement("div");
        studentDiv.className = "student";
        studentDiv.dataset.id = student.id;
        studentDiv.dataset.email = student.email; // Add email to data attribute

        const nameSpan = document.createElement("span");
        nameSpan.textContent = student.id + ". " + student.name;
        studentDiv.appendChild(nameSpan);

        const statusSpan = document.createElement("span");
        statusSpan.textContent =
          student.attendance_status === "Present" ? "Present" : "Absent";
        statusSpan.className = `status ${student.attendance_status.toLowerCase()}`;
        statusSpan.onclick = () => toggleStatus(statusSpan);
        studentDiv.appendChild(statusSpan);

        studentsList.appendChild(studentDiv);
      });
    })
    .catch(error => {
      console.error('Full error details:', error);
      alert(`Error loading students: ${error.message}\nCheck console for details.`);
    });
}

// Function to toggle attendance status
function toggleStatus(statusSpan) {
  if (statusSpan.classList.contains("present")) {
    statusSpan.classList.remove("present");
    statusSpan.classList.add("absent");
    statusSpan.textContent = "Absent";
  } else {
    statusSpan.classList.remove("absent");
    statusSpan.classList.add("present");
    statusSpan.textContent = "Present";
  }
}

// Function to calculate the total present and absent students
function calculate() {
  const studentsList = document.getElementById("students-list");
  const students = studentsList.getElementsByClassName("student");
  let presentCount = 0;
  let absentCount = 0;

  for (let student of students) {
    const status = student.querySelector(".status").textContent;
    if (status === "Present") {
      presentCount++;
    } else if (status === "Absent") {
      absentCount++;
    }
  }

  console.log("Total Present:", presentCount);
  console.log("Total Absent:", absentCount);

  let Present = document.getElementById("present-today-number");
  Present.innerHTML = presentCount;
  let Absent = document.getElementById("absent-today-number");
  Absent.innerHTML = absentCount;
}

// Function to submit attendance data


function submitAttendance() {
  const students = Array.from(document.querySelectorAll('.student'));
  const attendanceData = students.map(student => ({
    id: student.dataset.id,
    status: student.querySelector('.status').textContent
  }));

  fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attendanceData)
  })
  .then(async response => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Update failed');
    return data;
  })
  .then(data => {
    console.log('Update successful:', data);
    alert(`Updated ${data.updated} records`);
    calculate();
    collectAbsentees();
  })
  .catch(error => {
    console.error('Update error:', error);
    alert('Error: ' + error.message);
  });
}

// Function to collect absentees and display them
function collectAbsentees() {
  const studentsList = document.getElementById("students-list");
  const students = studentsList.getElementsByClassName("student");
  const absenteesList = document.getElementById("absentees-list");

  // Clear existing absentees content
  absenteesList.innerHTML = "<h2>Absentees</h2>";

  for (let student of students) {
    const status = student.querySelector(".status").textContent;
    if (status === "Absent") {
      const id = student.dataset.id;
      const name = student.querySelector("span").textContent;
      const email = student.dataset.email; // Get email from data attribute

      // Create a new div for the absentee
      const absenteeDiv = document.createElement("div");
      absenteeDiv.className = "student";
      absenteeDiv.dataset.id = id;

      const nameSpan = document.createElement("span");
      nameSpan.textContent = name;
      absenteeDiv.appendChild(nameSpan);

      // Create form for sending email
      const form = document.createElement("form");
      form.id = `contact-form-${id}`;

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.name = "name";
      nameInput.value = name;
      nameInput.hidden = true;
      form.appendChild(nameInput);

      const emailInput = document.createElement("input");
      emailInput.type = "email";
      emailInput.name = "email";
      emailInput.value = email;
      emailInput.hidden = true;
      form.appendChild(emailInput);

      const sendButton = document.createElement("button");
      sendButton.type = "button";
      sendButton.className = "button";
      sendButton.textContent = "Send";
      sendButton.onclick = () => sendEmail(`contact-form-${id}`);
      form.appendChild(sendButton);

      absenteeDiv.appendChild(form);

      absenteesList.appendChild(absenteeDiv);
    }
  }
}

// Function to send email
function sendEmail(formId) {
  var form = document.getElementById(formId);
  var email = form.querySelector('input[name="email"]').value;
  var to_name = form.querySelector('input[name="name"]').value;

  var templateParams = {
    email: email,
    to_name: to_name,
  };

  emailjs.send("service_w96dhsj", "template_caabghn", templateParams).then(
    function (response) {
      console.log("SUCCESS!", response.status, response.text);
      window.alert("Sent successfully!");
    },
    function (error) {
      console.log("FAILED...", error);
      window.alert("Failed to send email.");
    }
  );
}

// Fetch data when the page loads
window.onload = fetchStudents;
