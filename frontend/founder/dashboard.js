document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle functionality
    document.getElementById('sidebarCollapse').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.getElementById('content').classList.toggle('expanded');
    });

    // Logout functionality
    document.getElementById('logout-btn').addEventListener('click', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                // Redirect to login page after successful logout
                window.location.href = '/Login/login.html';
            } else {
                console.error('Logout failed');
                alert('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred during logout. Please try again.');
        }
    });

    // Get current user info
    async function getCurrentUser() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                // Update UI with user info
                const usernameElement = document.querySelector('.navbar-profile span');
                if (usernameElement && data.user) {
                    usernameElement.textContent = `Welcome, ${data.user.username}`;
                }

                // Update avatar with user initials if needed
                const avatarElement = document.querySelector('.navbar-profile img');
                if (avatarElement && data.user) {
                    avatarElement.src = `https://ui-avatars.com/api/?name=${data.user.username}&background=27ae60&color=fff`;
                }
                
                // Verify user has Founder role
                if (data.user && data.user.role !== 'Founder') {
                    // Redirect to appropriate dashboard based on role
                    switch(data.user.role) {
                        case 'SuperAdmin':
                            window.location.href = '/admin/dashboard.html';
                            break;
                        case 'Member':
                            window.location.href = '/member/dashboard.html';
                            break;
                    }
                }
            } else {
                // If not authenticated, redirect to login
                window.location.href = '/Login/login.html';
            }
        } catch (error) {
            console.error('Error getting current user:', error);
        }
    }

    // Setup action buttons
    function setupActionButtons() {
        const actionButtons = document.querySelectorAll('.action-btn');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.textContent.trim().replace(/^\S+\s+/, ''); // Remove icon text
                alert(`Action "${action}" coming soon!`);
            });
        });
    }

    // Initialize
    getCurrentUser();
    setupActionButtons();
});