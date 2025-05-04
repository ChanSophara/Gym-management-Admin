document.addEventListener('DOMContentLoaded', function() {
    // Initialize bookings table
    initBookingsTable();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load bookings data
    loadBookings();
});

// Initialize bookings table
function initBookingsTable() {
    // Set default dates for date range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('start-date').value = firstDayOfMonth.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
    
    console.log('Bookings table initialized');
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('booking-search').addEventListener('input', function() {
        filterBookings(this.value);
    });
    
    // Date range changes
    document.getElementById('start-date').addEventListener('change', function() {
        filterBookingsByDate();
    });
    
    document.getElementById('end-date').addEventListener('change', function() {
        filterBookingsByDate();
    });
    
    // Filter dropdown
    document.getElementById('bookings-filter').addEventListener('change', function() {
        filterBookingsByWorkout(this.value);
    });
    
    // Export button
    document.getElementById('export-bookings').addEventListener('click', function() {
        exportBookings();
    });
    
    // Pagination buttons
    document.getElementById('prev-page').addEventListener('click', function() {
        navigatePage('prev');
    });
    
    document.getElementById('next-page').addEventListener('click', function() {
        navigatePage('next');
    });
    
    // Close details modal
    document.getElementById('close-modal').addEventListener('click', function() {
        closeBookingModal();
    });
    
    document.getElementById('close-details').addEventListener('click', function() {
        closeBookingModal();
    });
    
    // Cancel booking button
    document.getElementById('cancel-booking').addEventListener('click', function() {
        const bookingId = this.getAttribute('data-id');
        if (bookingId) cancelBooking(bookingId);
    });
}

// Load bookings data
async function loadBookings() {
    try {
        const [bookingsRes, membersRes] = await Promise.all([
            fetch('http://127.0.0.1:5002/getData/bookings?_sort=booking_date&_order=desc'),
            fetch('http://127.0.0.1:5002/getData/members')
        ]);
        
        const bookings = await bookingsRes.json();
        const members = await membersRes.json();
        
        // Calculate summary stats
        calculateBookingStats(bookings);
        
        // Display bookings with member names
        displayBookings(bookings, members);
    } catch (error) {
        console.error('Error loading bookings:', error);
        // Fallback to local storage
        loadBookingsFromLocalStorage();
    }
}

// Fallback to local storage for bookings
function loadBookingsFromLocalStorage() {
    const bookings = JSON.parse(localStorage.getItem('gymBookings') || '[]');
    const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    
    // Calculate summary stats
    calculateBookingStats(bookings);
    
    // Display bookings with member names
    displayBookings(bookings, members);
}

// Calculate booking statistics
function calculateBookingStats(bookings) {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    let totalBookings = bookings.length;
    let monthlyBookings = 0;
    let dailyBookings = 0;
    
    bookings.forEach(booking => {
        const bookingDate = new Date(booking.booking_date || booking.date);
        
        // Monthly bookings
        if (bookingDate.getMonth() + 1 === currentMonth && bookingDate.getFullYear() === currentYear) {
            monthlyBookings++;
        }
        
        // Daily bookings
        const bookingDay = bookingDate.toISOString().split('T')[0];
        if (bookingDay === today) {
            dailyBookings++;
        }
    });
    
    // Update summary cards
    document.getElementById('total-bookings').textContent = totalBookings;
    document.getElementById('monthly-bookings').textContent = monthlyBookings;
    document.getElementById('daily-bookings').textContent = dailyBookings;
}

