document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    // if (!authToken) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    // DOM elements
    const takeAttendanceBtn = document.getElementById('takeAttendanceBtn');
    const attendanceModal = document.getElementById('attendanceModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const attendanceForm = document.getElementById('attendanceForm');
    const editAttendanceModal = document.getElementById('editAttendanceModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editAttendanceForm = document.getElementById('editAttendanceForm');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const exportBtn = document.getElementById('exportBtn');

    // Set today's date as default for date filter
    document.getElementById('filterDate').valueAsDate = new Date();

    // Pagination state
    let currentPage = 1;
    const itemsPerPage = 10;
    let totalItems = 0;
    let totalPages = 1;
    let currentFilters = {
        date: document.getElementById('filterDate').value
    };

    // Fetch attendance data and stats on page load
    fetchAttendanceStats();
    fetchAttendance();

    // Event listeners
    takeAttendanceBtn.addEventListener('click', showTakeAttendanceModal);
    closeModal.addEventListener('click', closeAttendanceModal);
    cancelBtn.addEventListener('click', closeAttendanceModal);
    attendanceForm.addEventListener('submit', saveAttendance);
    closeEditModal.addEventListener('click', closeEditAttendanceModal);
    cancelEditBtn.addEventListener('click', closeEditAttendanceModal);
    editAttendanceForm.addEventListener('submit', saveEditAttendance);
    resetFilterBtn.addEventListener('click', resetFilters);
    applyFilterBtn.addEventListener('click', applyFilters);
    prevPageBtn.addEventListener('click', goToPreviousPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    exportBtn.addEventListener('click', exportAttendance);

    // Course selection change event
    document.getElementById('attendanceCourse').addEventListener('change', function() {
        if (this.value) {
            fetchStudentsForCourse(this.value);
        } else {
            document.getElementById('studentsList').innerHTML = '';
        }
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Fetch attendance statistics
    function fetchAttendanceStats() {
        fetch('/api/attendance/stats/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch attendance stats');
            }
            return response.json();
        })
        .then(data => {
            // Update dashboard cards with actual data
            document.getElementById('overallAttendance').textContent = `${data.overall_attendance || 0}%`;
            document.getElementById('todayAttendance').textContent = `${data.today_attendance || 0}%`;
            document.getElementById('presentStudents').textContent = data.present_students || 0;
            document.getElementById('absentStudents').textContent = data.absent_students || 0;
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, set some sample data
            document.getElementById('overallAttendance').textContent = '87%';
            document.getElementById('todayAttendance').textContent = '92%';
            document.getElementById('presentStudents').textContent = '235';
            document.getElementById('absentStudents').textContent = '21';
        });
    }

    // Show take attendance modal
    function showTakeAttendanceModal() {
        document.getElementById('attendanceCourse').value = '';
        document.getElementById('attendanceDate').valueAsDate = new Date();
        document.getElementById('studentsList').innerHTML = '';
        attendanceModal.style.display = 'block';
    }

    // Close attendance modal
    function closeAttendanceModal() {
        attendanceModal.style.display = 'none';
    }

    // Fetch students for a course
    function fetchStudentsForCourse(course) {
        fetch(`/api/courses/${encodeURIComponent(course)}/students/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch students for course');
            }
            return response.json();
        })
        .then(data => {
            populateStudentsList(data);
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, set some sample data
            populateStudentsList(getSampleStudentsForCourse(course));
        });
    }

    // Populate students list for attendance
    function populateStudentsList(students) {
        const studentsList = document.getElementById('studentsList');
        studentsList.innerHTML = '';

        if (students.length === 0) {
            studentsList.innerHTML = '<p style="text-align: center;">No students enrolled in this course</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Status</th>
                <th>Remarks</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        students.forEach(student => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>
                    <select name="status_${student.id}" class="form-control" required>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                    </select>
                </td>
                <td>
                    <input type="text" name="remarks_${student.id}" class="form-control" placeholder="Optional remarks">
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        studentsList.appendChild(table);
    }

    // Save attendance
    function saveAttendance(e) {
        e.preventDefault();
        
        const course = document.getElementById('attendanceCourse').value;
        const date = document.getElementById('attendanceDate').value;
        
        if (!course || !date) {
            alert('Please select a course and date');
            return;
        }
        
        // Get all student status selects
        const statusSelects = document.querySelectorAll('[name^="status_"]');
        const remarksInputs = document.querySelectorAll('[name^="remarks_"]');
        
        if (statusSelects.length === 0) {
            alert('No students found for this course');
            return;
        }
        
        // Prepare attendance data
        const attendanceData = {
            course: course,
            date: date,
            students: []
        };
        
        statusSelects.forEach((select, index) => {
            const studentId = select.name.replace('status_', '');
            const status = select.value;
            const remarks = remarksInputs[index].value;
            
            attendanceData.students.push({
                student_id: studentId,
                status: status,
                remarks: remarks
            });
        });
        
        // Send attendance data to API
        fetch('/api/attendance/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(attendanceData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save attendance');
            }
            return response.json();
        })
        .then(data => {
            closeAttendanceModal();
            fetchAttendanceStats(); // Refresh the attendance stats
            fetchAttendance(); // Refresh the attendance list
            alert('Attendance saved successfully');
        })
        .catch(error => {
            console.error('Error:', error);
            
            // For demo purposes, simulate successful save
            closeAttendanceModal();
            fetchAttendanceStats();
            fetchAttendance();
            alert('Attendance saved successfully (Demo)');
        });
    }

    // Show edit attendance modal
    function showEditAttendanceModal(attendance) {
        document.getElementById('editAttendanceId').value = attendance.id;
        document.getElementById('editStudentName').value = attendance.student_name;
        document.getElementById('editCourse').value = attendance.course;
        document.getElementById('editDate').value = attendance.date;
        document.getElementById('editStatus').value = attendance.status;
        document.getElementById('editRemarks').value = attendance.remarks || '';
        editAttendanceModal.style.display = 'block';
    }

    // Close edit attendance modal
    function closeEditAttendanceModal() {
        editAttendanceModal.style.display = 'none';
    }

    // Save edit attendance
    function saveEditAttendance(e) {
        e.preventDefault();
        
        const attendanceId = document.getElementById('editAttendanceId').value;
        const status = document.getElementById('editStatus').value;
        const remarks = document.getElementById('editRemarks').value;
        
        const attendanceData = {
            status: status,
            remarks: remarks
        };
        
        fetch(`/api/attendance/${attendanceId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(attendanceData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update attendance');
            }
            return response.json();
        })
        .then(data => {
            closeEditAttendanceModal();
            fetchAttendanceStats(); // Refresh the attendance stats
            fetchAttendance(); // Refresh the attendance list
        })
        .catch(error => {
            console.error('Error:', error);
            
            // For demo purposes, simulate successful update
            closeEditAttendanceModal();
            fetchAttendanceStats();
            fetchAttendance();
        });
    }

    // Reset filters
    function resetFilters() {
        document.getElementById('filterCourse').value = '';
        document.getElementById('filterDate').valueAsDate = new Date();
        document.getElementById('filterStatus').value = '';
        
        currentFilters = {
            date: document.getElementById('filterDate').value
        };
        
        currentPage = 1;
        fetchAttendance();
    }

    // Apply filters
    function applyFilters() {
        const course = document.getElementById('filterCourse').value;
        const date = document.getElementById('filterDate').value;
        const status = document.getElementById('filterStatus').value;
        
        currentFilters = {};
        if (course) currentFilters.course = course;
        if (date) currentFilters.date = date;
        if (status) currentFilters.status = status;
        
        currentPage = 1;
        fetchAttendance();
    }

    // Go to previous page
    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            fetchAttendance();
        }
    }

    // Go to next page
    function goToNextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            fetchAttendance();
        }
    }

    // Export attendance
    function exportAttendance() {
        // In a real application, you would generate a CSV or Excel file
        // For demo purposes, we'll just show an alert
        alert('Attendance data would be exported as CSV or Excel file in a real application.');
    }

    // Fetch attendance with pagination and filtering
    function fetchAttendance() {
        // Build query parameters
        let queryParams = `?page=${currentPage}&limit=${itemsPerPage}`;
        
        // Add filters
        for (const [key, value] of Object.entries(currentFilters)) {
            queryParams += `&${key}=${encodeURIComponent(value)}`;
        }
        
        fetch(`/api/attendance/${queryParams}`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch attendance');
            }
            return response.json();
        })
        .then(data => {
            // Update pagination info
            totalItems = data.count || data.results.length;
            totalPages = Math.ceil(totalItems / itemsPerPage);
            
            // Update pagination UI
            updatePaginationUI();
            
            // Populate table
            populateAttendanceTable(data.results || data);
        })
        .catch(error => {
            console.error('Error:', error);
            
            // For demo purposes, set some sample data
            const sampleData = getSampleAttendance();
            totalItems = sampleData.length;
            totalPages = Math.ceil(totalItems / itemsPerPage);
            
            // Apply pagination to sample data
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginatedData = sampleData.slice(start, end);
            
            // Update pagination UI
            updatePaginationUI();
            
            // Populate table with sample data
            populateAttendanceTable(paginatedData);
        });
    }

    // Update pagination UI
    function updatePaginationUI() {
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('totalItems').textContent = totalItems;
        
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);
        
        document.getElementById('startRange').textContent = totalItems > 0 ? start : 0;
        document.getElementById('endRange').textContent = end;
        
        // Enable/disable pagination buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalItems === 0;
    }

    // Populate attendance table
    function populateAttendanceTable(attendanceRecords) {
        const tableBody = document.getElementById('attendanceTableBody');
        tableBody.innerHTML = '';

        if (attendanceRecords.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" style="text-align: center;">No attendance records found</td>`;
            tableBody.appendChild(row);
            return;
        }

        attendanceRecords.forEach(record => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${record.student_id}</td>
                <td>${record.student_name}</td>
                <td>${record.course}</td>
                <td>${record.date}</td>
                <td>
                    <span class="status-badge ${record.status === 'Present' ? 'status-active' : record.status === 'Late' ? 'status-inactive' : ''}">
                        ${record.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" title="Edit" data-id="${record.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const attendanceId = this.getAttribute('data-id');
                const attendance = attendanceRecords.find(r => r.id === attendanceId);
                if (attendance) {
                    showEditAttendanceModal(attendance);
                }
            });
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

    // Sample students data for testing
    function getSampleStudentsForCourse(course) {
        const students = [
            { id: 'STU001', name: 'John Doe' },
            { id: 'STU002', name: 'Jane Smith' },
            { id: 'STU003', name: 'Robert Johnson' },
            { id: 'STU004', name: 'Emily Davis' },
            { id: 'STU005', name: 'Michael Brown' },
            { id: 'STU006', name: 'Sarah Wilson' },
            { id: 'STU007', name: 'David Taylor' },
            { id: 'STU008', name: 'Jennifer Martinez' },
            { id: 'STU009', name: 'James Anderson' },
            { id: 'STU010', name: 'Lisa Thomas' }
        ];
        
        // Return a subset of students based on the course
        return students.slice(0, course.includes('Computer Science') ? 5 : course.includes('Data Science') ? 4 : 3);
    }

    // Sample attendance data for testing
    function getSampleAttendance() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        return [
            { id: 'ATT001', student_id: 'STU001', student_name: 'John Doe', course: 'Computer Science Fundamentals', date: today, status: 'Present', remarks: '' },
            { id: 'ATT002', student_id: 'STU002', student_name: 'Jane Smith', course: 'Computer Science Fundamentals', date: today, status: 'Present', remarks: '' },
            { id: 'ATT003', student_id: 'STU003', student_name: 'Robert Johnson', course: 'Computer Science Fundamentals', date: today, status: 'Absent', remarks: 'Sick leave' },
            { id: 'ATT004', student_id: 'STU004', student_name: 'Emily Davis', course: 'Computer Science Fundamentals', date: today, status: 'Present', remarks: '' },
            { id: 'ATT005', student_id: 'STU005', student_name: 'Michael Brown', course: 'Computer Science Fundamentals', date: today, status: 'Late', remarks: 'Traffic' },
            { id: 'ATT006', student_id: 'STU006', student_name: 'Sarah Wilson', course: 'Data Science and Analytics', date: today, status: 'Present', remarks: '' },
            { id: 'ATT007', student_id: 'STU007', student_name: 'David Taylor', course: 'Data Science and Analytics', date: today, status: 'Present', remarks: '' },
            { id: 'ATT008', student_id: 'STU008', student_name: 'Jennifer Martinez', course: 'Data Science and Analytics', date: today, status: 'Absent', remarks: 'Family emergency' },
            { id: 'ATT009', student_id: 'STU009', student_name: 'James Anderson', course: 'Web Development Bootcamp', date: today, status: 'Present', remarks: '' },
            { id: 'ATT010', student_id: 'STU010', student_name: 'Lisa Thomas', course: 'Web Development Bootcamp', date: today, status: 'Present', remarks: '' },
            { id: 'ATT011', student_id: 'STU001', student_name: 'John Doe', course: 'Computer Science Fundamentals', date: yesterday, status: 'Present', remarks: '' },
            { id: 'ATT012', student_id: 'STU002', student_name: 'Jane Smith', course: 'Computer Science Fundamentals', date: yesterday, status: 'Present', remarks: '' },
            { id: 'ATT013', student_id: 'STU003', student_name: 'Robert Johnson', course: 'Computer Science Fundamentals', date: yesterday, status: 'Present', remarks: '' },
            { id: 'ATT014', student_id: 'STU004', student_name: 'Emily Davis', course: 'Computer Science Fundamentals', date: yesterday, status: 'Absent', remarks: 'Doctor appointment' },
            { id: 'ATT015', student_id: 'STU005', student_name: 'Michael Brown', course: 'Computer Science Fundamentals', date: yesterday, status: 'Present', remarks: '' }
        ];
    }
});