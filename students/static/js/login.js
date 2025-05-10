document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Show loading state
        const loginBtn = document.querySelector('.login-btn');
        const originalBtnText = loginBtn.textContent;
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
        
        // Make API call to Django backend
        fetch('/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login failed');
            }
            return response.json();
        })
        .then(data => {
            // Store auth token if provided
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            
            // Redirect based on user role
            if (data.user_type === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (data.user_type === 'staff') {
                window.location.href = 'staff-dashboard.html';
            } else if (data.user_type === 'student') {
                window.location.href = 'student-dashboard.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Show error message
            alert('Login failed. Please check your credentials and try again.');
            
            // Reset button
            loginBtn.textContent = originalBtnText;
            loginBtn.disabled = false;
        });
    });
    
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
});