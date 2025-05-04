document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initDashboard();
    
    // Load stats
    loadStats();
    
    // Initialize charts
    initCharts();
    
    // Load recent activity
    loadRecentActivity();
});

// Initialize dashboard
function initDashboard() {
    // Add active class to current page in sidebar
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.createElement('div');
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.main-header').prepend(mobileMenuToggle);
    
    mobileMenuToggle.addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('mobile-show');
    });
}

// Load dashboard stats
async function loadStats() {
    try {
        // Fetch data from backend
        const [membersRes, trainersRes, paymentsRes, bookingsRes] = await Promise.all([
            fetch('http://127.0.0.1:5002/getData/members'),
            fetch('http://127.0.0.1:5002/getData/trainers'),
            fetch('http://127.0.0.1:5002/getData/payments'),
            fetch('http://127.0.0.1:5002/getData/bookings')
        ]);
        
        const members = await membersRes.json();
        const trainers = await trainersRes.json();
        const payments = await paymentsRes.json();
        const bookings = await bookingsRes.json();
        
        // Calculate today's bookings
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.booking_date).toISOString().split('T')[0];
            return bookingDate === today;
        });
        
        // Calculate monthly revenue (current month)
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = payments.reduce((total, payment) => {
            const paymentDate = new Date(payment.payment_date);
            if (paymentDate.getMonth() + 1 === currentMonth && paymentDate.getFullYear() === currentYear) {
                return total + parseFloat(payment.amount);
            }
            return total;
        }, 0);
        
        // Update stats
        document.getElementById('total-members').textContent = members.length;
        document.getElementById('total-trainers').textContent = trainers.length;
        document.getElementById('total-revenue').textContent = '$' + monthlyRevenue.toFixed(2);
        document.getElementById('total-bookings').textContent = todayBookings.length;
        
    } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback to local storage if API fails
        loadStatsFromLocalStorage();
    }
}

// Fallback to local storage for stats
function loadStatsFromLocalStorage() {
    const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    const trainers = JSON.parse(localStorage.getItem('gymTrainers') || '[]');
    const payments = JSON.parse(localStorage.getItem('gymPayments') || '[]');
    const bookings = JSON.parse(localStorage.getItem('gymBookings') || '[]');
    
    // Calculate today's bookings
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date || booking.date).toISOString().split('T')[0];
        return bookingDate === today;
    });
    
    // Calculate monthly revenue (current month)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = payments.reduce((total, payment) => {
        const paymentDate = new Date(payment.payment_date || payment.date);
        if (paymentDate.getMonth() + 1 === currentMonth && paymentDate.getFullYear() === currentYear) {
            return total + parseFloat(payment.amount || payment.total_amount);
        }
        return total;
    }, 0);
    
    // Update stats
    document.getElementById('total-members').textContent = members.length;
    document.getElementById('total-trainers').textContent = trainers.length;
    document.getElementById('total-revenue').textContent = '$' + monthlyRevenue.toFixed(2);
    document.getElementById('total-bookings').textContent = todayBookings.length;
}

// Initialize charts
function initCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    const revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Revenue',
                data: [1200, 1900, 1500, 2000, 2200, 3000, 2800, 2500, 3000, 3500, 4000, 4500],
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Growth Chart
    const growthCtx = document.getElementById('growthChart').getContext('2d');
    const growthChart = new Chart(growthCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'New Members',
                data: [15, 20, 12, 18, 25, 30, 22, 28, 35, 40, 45, 50],
                backgroundColor: 'rgba(76, 201, 240, 0.7)',
                borderColor: 'rgba(76, 201, 240, 1)',
                borderWidth: 1
            }, {
                label: 'Total Members',
                data: [50, 70, 82, 100, 125, 155, 177, 205, 240, 280, 325, 375],
                backgroundColor: 'rgba(72, 149, 239, 0.7)',
                borderColor: 'rgba(72, 149, 239, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Update charts when period changes
    document.getElementById('revenue-period').addEventListener('change', function() {
        // In a real app, you would fetch new data based on the selected period
        console.log('Revenue period changed to:', this.value);
    });
    
    document.getElementById('growth-period').addEventListener('change', function() {
        // In a real app, you would fetch new data based on the selected period
        console.log('Growth period changed to:', this.value);
    });
}

