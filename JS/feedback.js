document.addEventListener('DOMContentLoaded', function() {
    // Initialize feedback table
    initFeedbackTable();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load feedback data
    loadFeedback();
});

// Initialize feedback table
function initFeedbackTable() {
    // Set default dates for date range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('start-date').value = firstDayOfMonth.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
    
    console.log('Feedback table initialized');
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('feedback-search').addEventListener('input', function() {
        filterFeedback(this.value);
    });
    
    // Date range changes
    document.getElementById('start-date').addEventListener('change', function() {
        filterFeedbackByDate();
    });
    
    document.getElementById('end-date').addEventListener('change', function() {
        filterFeedbackByDate();
    });
    
    // Filter dropdown
    document.getElementById('feedback-filter').addEventListener('change', function() {
        filterFeedbackByRating(this.value);
    });
    
    // Export button
    document.getElementById('export-feedback').addEventListener('click', function() {
        exportFeedback();
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
        closeFeedbackModal();
    });
    
    document.getElementById('close-details').addEventListener('click', function() {
        closeFeedbackModal();
    });
}

// Load feedback data
async function loadFeedback() {
    try {
        const [feedbackRes, membersRes, trainersRes] = await Promise.all([
            fetch('http://127.0.0.1:5002/getData/feedback?_sort=created_at&_order=desc'),
            fetch('http://127.0.0.1:5002/getData/members'),
            fetch('http://127.0.0.1:5002/getData/trainers')
        ]);
        
        const feedback = await feedbackRes.json();
        const members = await membersRes.json();
        const trainers = await trainersRes.json();
        
        // Calculate summary stats
        calculateFeedbackStats(feedback);
        
        // Display feedback with member and trainer names
        displayFeedback(feedback, members, trainers);
    } catch (error) {
        console.error('Error loading feedback:', error);
        // Fallback to local storage
        loadFeedbackFromLocalStorage();
    }
}

// Fallback to local storage for feedback
function loadFeedbackFromLocalStorage() {
    const feedback = JSON.parse(localStorage.getItem('gymFeedback') || '[]');
    const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    const trainers = JSON.parse(localStorage.getItem('gymTrainers') || '[]');
    
    // Calculate summary stats
    calculateFeedbackStats(feedback);
    
    // Display feedback with member and trainer names
    displayFeedback(feedback, members, trainers);
}

// Calculate feedback statistics
function calculateFeedbackStats(feedback) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    let totalFeedback = feedback.length;
    let monthlyFeedback = 0;
    let totalRating = 0;
    
    feedback.forEach(item => {
        const feedbackDate = new Date(item.created_at || item.date);
        
        // Monthly feedback
        if (feedbackDate.getMonth() + 1 === currentMonth && feedbackDate.getFullYear() === currentYear) {
            monthlyFeedback++;
        }
        
        // Total rating
        totalRating += item.rating;
    });
    
    const averageRating = totalFeedback > 0 ? (totalRating / totalFeedback).toFixed(1) : 0;
    
    // Update summary cards
    document.getElementById('total-feedback').textContent = totalFeedback;
    document.getElementById('average-rating').textContent = averageRating + '⭐';
    document.getElementById('monthly-feedback').textContent = monthlyFeedback;
}

