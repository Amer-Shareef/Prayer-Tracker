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
                
                // Verify user has Member role
                if (data.user && data.user.role !== 'Member') {
                    // Redirect to appropriate dashboard based on role
                    switch(data.user.role) {
                        case 'SuperAdmin':
                            window.location.href = '/admin/dashboard.html';
                            break;
                        case 'Founder':
                            window.location.href = '/founder/dashboard.html';
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

    // Setup prayer tracking
    function setupPrayerTracking() {
        const prayerCheckboxes = document.querySelectorAll('.prayer-status input[type="checkbox"]');
        
        prayerCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', async function() {
                const prayerName = this.name;
                const isChecked = this.checked;
                
                // Find the status text element
                const statusTextEl = this.parentElement.querySelector('.status-text');
                
                if (isChecked) {
                    // Update UI
                    statusTextEl.textContent = 'Prayed at mosque';
                    this.parentElement.parentElement.classList.add('prayed');
                    this.parentElement.parentElement.classList.remove('not-prayed');
                    
                    // In a real app, you would send this data to backend
                    console.log(`Marked ${prayerName} as prayed`);
                    
                    try {
                        // This is a placeholder for the API call
                        // await fetch('/api/prayers/update', {
                        //     method: 'POST',
                        //     headers: { 'Content-Type': 'application/json' },
                        //     body: JSON.stringify({ 
                        //         prayer: prayerName, 
                        //         status: 'prayed', 
                        //         date: new Date().toISOString().split('T')[0]
                        //     }),
                        //     credentials: 'include'
                        // });
                    } catch (error) {
                        console.error('Error updating prayer status:', error);
                    }
                } else {
                    // Update UI
                    statusTextEl.textContent = 'Mark as prayed';
                    this.parentElement.parentElement.classList.remove('prayed');
                    this.parentElement.parentElement.classList.add('not-prayed');
                    
                    console.log(`Unmarked ${prayerName} as prayed`);
                }
            });
        });
    }

    // Update current date
    function updateCurrentDate() {
        const dateElement = document.querySelector('.date-info h3');
        if (dateElement) {
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateElement.innerHTML = `<i class="far fa-calendar-alt"></i> Today, ${today.toLocaleDateString('en-US', options)}`;
        }
    }

    // Setup action buttons
    function setupActionButtons() {
        const actionButtons = document.querySelectorAll('.action-btn');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.textContent.trim().replace(/^\S+\s+/, ''); // Remove icon text
                alert(`Feature "${action}" coming soon!`);
            });
        });
    }

    // Initialize
    getCurrentUser();
    setupPrayerTracking();
    updateCurrentDate();
    setupActionButtons();
});