document.addEventListener('DOMContentLoaded', function() {
    // Initialize contacts table
    initContactsTable();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load contacts data
    loadContacts();
});

// Initialize contacts table
function initContactsTable() {
    // Set default dates for date range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('start-date').value = firstDayOfMonth.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
    
    console.log('Contacts table initialized');
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('contact-search').addEventListener('input', function() {
        filterContacts(this.value);
    });
    
    // Date range changes
    document.getElementById('start-date').addEventListener('change', function() {
        filterContactsByDate();
    });
    
    document.getElementById('end-date').addEventListener('change', function() {
        filterContactsByDate();
    });
    
    // Filter dropdown
    document.getElementById('contacts-filter').addEventListener('change', function() {
        filterContactsByStatus(this.value);
    });
    
    // Export button
    document.getElementById('export-contacts').addEventListener('click', function() {
        exportContacts();
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
        closeContactModal();
    });
    
    // Mark as read button
    document.getElementById('mark-read').addEventListener('click', function() {
        const contactId = this.getAttribute('data-id');
        if (contactId) markAsRead(contactId);
    });
    
    // Reply form submission
    document.getElementById('reply-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const contactId = document.getElementById('mark-read').getAttribute('data-id');
        if (contactId) sendReply(contactId);
    });
}

// Load contacts data
async function loadContacts() {
    try {
        const response = await fetch('http://127.0.0.1:5002/getData/contacts?_sort=created_at&_order=desc');
        const contacts = await response.json();
        
        // Calculate summary stats
        calculateContactStats(contacts);
        
        // Display contacts
        displayContacts(contacts);
    } catch (error) {
        console.error('Error loading contacts:', error);
        // Fallback to local storage
        loadContactsFromLocalStorage();
    }
}

// Fallback to local storage for contacts
function loadContactsFromLocalStorage() {
    const contacts = JSON.parse(localStorage.getItem('gymContacts') || '[]');
    
    // Calculate summary stats
    calculateContactStats(contacts);
    
    // Display contacts
    displayContacts(contacts);
}

// Calculate contact statistics
function calculateContactStats(contacts) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    let totalContacts = contacts.length;
    let monthlyContacts = 0;
    let unreadContacts = 0;
    
    contacts.forEach(contact => {
        const contactDate = new Date(contact.created_at || contact.date);
        
        // Monthly contacts
        if (contactDate.getMonth() + 1 === currentMonth && contactDate.getFullYear() === currentYear) {
            monthlyContacts++;
        }
        
        // Unread contacts
        if (!contact.read) {
            unreadContacts++;
        }
    });
    
    // Update summary cards
    document.getElementById('total-contacts').textContent = totalContacts;
    document.getElementById('monthly-contacts').textContent = monthlyContacts;
    document.getElementById('unread-contacts').textContent = unreadContacts;
}

// Display contacts in table
function displayContacts(contacts) {
    const tableBody = document.querySelector('#contacts-table tbody');
    tableBody.innerHTML = '';
    
    if (contacts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No contacts found</td>
            </tr>
        `;
        document.getElementById('contact-count').textContent = 'Showing 0 contacts';
        return;
    }
    
    contacts.forEach(contact => {
        // Format contact date
        const contactDate = new Date(contact.created_at || contact.date);
        const formattedDate = contactDate.toLocaleDateString();
        
        // Determine status
        let status = 'read';
        let statusText = 'Read';
        
        if (contact.replied) {
            status = 'replied';
            statusText = 'Replied';
        } else if (!contact.read) {
            status = 'unread';
            statusText = 'Unread';
        }
        
        const row = document.createElement('tr');
        if (!contact.read) {
            row.style.fontWeight = '600';
        }
        
        row.innerHTML = `
            <td>${contact.id}</td>
            <td>${contact.name}</td>
            <td>${contact.email}</td>
            <td>${contact.subject}</td>
            <td>${formattedDate}</td>
            <td><span class="status-badge status-${status}">${statusText}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon view" data-id="${contact.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon reply" data-id="${contact.id}" title="Reply">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button class="btn-icon delete" data-id="${contact.id}" title="Delete">
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
            const contactId = this.getAttribute('data-id');
            viewContactDetails(contactId);
        });
    });
    
    document.querySelectorAll('.btn-icon.reply').forEach(btn => {
        btn.addEventListener('click', function() {
            const contactId = this.getAttribute('data-id');
            replyToContact(contactId);
        });
    });
    
    document.querySelectorAll('.btn-icon.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const contactId = this.getAttribute('data-id');
            deleteContact(contactId);
        });
    });
    
    // Update contact count
    document.getElementById('contact-count').textContent = `Showing ${contacts.length} contacts`;
}

// Filter contacts by search term
function filterContacts(searchTerm) {
    const rows = document.querySelectorAll('#contacts-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const subject = row.cells[3].textContent.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        if (name.includes(search) || email.includes(search) || subject.includes(search)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('contact-count').textContent = `Showing ${visibleCount} contacts`;
}

// Filter contacts by date range
function filterContactsByDate() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) return;
    
    const rows = document.querySelectorAll('#contacts-table tbody tr');
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
    
    document.getElementById('contact-count').textContent = `Showing ${visibleCount} contacts`;
}

