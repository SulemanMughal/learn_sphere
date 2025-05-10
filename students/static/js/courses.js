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
    const addCourseBtn = document.getElementById('addCourseBtn');
    const courseModal = document.getElementById('courseModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const courseForm = document.getElementById('courseForm');
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const searchBtn = document.getElementById('searchBtn');
    const courseSearch = document.getElementById('courseSearch');

    // Pagination state
    let currentPage = 1;
    const itemsPerPage = 10;
    let totalItems = 0;
    let totalPages = 1;
    let currentFilters = {};
    let searchQuery = '';

    // Fetch courses and stats on page load
    fetchCourseStats();
    fetchCourses();

    // Event listeners
    filterBtn.addEventListener('click', toggleFilterOptions);
    addCourseBtn.addEventListener('click', showAddCourseModal);
    closeModal.addEventListener('click', closeCourseModal);
    cancelBtn.addEventListener('click', closeCourseModal);
    courseForm.addEventListener('submit', saveCourse);
    closeDeleteModal.addEventListener('click', closeDeleteConfirmation);
    cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation);
    confirmDeleteBtn.addEventListener('click', deleteCourse);
    resetFilterBtn.addEventListener('click', resetFilters);
    applyFilterBtn.addEventListener('click', applyFilters);
    prevPageBtn.addEventListener('click', goToPreviousPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    searchBtn.addEventListener('click', searchCourses);
    courseSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCourses();
        }
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Fetch course statistics
    function fetchCourseStats() {
        fetch('/api/courses/stats/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch course stats');
            }
            return response.json();
        })
        .then(data => {
            // Update dashboard cards with actual data
            document.getElementById('totalCourses').textContent = data.total_courses || 0;
            document.getElementById('totalEnrollments').textContent = data.total_enrollments || 0;
            document.getElementById('totalInstructors').textContent = data.total_instructors || 0;
            document.getElementById('activeCourses').textContent = data.active_courses || 0;
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, set some sample data
            document.getElementById('totalCourses').textContent = '18';
            document.getElementById('totalEnrollments').textContent = '256';
            document.getElementById('totalInstructors').textContent = '12';
            document.getElementById('activeCourses').textContent = '15';
        });
    }

    // Toggle filter options
    function toggleFilterOptions() {
        filterOptions.style.display = filterOptions.style.display === 'none' ? 'block' : 'none';
    }

    // Show add course modal
    function showAddCourseModal() {
        document.getElementById('modalTitle').textContent = 'Add New Course';
        document.getElementById('courseId').value = '';
        courseForm.reset();
        courseModal.style.display = 'block';
    }

    // Close course modal
    function closeCourseModal() {
        courseModal.style.display = 'none';
    }

    // Show edit course modal
    function showEditCourseModal(course) {
        document.getElementById('modalTitle').textContent = 'Edit Course';
        document.getElementById('courseId').value = course.id;
        document.getElementById('courseName').value = course.name;
        document.getElementById('courseCode').value = course.code || '';
        document.getElementById('department').value = course.department || '';
        document.getElementById('instructor').value = course.instructor || '';
        document.getElementById('duration').value = course.duration || '3';
        document.getElementById('status').value = course.status;
        document.getElementById('description').value = course.description || '';
        courseModal.style.display = 'block';
    }

    // Save course (create or update)
    function saveCourse(e) {
        e.preventDefault();
        
        const courseId = document.getElementById('courseId').value;
        const courseName = document.getElementById('courseName').value;
        const courseCode = document.getElementById('courseCode').value;
        const department = document.getElementById('department').value;
        const instructor = document.getElementById('instructor').value;
        const duration = document.getElementById('duration').value;
        const status = document.getElementById('status').value;
        const description = document.getElementById('description').value;
        
        const courseData = {
            name: courseName,
            code: courseCode,
            department: department,
            instructor: instructor,
            duration: duration,
            status: status,
            description: description
        };
        
        // API endpoint and method based on whether it's an update or create
        const endpoint = courseId ? `/api/courses/${courseId}/` : '/api/courses/';
        const method = courseId ? 'PUT' : 'POST';
        
        fetch(endpoint, {
            method: method,
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(courseData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save course');
            }
            return response.json();
        })
        .then(data => {
            closeCourseModal();
            fetchCourseStats(); // Refresh the course stats
            fetchCourses(); // Refresh the course list
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to save course. Please try again.');
            
            // For demo purposes, simulate successful save
            closeCourseModal();
            fetchCourseStats();
            fetchCourses();
        });
    }

    // Show delete confirmation
    function showDeleteConfirmation(courseId) {
        document.getElementById('deleteCourseId').value = courseId;
        deleteModal.style.display = 'block';
    }

    // Close delete confirmation
    function closeDeleteConfirmation() {
        deleteModal.style.display = 'none';
    }

    // Delete course
    function deleteCourse() {
        const courseId = document.getElementById('deleteCourseId').value;
        
        fetch(`/api/courses/${courseId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete course');
            }
            closeDeleteConfirmation();
            fetchCourseStats(); // Refresh the course stats
            fetchCourses(); // Refresh the course list
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete course. Please try again.');
            
            // For demo purposes, simulate successful delete
            closeDeleteConfirmation();
            fetchCourseStats();
            fetchCourses();
        });
    }

    // Reset filters
    function resetFilters() {
        document.getElementById('filterDepartment').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterDuration').value = '';
        currentFilters = {};
        currentPage = 1;
        fetchCourses();
    }

    // Apply filters
    function applyFilters() {
        const department = document.getElementById('filterDepartment').value;
        const status = document.getElementById('filterStatus').value;
        const duration = document.getElementById('filterDuration').value;
        
        currentFilters = {};
        if (department) currentFilters.department = department;
        if (status) currentFilters.status = status;
        if (duration) currentFilters.duration = duration;
        
        currentPage = 1;
        fetchCourses();
        toggleFilterOptions();
    }

    // Search courses
    function searchCourses() {
        searchQuery = document.getElementById('courseSearch').value.trim();
        currentPage = 1;
        fetchCourses();
    }

    // Go to previous page
    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            fetchCourses();
        }
    }

    // Go to next page
    function goToNextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            fetchCourses();
        }
    }

    // Fetch courses with pagination, filtering, and search
    function fetchCourses() {
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
        
        fetch(`/api/courses/${queryParams}`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
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
            populateCoursesTable(data.results || data);
        })
        .catch(error => {
            console.error('Error:', error);
            
            // For demo purposes, set some sample data
            const sampleData = getSampleCourses();
            totalItems = sampleData.length;
            totalPages = Math.ceil(totalItems / itemsPerPage);
            
            // Apply pagination to sample data
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginatedData = sampleData.slice(start, end);
            
            // Update pagination UI
            updatePaginationUI();
            
            // Populate table with sample data
            populateCoursesTable(paginatedData);
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

    // Populate courses table
    function populateCoursesTable(courses) {
        const tableBody = document.getElementById('coursesTableBody');
        tableBody.innerHTML = '';

        if (courses.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" style="text-align: center;">No courses found</td>`;
            tableBody.appendChild(row);
            return;
        }

        courses.forEach(course => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${course.id}</td>
                <td>${course.name}</td>
                <td>${course.department || 'N/A'}</td>
                <td>${course.instructor}</td>
                <td>${course.students}</td>
                <td>${course.duration} months</td>
                <td>
                    <span class="status-badge ${course.status === 'Active' ? 'status-active' : 'status-inactive'}">
                        ${course.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" title="View" data-id="${course.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Edit" data-id="${course.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Delete" data-id="${course.id}">
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
                const courseId = this.getAttribute('data-id');
                viewCourse(courseId);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const courseId = this.getAttribute('data-id');
                const course = courses.find(c => c.id === courseId);
                if (course) {
                    showEditCourseModal(course);
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const courseId = this.getAttribute('data-id');
                showDeleteConfirmation(courseId);
            });
        });
    }

    // View course details
    function viewCourse(courseId) {
        // In a real application, you would fetch the course details from the API
        // For demo purposes, we'll use the sample data
        const course = getSampleCourses().find(c => c.id === courseId);
        
        if (course) {
            alert(`Course Details:\nID: ${course.id}\nName: ${course.name}\nDepartment: ${course.department}\nInstructor: ${course.instructor}\nStudents: ${course.students}\nDuration: ${course.duration} months\nStatus: ${course.status}\nDescription: ${course.description || 'No description available'}`);
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

    // Sample courses data for testing
    function getSampleCourses() {
        return [
            { id: 'CRS001', name: 'Computer Science Fundamentals', code: 'CS101', department: 'Computer Science', instructor: 'Dr. Alan Turing', students: 45, duration: '6', status: 'Active', description: 'Introduction to computer science principles and programming concepts.' },
            { id: 'CRS002', name: 'Data Science and Analytics', code: 'DS201', department: 'Data Science', instructor: 'Dr. Ada Lovelace', students: 38, duration: '6', status: 'Active', description: 'Learn data analysis, visualization, and machine learning techniques.' },
            { id: 'CRS003', name: 'Web Development Bootcamp', code: 'WD301', department: 'Web Development', instructor: 'Prof. Tim Berners-Lee', students: 52, duration: '3', status: 'Active', description: 'Comprehensive course on modern web development technologies.' },
            { id: 'CRS004', name: 'Artificial Intelligence', code: 'AI401', department: 'Artificial Intelligence', instructor: 'Dr. Grace Hopper', students: 30, duration: '12', status: 'Inactive', description: 'Advanced course on AI algorithms and applications.' },
            { id: 'CRS005', name: 'Cybersecurity Essentials', code: 'CS501', department: 'Cybersecurity', instructor: 'Prof. Charles Babbage', students: 25, duration: '6', status: 'Active', description: 'Introduction to cybersecurity principles and practices.' },
            { id: 'CRS006', name: 'Mobile App Development', code: 'MD601', department: 'Computer Science', instructor: 'Dr. Alan Turing', students: 35, duration: '3', status: 'Active', description: 'Learn to build mobile applications for iOS and Android.' },
            { id: 'CRS007', name: 'Database Management Systems', code: 'DB701', department: 'Data Science', instructor: 'Dr. Ada Lovelace', students: 40, duration: '6', status: 'Active', description: 'Comprehensive course on database design and management.' },
            { id: 'CRS008', name: 'Cloud Computing', code: 'CC801', department: 'Computer Science', instructor: 'Prof. Tim Berners-Lee', students: 28, duration: '3', status: 'Active', description: 'Introduction to cloud platforms and services.' },
            { id: 'CRS009', name: 'Machine Learning', code: 'ML901', department: 'Artificial Intelligence', instructor: 'Dr. Grace Hopper', students: 32, duration: '12', status: 'Active', description: 'Advanced course on machine learning algorithms and applications.' },
            { id: 'CRS010', name: 'Network Security', code: 'NS101', department: 'Cybersecurity', instructor: 'Prof. Charles Babbage', students: 22, duration: '6', status: 'Active', description: 'Learn network security principles and practices.' },
            { id: 'CRS011', name: 'Python Programming', code: 'PP201', department: 'Computer Science', instructor: 'Dr. Alan Turing', students: 48, duration: '3', status: 'Active', description: 'Comprehensive course on Python programming language.' },
            { id: 'CRS012', name: 'Big Data Analytics', code: 'BD301', department: 'Data Science', instructor: 'Dr. Ada Lovelace', students: 30, duration: '6', status: 'Inactive', description: 'Learn to process and analyze large datasets.' },
            { id: 'CRS013', name: 'Frontend Development', code: 'FD401', department: 'Web Development', instructor: 'Prof. Tim Berners-Lee', students: 42, duration: '3', status: 'Active', description: 'Learn modern frontend technologies like HTML, CSS, and JavaScript.' },
            { id: 'CRS014', name: 'Natural Language Processing', code: 'NL501', department: 'Artificial Intelligence', instructor: 'Dr. Grace Hopper', students: 25, duration: '12', status: 'Active', description: 'Advanced course on NLP techniques and applications.' },
            { id: 'CRS015', name: 'Ethical Hacking', code: 'EH601', department: 'Cybersecurity', instructor: 'Prof. Charles Babbage', students: 20, duration: '6', status: 'Active', description: 'Learn ethical hacking techniques and practices.' }
        ];
    }
});