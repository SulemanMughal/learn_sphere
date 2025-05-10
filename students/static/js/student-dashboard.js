document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    // if (!authToken) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    // Fetch student data and dashboard information
    fetchStudentData();
    fetchDashboardStats();
    fetchTodayClasses();
    fetchRecentAssignments();
    fetchAnnouncements();

    // Event listeners
    document.getElementById('viewAllAssignmentsBtn').addEventListener('click', function() {
        window.location.href = 'student-assignments.html';
    });

    document.getElementById('viewAllAnnouncementsBtn').addEventListener('click', function() {
        // Redirect to announcements page (if available)
        alert('View all announcements functionality will be implemented in the future.');
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Fetch student data
    function fetchStudentData() {
        fetch('/api/student/profile/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch student data');
            }
            return response.json();
        })
        .then(data => {
            // Update student information
            updateStudentInfo(data);
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, set some sample data
            updateStudentInfo({
                name: 'John Doe',
                email: 'john.doe@example.com',
                course: 'Computer Science',
                year: '2',
                status: 'Active'
            });
        });
    }

    // Update student information in the UI
    function updateStudentInfo(student) {
        document.getElementById('studentName').textContent = student.name;
        document.getElementById('welcomeName').textContent = student.name.split(' ')[0];
        
        // Set initials for avatar
        const nameParts = student.name.split(' ');
        const initials = nameParts.length > 1 
            ? `${nameParts[0][0]}${nameParts[1][0]}`
            : nameParts[0].substring(0, 2);
        document.getElementById('studentInitials').textContent = initials.toUpperCase();
    }

    // Fetch dashboard statistics
    function fetchDashboardStats() {
        fetch('/api/student/stats/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }
            return response.json();
        })
        .then(data => {
            // Update dashboard cards with actual data
            document.getElementById('enrolledCourses').textContent = data.enrolled_courses || 0;
            document.getElementById('attendanceRate').textContent = `${data.attendance_rate || 0}%`;
            document.getElementById('pendingAssignments').textContent = data.pending_assignments || 0;
            document.getElementById('averageGrade').textContent = `${data.average_grade || 0}%`;
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, set some sample data
            document.getElementById('enrolledCourses').textContent = '4';
            document.getElementById('attendanceRate').textContent = '92%';
            document.getElementById('pendingAssignments').textContent = '3';
            document.getElementById('averageGrade').textContent = '87%';
        });
    }

    // Fetch today's classes
    function fetchTodayClasses() {
        fetch('/api/student/classes/today/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch today\'s classes');
            }
            return response.json();
        })
        .then(data => {
            populateClassesTable(data);
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, set some sample data
            populateClassesTable(getSampleClasses());
        });
    }

    // Populate classes table
    function populateClassesTable(classes) {
        const tableBody = document.getElementById('classesTableBody');
        tableBody.innerHTML = '';

        if (classes.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" style="text-align: center;">No classes scheduled for today</td>`;
            tableBody.appendChild(row);
            return;
        }

        classes.forEach(classItem => {
            const row = document.createElement('tr');
            
            // Determine if the class is upcoming, ongoing, or completed
            const now = new Date();
            const startTime = new Date(`${now.toDateString()} ${classItem.startTime}`);
            const endTime = new Date(`${now.toDateString()} ${classItem.endTime}`);
            
            let status = '';
            let statusClass = '';
            
            if (now < startTime) {
                status = 'Upcoming';
                statusClass = 'status-inactive';
            } else if (now >= startTime && now <= endTime) {
                status = 'Ongoing';
                statusClass = 'status-active';
            } else {
                status = 'Completed';
                statusClass = '';
            }
            
            row.innerHTML = `
                <td>${classItem.course}</td>
                <td>${classItem.startTime} - ${classItem.endTime}</td>
                <td>${classItem.instructor}</td>
                <td>${classItem.room}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    // Fetch recent assignments
    function fetchRecentAssignments() {
        fetch('/api/student/assignments/recent/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch recent assignments');
            }
            return response.json();
        })
        .then(data => {
            populateAssignmentsTable(data);
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, set some sample data
            populateAssignmentsTable(getSampleAssignments());
        });
    }

    // Populate assignments table
    function populateAssignmentsTable(assignments) {
        const tableBody = document.getElementById('assignmentsTableBody');
        tableBody.innerHTML = '';

        if (assignments.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" style="text-align: center;">No recent assignments</td>`;
            tableBody.appendChild(row);
            return;
        }

        assignments.forEach(assignment => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${assignment.title}</td>
                <td>${assignment.course}</td>
                <td>${assignment.dueDate}</td>
                <td>
                    <span class="status-badge ${assignment.status === 'Pending' ? 'status-inactive' : assignment.status === 'Submitted' ? 'status-active' : ''}">
                        ${assignment.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" title="View" data-id="${assignment.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${assignment.status === 'Pending' ? `
                        <button class="action-btn submit-btn" title="Submit" data-id="${assignment.id}">
                            <i class="fas fa-upload"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const assignmentId = this.getAttribute('data-id');
                viewAssignment(assignmentId);
            });
        });

        document.querySelectorAll('.submit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const assignmentId = this.getAttribute('data-id');
                submitAssignment(assignmentId);
            });
        });
    }

    // View assignment details
    function viewAssignment(assignmentId) {
        // In a real application, you would fetch the assignment details from the API
        // For demo purposes, we'll use the sample data
        const assignment = getSampleAssignments().find(a => a.id === assignmentId);
        
        if (assignment) {
            alert(`Assignment Details:\nTitle: ${assignment.title}\nCourse: ${assignment.course}\nDue Date: ${assignment.dueDate}\nStatus: ${assignment.status}\nDescription: ${assignment.description || 'No description available'}`);
        }
    }

    // Submit assignment
    function submitAssignment(assignmentId) {
        // In a real application, you would show a file upload form or redirect to a submission page
        // For demo purposes, we'll just show an alert
        alert(`Submit Assignment: ${assignmentId}\nThis would open a file upload form or redirect to a submission page in a real application.`);
    }

    // Fetch announcements
    function fetchAnnouncements() {
        fetch('/api/announcements/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch announcements');
            }
            return response.json();
        })
        .then(data => {
            populateAnnouncements(data);
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, set some sample data
            populateAnnouncements(getSampleAnnouncements());
        });
    }

    // Populate announcements
    function populateAnnouncements(announcements) {
        const announcementsList = document.getElementById('announcementsList');
        announcementsList.innerHTML = '';

        if (announcements.length === 0) {
            announcementsList.innerHTML = '<p style="text-align: center;">No announcements available</p>';
            return;
        }

        announcements.forEach(announcement => {
            const announcementItem = document.createElement('div');
            announcementItem.className = 'announcement-item';
            announcementItem.style.marginBottom = '1.5rem';
            announcementItem.style.padding = '1rem';
            announcementItem.style.borderLeft = '4px solid var(--primary-color)';
            announcementItem.style.backgroundColor = '#f8f9fa';
            announcementItem.style.borderRadius = '0 8px 8px 0';
            
            announcementItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0;">${announcement.title}</h3>
                    <span style="font-size: 0.8rem; color: var(--text-light);">${announcement.date}</span>
                </div>
                <p style="margin: 0 0 0.5rem 0;">${announcement.message}</p>
                <div style="font-size: 0.9rem; color: var(--text-light);">
                    <span>${announcement.author}</span> - <span>${announcement.category}</span>
                </div>
            `;
            
            announcementsList.appendChild(announcementItem);
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

    // Sample classes data for testing
    function getSampleClasses() {
        const currentHour = new Date().getHours();
        
        return [
            { 
                course: 'Computer Science Fundamentals', 
                startTime: '09:00 AM', 
                endTime: '10:30 AM', 
                instructor: 'Dr. Alan Turing', 
                room: 'Room 101'
            },
            { 
                course: 'Data Science and Analytics', 
                startTime: '11:00 AM', 
                endTime: '12:30 PM', 
                instructor: 'Dr. Ada Lovelace', 
                room: 'Room 203'
            },
            { 
                course: 'Web Development Bootcamp', 
                startTime: '02:00 PM', 
                endTime: '03:30 PM', 
                instructor: 'Prof. Tim Berners-Lee', 
                room: 'Lab 305'
            },
            { 
                course: 'Artificial Intelligence', 
                startTime: '04:00 PM', 
                endTime: '05:30 PM', 
                instructor: 'Dr. Grace Hopper', 
                room: 'Room 405'
            }
        ];
    }

    // Sample assignments data for testing
    function getSampleAssignments() {
        return [
            { 
                id: 'ASG001', 
                title: 'Algorithm Analysis', 
                course: 'Computer Science Fundamentals', 
                dueDate: '2023-11-15', 
                status: 'Pending',
                description: 'Analyze the time and space complexity of the provided algorithms.'
            },
            { 
                id: 'ASG002', 
                title: 'Data Visualization Project', 
                course: 'Data Science and Analytics', 
                dueDate: '2023-11-20', 
                status: 'Submitted',
                description: 'Create visualizations for the provided dataset using Python and matplotlib.'
            },
            { 
                id: 'ASG003', 
                title: 'Responsive Website', 
                course: 'Web Development Bootcamp', 
                dueDate: '2023-11-25', 
                status: 'Pending',
                description: 'Build a responsive website using HTML, CSS, and JavaScript.'
            },
            { 
                id: 'ASG004', 
                title: 'Neural Network Implementation', 
                course: 'Artificial Intelligence', 
                dueDate: '2023-11-30', 
                status: 'Graded',
                description: 'Implement a simple neural network for the given classification problem.'
            }
        ];
    }

    // Sample announcements data for testing
    function getSampleAnnouncements() {
        return [
            { 
                id: 'ANN001', 
                title: 'Midterm Exam Schedule', 
                message: 'The midterm exams for all courses will be held from November 15 to November 20. Please check your course pages for specific dates and times.', 
                date: '2023-11-01', 
                author: 'Academic Office', 
                category: 'Exams'
            },
            { 
                id: 'ANN002', 
                title: 'Campus Maintenance', 
                message: 'The campus will be undergoing maintenance on November 5. Some facilities may be temporarily unavailable.', 
                date: '2023-11-02', 
                author: 'Facilities Management', 
                category: 'Campus'
            },
            { 
                id: 'ANN003', 
                title: 'Guest Lecture: AI in Healthcare', 
                message: 'We are pleased to announce a guest lecture on "AI in Healthcare" by Dr. Jane Smith on November 10 at 2:00 PM in the Main Auditorium.', 
                date: '2023-11-03', 
                author: 'Computer Science Department', 
                category: 'Events'
            }
        ];
    }
});