// Filter contacts by status
function filterContactsByStatus(status) {
    if (status === 'all') {
        document.querySelectorAll('#contacts-table tbody tr').forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    let visibleCount = 0;
    document.querySelectorAll('#contacts-table tbody tr').forEach(row => {
        const statusBadge = row.cells[5].querySelector('.status-badge');
        if (statusBadge.classList.contains(`status-${status}`)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('contact-count').textContent = `Showing ${visibleCount} contacts`;
}

// View contact details
async function viewContactDetails(contactId) {
    try {
        const response = await fetch(`http://127.0.0.1:5002/getData/contacts/${contactId}`);
        const contact = await response.json();
        
        // Format contact date
        const contactDate = new Date(contact.created_at || contact.date);
        const formattedDate = contactDate.toLocaleDateString() + ' ' + contactDate.toLocaleTimeString();
        
        // Update modal with contact details
        document.getElementById('contact-id').textContent = contact.id;
        document.getElementById('contact-name').textContent = contact.name;
        document.getElementById('contact-email').textContent = contact.email;
        document.getElementById('contact-subject').textContent = contact.subject;
        document.getElementById('contact-date').textContent = formattedDate;
        document.getElementById('contact-message').textContent = contact.message;
        
        // Set default reply subject
        document.getElementById('reply-subject').value = `Re: ${contact.subject}`;
        
        // Set data-id on mark as read button
        document.getElementById('mark-read').setAttribute('data-id', contactId);
        
        // Open modal
        document.getElementById('contact-modal').classList.add('active');
        
        // Mark as read if unread
        if (!contact.read) {
            markAsRead(contactId);
        }
        
    } catch (error) {
        console.error('Error fetching contact details:', error);
        alert('Error loading contact details');
    }
}

// Close contact modal
function closeContactModal() {
    document.getElementById('contact-modal').classList.remove('active');
}

// Mark contact as read
async function markAsRead(contactId) {
    try {
        const response = await fetch(`http://127.0.0.1:5002/markContactRead/${contactId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ read: true })
        });
        
        if (response.ok) {
            // Update local storage if exists
            let contacts = JSON.parse(localStorage.getItem('gymContacts') || '[]');
            contacts = contacts.map(c => {
                if (c.id == contactId) {
                    return { ...c, read: true };
                }
                return c;
            });
            localStorage.setItem('gymContacts', JSON.stringify(contacts));
            
            // Reload contacts to update counts and status
            loadContacts();
            
            // Update the row in the table if it exists
            const row = document.querySelector(`tr td:first-child:contains("${contactId}")`)?.parentElement;
            if (row) {
                const statusCell = row.cells[5];
                statusCell.innerHTML = '<span class="status-badge status-read">Read</span>';
                row.style.fontWeight = 'normal';
            }
        } else {
            throw new Error('Failed to mark as read');
        }
    } catch (error) {
        console.error('Error marking contact as read:', error);
    }
}

// Send reply to contact
async function sendReply(contactId) {
    const subject = document.getElementById('reply-subject').value;
    const message = document.getElementById('reply-message').value;
    
    if (!subject || !message) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // In a real app, you would send the email here
        // For demo purposes, we'll just mark it as replied
        
        const response = await fetch(`http://127.0.0.1:5002/markContactReplied/${contactId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ replied: true })
        });
        
        if (response.ok) {
            // Update local storage if exists
            let contacts = JSON.parse(localStorage.getItem('gymContacts') || '[]');
            contacts = contacts.map(c => {
                if (c.id == contactId) {
                    return { ...c, replied: true };
                }
                return c;
            });
            localStorage.setItem('gymContacts', JSON.stringify(contacts));
            
            // Reset form
            document.getElementById('reply-form').reset();
            
            // Show success message
            alert('Reply sent successfully');
            
            // Close modal
            closeContactModal();
            
            // Reload contacts to update counts and status
            loadContacts();
        } else {
            throw new Error('Failed to send reply');
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        alert('Error sending reply');
    }
}

// Reply to contact
async function replyToContact(contactId) {
    // First view the contact details
    await viewContactDetails(contactId);
    
    // Focus on the reply form
    document.getElementById('reply-message').focus();
}

// Delete contact
async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
        const response = await fetch(`http://127.0.0.1:5002/deleteContact/${contactId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local storage if exists
            let contacts = JSON.parse(localStorage.getItem('gymContacts') || '[]');
            contacts = contacts.filter(c => c.id != contactId);
            localStorage.setItem('gymContacts', JSON.stringify(contacts));
            
            alert('Contact deleted successfully');
            loadContacts();
        } else {
            throw new Error('Failed to delete contact');
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Error deleting contact');
    }
}

// Export contacts to CSV
function exportContacts() {
    // In a real app, you would generate a CSV file
    console.log('Exporting contacts to CSV');
    alert('Contacts exported to CSV (simulated)');
}

// Pagination navigation
function navigatePage(direction) {
    // In a real app, you would implement pagination
    console.log(`Navigating to ${direction} page`);
}