// Display feedback in table
function displayFeedback(feedback, members, trainers) {
    const tableBody = document.querySelector('#feedback-table tbody');
    tableBody.innerHTML = '';
    
    if (feedback.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No feedback found</td>
            </tr>
        `;
        document.getElementById('feedback-count').textContent = 'Showing 0 feedback';
        return;
    }
    
    feedback.forEach(item => {
        // Find member name
        const member = members.find(m => m.id == item.member_id);
        const memberName = member ? member.name : 'Unknown Member';
        
        // Find trainer name
        const trainer = trainers.find(t => t.name === item.trainer_name);
        const trainerName = item.trainer_name || 'Unknown Trainer';
        
        // Format feedback date
        const feedbackDate = new Date(item.created_at || item.date);
        const formattedDate = feedbackDate.toLocaleDateString();
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${memberName}</td>
            <td>${trainerName}</td>
            <td class="rating-stars">${item.rating}⭐</td>
            <td>${formattedDate}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon view" data-id="${item.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon delete" data-id="${item.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.btn-icon.view').forEach(btn => {
        btn.addEventListener('click', function() {
            const feedbackId = this.getAttribute('data-id');
            viewFeedbackDetails(feedbackId);
        });
    });
    
    document.querySelectorAll('.btn-icon.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const feedbackId = this.getAttribute('data-id');
            deleteFeedback(feedbackId);
        });
    });
    
    // Update feedback count
    document.getElementById('feedback-count').textContent = `Showing ${feedback.length} feedback`;
}

// Filter feedback by search term
function filterFeedback(searchTerm) {
    const rows = document.querySelectorAll('#feedback-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const member = row.cells[1].textContent.toLowerCase();
        const trainer = row.cells[2].textContent.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        if (member.includes(search) || trainer.includes(search)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('feedback-count').textContent = `Showing ${visibleCount} feedback`;
}

// Filter feedback by date range
function filterFeedbackByDate() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) return;
    
    const rows = document.querySelectorAll('#feedback-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const dateStr = row.cells[4].textContent;
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
    
    document.getElementById('feedback-count').textContent = `Showing ${visibleCount} feedback`;
}

// Filter feedback by rating
function filterFeedbackByRating(rating) {
    if (rating === 'all') {
        document.querySelectorAll('#feedback-table tbody tr').forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    let visibleCount = 0;
    document.querySelectorAll('#feedback-table tbody tr').forEach(row => {
        const ratingCell = row.cells[3].textContent;
        if (ratingCell.startsWith(rating)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('feedback-count').textContent = `Showing ${visibleCount} feedback`;
}

// View feedback details
async function viewFeedbackDetails(feedbackId) {
    try {
        const response = await fetch(`http://127.0.0.1:5002/getData/feedback/${feedbackId}`);
        const feedback = await response.json();
        
        // Find member name
        let memberName = 'Unknown Member';
        try {
            const membersRes = await fetch('http://127.0.0.1:5002/getData/members');
            const members = await membersRes.json();
            const member = members.find(m => m.id == feedback.member_id);
            if (member) memberName = member.name;
        } catch (e) {
            console.error('Error fetching member:', e);
        }
        
        // Format feedback date
        const feedbackDate = new Date(feedback.created_at || feedback.date);
        const formattedDate = feedbackDate.toLocaleDateString() + ' ' + feedbackDate.toLocaleTimeString();
        
        // Update modal with feedback details
        document.getElementById('feedback-id').textContent = feedback.id;
        document.getElementById('feedback-member').textContent = memberName;
        document.getElementById('feedback-trainer').textContent = feedback.trainer_name;
        document.getElementById('feedback-rating').textContent = feedback.rating + '⭐';
        document.getElementById('feedback-date').textContent = formattedDate;
        document.getElementById('feedback-comment').textContent = feedback.comment || 'No comment provided';
        
        // Open modal
        document.getElementById('feedback-modal').classList.add('active');
        
    } catch (error) {
        console.error('Error fetching feedback details:', error);
        alert('Error loading feedback details');
    }
}

// Close feedback modal
function closeFeedbackModal() {
    document.getElementById('feedback-modal').classList.remove('active');
}

// Delete feedback
async function deleteFeedback(feedbackId) {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
        const response = await fetch(`http://127.0.0.1:5002/deleteFeedback/${feedbackId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local storage if exists
            let feedback = JSON.parse(localStorage.getItem('gymFeedback') || '[]');
            feedback = feedback.filter(f => f.id != feedbackId);
            localStorage.setItem('gymFeedback', JSON.stringify(feedback));
            
            alert('Feedback deleted successfully');
            loadFeedback();
        } else {
            throw new Error('Failed to delete feedback');
        }
    } catch (error) {
        console.error('Error deleting feedback:', error);
        alert('Error deleting feedback');
    }
}

// Export feedback to CSV
function exportFeedback() {
    // In a real app, you would generate a CSV file
    console.log('Exporting feedback to CSV');
    alert('Feedback exported to CSV (simulated)');
}

// Pagination navigation
function navigatePage(direction) {
    // In a real app, you would implement pagination
    console.log(`Navigating to ${direction} page`);
}