// Load recent activity
async function loadRecentActivity() {
    try {
        // Fetch recent activity from backend
        const [paymentsRes, bookingsRes, feedbackRes] = await Promise.all([
            fetch('http://127.0.0.1:5002/getData/payments?_limit=5&_sort=payment_date&_order=desc'),
            fetch('http://127.0.0.1:5002/getData/bookings?_limit=5&_sort=booking_date&_order=desc'),
            fetch('http://127.0.0.1:5002/getData/feedback?_limit=5&_sort=created_at&_order=desc')
        ]);
        
        const payments = await paymentsRes.json();
        const bookings = await bookingsRes.json();
        const feedback = await feedbackRes.json();
        
        // Combine and sort all activity
        const allActivity = [
            ...payments.map(p => ({ ...p, type: 'payment' })),
            ...bookings.map(b => ({ ...b, type: 'booking' })),
            ...feedback.map(f => ({ ...f, type: 'feedback' }))
        ].sort((a, b) => {
            const dateA = new Date(a.payment_date || a.booking_date || a.created_at);
            const dateB = new Date(b.payment_date || b.booking_date || b.created_at);
            return dateB - dateA;
        }).slice(0, 5);
        
        // Display activity
        displayActivity(allActivity);
        
    } catch (error) {
        console.error('Error loading activity:', error);
        // Fallback to local storage
        loadActivityFromLocalStorage();
    }
}

// Fallback to local storage for activity
function loadActivityFromLocalStorage() {
    const payments = JSON.parse(localStorage.getItem('gymPayments') || '[]');
    const bookings = JSON.parse(localStorage.getItem('gymBookings') || '[]');
    const feedback = JSON.parse(localStorage.getItem('gymFeedback') || '[]');
    
    // Combine and sort all activity
    const allActivity = [
        ...payments.map(p => ({ ...p, type: 'payment' })),
        ...bookings.map(b => ({ ...b, type: 'booking' })),
        ...feedback.map(f => ({ ...f, type: 'feedback' }))
    ].sort((a, b) => {
        const dateA = new Date(a.payment_date || a.booking_date || a.created_at || a.date);
        const dateB = new Date(b.payment_date || b.booking_date || b.created_at || b.date);
        return dateB - dateA;
    }).slice(0, 5);
    
    // Display activity
    displayActivity(allActivity);
}

// Display activity items
function displayActivity(activities) {
    const activityContainer = document.getElementById('recent-activity');
    
    if (activities.length === 0) {
        activityContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h4>No recent activity</h4>
                <p>There hasn't been any activity recently.</p>
            </div>
        `;
        return;
    }
    
    activityContainer.innerHTML = '';
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        let icon, content, time;
        
        if (activity.type === 'payment') {
            icon = `<div class="activity-icon payment">
                        <i class="fas fa-credit-card"></i>
                    </div>`;
            content = `<div class="activity-content">
                          <h4>New Payment</h4>
                          <p>$${activity.amount || activity.total_amount} via ${activity.payment_method}</p>
                       </div>`;
            time = new Date(activity.payment_date || activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } 
        else if (activity.type === 'booking') {
            icon = `<div class="activity-icon booking">
                        <i class="fas fa-calendar-check"></i>
                    </div>`;
            content = `<div class="activity-content">
                          <h4>New Booking</h4>
                          <p>${activity.workout_name}</p>
                       </div>`;
            time = new Date(activity.booking_date || activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } 
        else if (activity.type === 'feedback') {
            icon = `<div class="activity-icon feedback">
                        <i class="fas fa-comment-alt"></i>
                    </div>`;
            content = `<div class="activity-content">
                          <h4>New Feedback</h4>
                          <p>${activity.rating}⭐ for ${activity.trainer_name}</p>
                       </div>`;
            time = new Date(activity.created_at || activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        activityItem.innerHTML = `
            ${icon}
            ${content}
            <div class="activity-time">${time}</div>
        `;
        
        activityContainer.appendChild(activityItem);
    });
}