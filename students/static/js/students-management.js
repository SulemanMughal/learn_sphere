document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    // if (!authToken) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    // DOM elements
    const filterBtn = document.getElementById('filterBtn');
    const filterOptions = document.getElementById('filterOptions');
    const addStudentBtn = document.getElementById('addStudentBtn');
    const studentModal = document.getElementById('studentModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const studentForm = document.getElementById('studentForm');
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const searchBtn = document.getElementById('searchBtn');
    const studentSearch = document.getElementById('studentSearch');

    // Pagination state
    let currentPage = 1;
    const itemsPerPage = 10;
    let totalItems = 0;
    let totalPages = 1;
    let currentFilters = {};
    let searchQuery = '';

    // Fetch students on page load
    fetchStudents();

    // Event listeners
    filterBtn.addEventListener('click', toggleFilterOptions);
    addStudentBtn.addEventListener('click', showAddStudentModal);
    closeModal.addEventListener('click', closeStudentModal);
    cancelBtn.addEventListener('click', closeStudentModal);
    studentForm.addEventListener('submit', saveStudent);
    closeDeleteModal.addEventListener('click', closeDeleteConfirmation);
    cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation);
    confirmDeleteBtn.addEventListener('click', deleteStudent);
    resetFilterBtn.addEventListener('click', resetFilters);
    applyFilterBtn.addEventListener('click', applyFilters);
    prevPageBtn.addEventListener('click', goToPreviousPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    searchBtn.addEventListener('click', searchStudents);
    studentSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStudents();
        }
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Toggle filter options
    function toggleFilterOptions() {
        filterOptions.style.display = filterOptions.style.display === 'none' ? 'block' : 'none';
    }

    // Show add student modal
    function showAddStudentModal() {
        document.getElementById('modalTitle').textContent = 'Add New Student';
        document.getElementById('studentId').value = '';
        studentForm.reset();
        document.getElementById('enrollmentDate').valueAsDate = new Date();
        studentModal.style.display = 'block';
    }

    // Close student modal
    function closeStudentModal() {
        studentModal.style.display = 'none';
    }

    // Show edit student modal
    function showEditStudentModal(student) {
        document.getElementById('modalTitle').textContent = 'Edit Student';
        document.getElementById('studentId').value = student.id;
        document.getElementById('firstName').value = student.name.split(' ')[0];
        document.getElementById('lastName').value = student.name.split(' ')[1] || '';
        document.getElementById('email').value = student.email;
        document.getElementById('phone').value = student.phone || '';
        document.getElementById('course').value = student.course;
        document.getElementById('year').value = student.year;
        document.getElementById('status').value = student.status;
        document.getElementById('enrollmentDate').value = student.enrollmentDate || '';
        studentModal.style.display = 'block';
    }

    // Save student (create or update)
    function saveStudent(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('studentId').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const course = document.getElementById('course').value;
        const year = document.getElementById('year').value;
        const status = document.getElementById('status').value;
        const enrollmentDate = document.getElementById('enrollmentDate').value;
        
        const studentData = {
            name: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
            course: course,
            year: year,
            status: status,
            enrollmentDate: enrollmentDate
        };
        
        // API endpoint and method based on whether it's an update or create
        const endpoint = studentId ? `/api/students/${studentId}/` : '/api/students/';
        const method = studentId ? 'PUT' : 'POST';
        
        fetch(endpoint, {
            method: method,
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(studentData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save student');
            }
            return response.json();
        })
        .then(data => {
            closeStudentModal();
            fetchStudents(); // Refresh the student list
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to save student. Please try again.');
            
            // For demo purposes, simulate successful save
            closeStudentModal();
            fetchStudents();
        });
    }

    // Show delete confirmation
    function showDeleteConfirmation(studentId) {
        document.getElementById('deleteStudentId').value = studentId;
        deleteModal.style.display = 'block';
    }

    // Close delete confirmation
    function closeDeleteConfirmation() {
        deleteModal.style.display = 'none';
    }

    // Delete student
    function deleteStudent() {
        const studentId = document.getElementById('deleteStudentId').value;
        
        fetch(`/api/students/${studentId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete student');
            }
            closeDeleteConfirmation();
            fetchStudents(); // Refresh the student list
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete student. Please try again.');
            
            // For demo purposes, simulate successful delete
            closeDeleteConfirmation();
            fetchStudents();
        });
    }

    // Reset filters
    function resetFilters() {
        document.getElementById('filterCourse').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterYear').value = '';
        currentFilters = {};
        currentPage = 1;
        fetchStudents();
    }

    // Apply filters
    function applyFilters() {
        const course = document.getElementById('filterCourse').value;
        const status = document.getElementById('filterStatus').value;
        const year = document.getElementById('filterYear').value;
        
        currentFilters = {};
        if (course) currentFilters.course = course;
        if (status) currentFilters.status = status;
        if (year) currentFilters.year = year;
        
        currentPage = 1;
        fetchStudents();
        toggleFilterOptions();
    }

    // Search students
    function searchStudents() {
        searchQuery = document.getElementById('studentSearch').value.trim();
        currentPage = 1;
        fetchStudents();
    }

    // Go to previous page
    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            fetchStudents();
        }
    }

    // Go to next page
    function goToNextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            fetchStudents();
        }
    }

    // Fetch students with pagination, filtering, and search
    function fetchStudents() {
        // Build query parameters
        let queryParams = `?page=${currentPage}&limit=${itemsPerPage}`;
        
        // Add filters
        for (const [key, value] of Object.entries(currentFilters)) {
            queryParams += `&${key}=${encodeURIComponent(value)}`;
        }
        
        // Add search query
        if (searchQuery) {
            queryParams += `&search=${encodeURIComponent(searchQuery)}`;
        }
        
        fetch(`/api/students/${queryParams}`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch students');
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
            populateStudentsTable(data.results || data);
        })
        .catch(error => {
            console.error('Error:', error);
            
            // For demo purposes, set some sample data
            const sampleData = getSampleStudents();
            totalItems = sampleData.length;
            totalPages = Math.ceil(totalItems / itemsPerPage);
            
            // Apply pagination to sample data
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginatedData = sampleData.slice(start, end);
            
            // Update pagination UI
            updatePaginationUI();
            
            // Populate table with sample data
            populateStudentsTable(paginatedData);
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

    // Populate students table
    function populateStudentsTable(students) {
        const tableBody = document.getElementById('studentsTableBody');
        tableBody.innerHTML = '';

        if (students.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7" style="text-align: center;">No students found</td>`;
            tableBody.appendChild(row);
            return;
        }

        students.forEach(student => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.course}</td>
                <td>Year ${student.year || 'N/A'}</td>
                <td>
                    <span class="status-badge ${student.status === 'Active' ? 'status-active' : 'status-inactive'}">
                        ${student.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" title="View" data-id="${student.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Edit" data-id="${student.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Delete" data-id="${student.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const studentId = this.getAttribute('data-id');
                viewStudent(studentId);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const studentId = this.getAttribute('data-id');
                const student = students.find(s => s.id === studentId);
                if (student) {
                    showEditStudentModal(student);
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const studentId = this.getAttribute('data-id');
                showDeleteConfirmation(studentId);
            });
        });
    }

    // View student details
    function viewStudent(studentId) {
        // In a real application, you would fetch the student details from the API
        // For demo purposes, we'll use the sample data
        const student = getSampleStudents().find(s => s.id === studentId);
        
        if (student) {
            alert(`Student Details:\nID: ${student.id}\nName: ${student.name}\nEmail: ${student.email}\nCourse: ${student.course}\nYear: ${student.year}\nStatus: ${student.status}`);
        }
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
    function getSampleStudents() {
        return [
            { id: 'STU001', name: 'John Doe', email: 'john.doe@example.com', course: 'Computer Science', year: '2', status: 'Active', phone: '123-456-7890', enrollmentDate: '2023-09-01' },
            { id: 'STU002', name: 'Jane Smith', email: 'jane.smith@example.com', course: 'Data Science', year: '3', status: 'Active', phone: '234-567-8901', enrollmentDate: '2022-09-01' },
            { id: 'STU003', name: 'Robert Johnson', email: 'robert.j@example.com', course: 'Web Development', year: '1', status: 'Inactive', phone: '345-678-9012', enrollmentDate: '2023-09-01' },
            { id: 'STU004', name: 'Emily Davis', email: 'emily.d@example.com', course: 'Artificial Intelligence', year: '4', status: 'Active', phone: '456-789-0123', enrollmentDate: '2021-09-01' },
            { id: 'STU005', name: 'Michael Brown', email: 'michael.b@example.com', course: 'Cybersecurity', year: '2', status: 'Active', phone: '567-890-1234', enrollmentDate: '2023-09-01' },
            { id: 'STU006', name: 'Sarah Wilson', email: 'sarah.w@example.com', course: 'Computer Science', year: '1', status: 'Active', phone: '678-901-2345', enrollmentDate: '2023-09-01' },
            { id: 'STU007', name: 'David Taylor', email: 'david.t@example.com', course: 'Data Science', year: '3', status: 'Active', phone: '789-012-3456', enrollmentDate: '2022-09-01' },
            { id: 'STU008', name: 'Jennifer Martinez', email: 'jennifer.m@example.com', course: 'Web Development', year: '2', status: 'Inactive', phone: '890-123-4567', enrollmentDate: '2023-09-01' },
            { id: 'STU009', name: 'James Anderson', email: 'james.a@example.com', course: 'Artificial Intelligence', year: '4', status: 'Active', phone: '901-234-5678', enrollmentDate: '2021-09-01' },
            { id: 'STU010', name: 'Lisa Thomas', email: 'lisa.t@example.com', course: 'Cybersecurity', year: '1', status: 'Active', phone: '012-345-6789', enrollmentDate: '2023-09-01' },
            { id: 'STU011', name: 'Daniel White', email: 'daniel.w@example.com', course: 'Computer Science', year: '3', status: 'Active', phone: '123-456-7890', enrollmentDate: '2022-09-01' },
            { id: 'STU012', name: 'Michelle Harris', email: 'michelle.h@example.com', course: 'Data Science', year: '2', status: 'Active', phone: '234-567-8901', enrollmentDate: '2023-09-01' },
            { id: 'STU013', name: 'Christopher Clark', email: 'chris.c@example.com', course: 'Web Development', year: '1', status: 'Inactive', phone: '345-678-9012', enrollmentDate: '2023-09-01' },
            { id: 'STU014', name: 'Amanda Lewis', email: 'amanda.l@example.com', course: 'Artificial Intelligence', year: '4', status: 'Active', phone: '456-789-0123', enrollmentDate: '2021-09-01' },
            { id: 'STU015', name: 'Matthew Walker', email: 'matthew.w@example.com', course: 'Cybersecurity', year: '2', status: 'Active', phone: '567-890-1234', enrollmentDate: '2023-09-01' }
        ];
    }
});