// Display bookings in table
function displayBookings(bookings, members) {
    const tableBody = document.querySelector('#bookings-table tbody');
    tableBody.innerHTML = '';
    
    if (bookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No bookings found</td>
            </tr>
        `;
        document.getElementById('booking-count').textContent = 'Showing 0 bookings';
        return;
    }
    
    bookings.forEach(booking => {
        // Find member name
        const member = members.find(m => m.id == booking.member_id);
        const memberName = member ? member.name : 'Unknown Member';
        
        // Format booking date
        const bookingDate = new Date(booking.booking_date || booking.date);
        const formattedDate = bookingDate.toLocaleDateString();
        
        // Determine workout type class
        const workoutType = booking.workout_name.toLowerCase();
        let typeClass = '';
        
        if (workoutType.includes('yoga')) {
            typeClass = 'type-yoga';
        } else if (workoutType.includes('hiit')) {
            typeClass = 'type-hiit';
        } else if (workoutType.includes('strength')) {
            typeClass = 'type-strength';
        } else if (workoutType.includes('cardio')) {
            typeClass = 'type-cardio';
        } else if (workoutType.includes('zumba')) {
            typeClass = 'type-zumba';
        } else if (workoutType.includes('crossfit')) {
            typeClass = 'type-crossfit';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.id}</td>
            <td>${memberName}</td>
            <td><span class="workout-type ${typeClass}">${booking.workout_name}</span></td>
            <td>${formattedDate}</td>
            <td><span class="status-badge status-${booking.status || 'confirmed'}">${booking.status || 'confirmed'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon view" data-id="${booking.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon cancel" data-id="${booking.id}" title="Cancel Booking">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.btn-icon.view').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-id');
            viewBookingDetails(bookingId);
        });
    });
    
    document.querySelectorAll('.btn-icon.cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-id');
            cancelBooking(bookingId);
        });
    });
    
    // Update booking count
    document.getElementById('booking-count').textContent = `Showing ${bookings.length} bookings`;
}

// Filter bookings by search term
function filterBookings(searchTerm) {
    const rows = document.querySelectorAll('#bookings-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const member = row.cells[1].textContent.toLowerCase();
        const workout = row.cells[2].textContent.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        if (member.includes(search) || workout.includes(search)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('booking-count').textContent = `Showing ${visibleCount} bookings`;
}

// Filter bookings by date range
function filterBookingsByDate() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) return;
    
    const rows = document.querySelectorAll('#bookings-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const dateStr = row.cells[3].textContent;
        const dateParts = dateStr.split('/');
        const rowDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (rowDate >= start && rowDate <= end) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('booking-count').textContent = `Showing ${visibleCount} bookings`;
}

// Filter bookings by workout type
function filterBookingsByWorkout(workout) {
    if (workout === 'all') {
        document.querySelectorAll('#bookings-table tbody tr').forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    let visibleCount = 0;
    document.querySelectorAll('#bookings-table tbody tr').forEach(row => {
        const workoutSpan = row.cells[2].querySelector('.workout-type');
        if (workoutSpan.classList.contains(`type-${workout}`)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('booking-count').textContent = `Showing ${visibleCount} bookings`;
}

// View booking details
async function viewBookingDetails(bookingId) {
    try {
        const response = await fetch(`http://127.0.0.1:5002/getData/bookings/${bookingId}`);
        const booking = await response.json();
        
        // Find member name
        let memberName = 'Unknown Member';
        try {
            const membersRes = await fetch('http://127.0.0.1:5002/getData/members');
            const members = await membersRes.json();
            const member = members.find(m => m.id == booking.member_id);
            if (member) memberName = member.name;
        } catch (e) {
            console.error('Error fetching member:', e);
        }
        
        // Format booking date
        const bookingDate = new Date(booking.booking_date || booking.date);
        const formattedDate = bookingDate.toLocaleDateString() + ' ' + bookingDate.toLocaleTimeString();
        
        // Update modal with booking details
        document.getElementById('booking-id').textContent = booking.id;
        document.getElementById('booking-member').textContent = memberName;
        document.getElementById('booking-workout').textContent = booking.workout_name;
        document.getElementById('booking-date').textContent = formattedDate;
        document.getElementById('booking-status').textContent = booking.status || 'confirmed';
        
        // Set data-id on cancel button
        document.getElementById('cancel-booking').setAttribute('data-id', bookingId);
        
        // Open modal
        document.getElementById('booking-modal').classList.add('active');
        
    } catch (error) {
        console.error('Error fetching booking details:', error);
        alert('Error loading booking details');
    }
}

// Close booking modal
function closeBookingModal() {
    document.getElementById('booking-modal').classList.remove('active');
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const response = await fetch(`http://127.0.0.1:5002/cancelBooking/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'cancelled' })
        });
        
        if (response.ok) {
            // Update local storage if exists
            let bookings = JSON.parse(localStorage.getItem('gymBookings') || '[]');
            bookings = bookings.map(b => {
                if (b.id == bookingId) {
                    return { ...b, status: 'cancelled' };
                }
                return b;
            });
            localStorage.setItem('gymBookings', JSON.stringify(bookings));
            
            alert('Booking cancelled successfully');
            closeBookingModal();
            loadBookings();
        } else {
            throw new Error('Failed to cancel booking');
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Error cancelling booking');
    }
}

// Export bookings to CSV
function exportBookings() {
    // In a real app, you would generate a CSV file
    console.log('Exporting bookings to CSV');
    alert('Bookings exported to CSV (simulated)');
}

// Pagination navigation
function navigatePage(direction) {
    // In a real app, you would implement pagination
    console.log(`Navigating to ${direction} page`);
}