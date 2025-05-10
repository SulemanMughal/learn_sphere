document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    // const authToken = localStorage.getItem('authToken');
    // if (!authToken) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    // Fetch dashboard data
    fetchDashboardData();
    fetchRecentStudents();
    fetchRecentCourses();

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
});

// Fetch dashboard statistics
function fetchDashboardData() {
    fetch('/api/dashboard/stats/', {
        method: 'GET',
        headers: {
            'Authorization': `Token ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }
        return response.json();
    })
    .then(data => {
        // Update dashboard cards with actual data
        document.getElementById('totalStudents').textContent = data.total_students || 0;
        document.getElementById('totalStaff').textContent = data.total_staff || 0;
        document.getElementById('totalCourses').textContent = data.total_courses || 0;
        document.getElementById('attendanceRate').textContent = `${data.attendance_rate || 0}%`;
    })
    .catch(error => {
        console.error('Error:', error);
        // For demo purposes, set some sample data
        setDemoData();
    });
}

// Fetch recent students
function fetchRecentStudents() {
    fetch('/api/students/recent/', {
        method: 'GET',
        headers: {
            'Authorization': `Token ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch recent students');
        }
        return response.json();
    })
    .then(data => {
        populateStudentsTable(data);
    })
    .catch(error => {
        console.error('Error:', error);
        // For demo purposes, set some sample data
        populateStudentsTable(getSampleStudents());
    });
}

// Fetch recent courses
function fetchRecentCourses() {
    fetch('/api/courses/recent/', {
        method: 'GET',
        headers: {
            'Authorization': `Token ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch recent courses');
        }
        return response.json();
    })
    .then(data => {
        populateCoursesTable(data);
    })
    .catch(error => {
        console.error('Error:', error);
        // For demo purposes, set some sample data
        populateCoursesTable(getSampleCourses());
    });
}

// Populate students table
function populateStudentsTable(students) {
    const tableBody = document.getElementById('studentsTableBody');
    tableBody.innerHTML = '';

    students.forEach(student => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.course}</td>
            <td>
                <span class="status-badge ${student.status === 'Active' ? 'status-active' : 'status-inactive'}">
                    ${student.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Populate courses table
function populateCoursesTable(courses) {
    const tableBody = document.getElementById('coursesTableBody');
    tableBody.innerHTML = '';

    courses.forEach(course => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${course.id}</td>
            <td>${course.name}</td>
            <td>${course.instructor}</td>
            <td>${course.students}</td>
            <td>
                <span class="status-badge ${course.status === 'Active' ? 'status-active' : 'status-inactive'}">
                    ${course.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Logout function
function logout() {
    fetch('/api/logout/', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => {
        // Clear local storage and redirect to login page
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
    })
    .catch(error => {
        console.error('Error:', error);
        // Even if the API call fails, clear local storage and redirect
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
    });
}

// Function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Set demo data for testing
function setDemoData() {
    document.getElementById('totalStudents').textContent = '256';
    document.getElementById('totalStaff').textContent = '32';
    document.getElementById('totalCourses').textContent = '18';
    document.getElementById('attendanceRate').textContent = '87%';
}

// Sample students data for testing
function getSampleStudents() {
    return [
        { id: 'STU001', name: 'John Doe', email: 'john.doe@example.com', course: 'Computer Science', status: 'Active' },
        { id: 'STU002', name: 'Jane Smith', email: 'jane.smith@example.com', course: 'Data Science', status: 'Active' },
        { id: 'STU003', name: 'Robert Johnson', email: 'robert.j@example.com', course: 'Web Development', status: 'Inactive' },
        { id: 'STU004', name: 'Emily Davis', email: 'emily.d@example.com', course: 'Artificial Intelligence', status: 'Active' },
        { id: 'STU005', name: 'Michael Brown', email: 'michael.b@example.com', course: 'Cybersecurity', status: 'Active' }
    ];
}

// Sample courses data for testing
function getSampleCourses() {
    return [
        { id: 'CRS001', name: 'Computer Science Fundamentals', instructor: 'Dr. Alan Turing', students: 45, status: 'Active' },
        { id: 'CRS002', name: 'Data Science and Analytics', instructor: 'Dr. Ada Lovelace', students: 38, status: 'Active' },
        { id: 'CRS003', name: 'Web Development Bootcamp', instructor: 'Prof. Tim Berners-Lee', students: 52, status: 'Active' },
        { id: 'CRS004', name: 'Artificial Intelligence', instructor: 'Dr. Grace Hopper', students: 30, status: 'Inactive' },
        { id: 'CRS005', name: 'Cybersecurity Essentials', instructor: 'Prof. Charles Babbage', students: 25, status: 'Active' }
    ];
}