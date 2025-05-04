document.addEventListener('DOMContentLoaded', function() {
    // Initialize members table
    initMembersTable();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load members data
    loadMembers();
});

// Initialize members table
function initMembersTable() {
    // In a real app, you might use a library like DataTables
    console.log('Members table initialized');
}

// Set up event listeners
function setupEventListeners() {
    // Add member button
    document.getElementById('add-member-btn').addEventListener('click', function() {
        openMemberModal();
    });
    
    // Close modal button
    document.getElementById('close-modal').addEventListener('click', function() {
        closeMemberModal();
    });
    
    // Cancel button
    document.getElementById('cancel-member').addEventListener('click', function() {
        closeMemberModal();
    });
    
    // Member form submission
    document.getElementById('member-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveMember();
    });
    
    // Search input
    document.getElementById('member-search').addEventListener('input', function() {
        filterMembers(this.value);
    });
    
    // Filter dropdown
    document.getElementById('members-filter').addEventListener('change', function() {
        filterMembersByStatus(this.value);
    });
    
    // Export button
    document.getElementById('export-members').addEventListener('click', function() {
        exportMembers();
    });
    
    // Pagination buttons
    document.getElementById('prev-page').addEventListener('click', function() {
        navigatePage('prev');
    });
    
    document.getElementById('next-page').addEventListener('click', function() {
        navigatePage('next');
    });
}

// Open member modal
function openMemberModal(member = null) {
    const modal = document.getElementById('member-modal');
    const form = document.getElementById('member-form');
    
    if (member) {
        // Edit mode
        document.getElementById('modal-title').textContent = 'Edit Member';
        document.getElementById('member-id').value = member.id;
        document.getElementById('member-name').value = member.name;
        document.getElementById('member-email').value = member.email;
        document.getElementById('member-phone').value = member.phone;
        document.getElementById('member-dob').value = member.dob ? member.dob.split('T')[0] : '';
        document.getElementById('member-join-date').value = member.join_date ? member.join_date.split('T')[0] : '';
        document.getElementById('member-status').value = member.status || 'active';
        document.getElementById('member-notes').value = member.notes || '';
    } else {
        // Add mode
        document.getElementById('modal-title').textContent = 'Add New Member';
        form.reset();
        document.getElementById('member-id').value = '';
        document.getElementById('member-join-date').value = new Date().toISOString().split('T')[0];
    }
    
    modal.classList.add('active');
}

// Close member modal
function closeMemberModal() {
    document.getElementById('member-modal').classList.remove('active');
}

// Load members data
async function loadMembers() {
    try {
        const response = await fetch('http://127.0.0.1:5002/getData/members');
        const members = await response.json();
        displayMembers(members);
    } catch (error) {
        console.error('Error loading members:', error);
        // Fallback to local storage
        loadMembersFromLocalStorage();
    }
}

// Fallback to local storage for members
function loadMembersFromLocalStorage() {
    const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    displayMembers(members);
}

// Display members in table
function displayMembers(members) {
    const tableBody = document.querySelector('#members-table tbody');
    tableBody.innerHTML = '';
    
    if (members.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No members found</td>
            </tr>
        `;
        document.getElementById('member-count').textContent = 'Showing 0 members';
        return;
    }
    
    members.forEach(member => {
        const joinDate = member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.id}</td>
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${member.phone || 'N/A'}</td>
            <td>${joinDate}</td>
            <td><span class="status-badge status-${member.status || 'active'}">${member.status || 'active'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit" data-id="${member.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" data-id="${member.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon view" data-id="${member.id}" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.btn-icon.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const memberId = this.getAttribute('data-id');
            editMember(memberId);
        });
    });
    
    document.querySelectorAll('.btn-icon.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const memberId = this.getAttribute('data-id');
            deleteMember(memberId);
        });
    });
    
    document.querySelectorAll('.btn-icon.view').forEach(btn => {
        btn.addEventListener('click', function() {
            const memberId = this.getAttribute('data-id');
            viewMember(memberId);
        });
    });
    
    // Update member count
    document.getElementById('member-count').textContent = `Showing ${members.length} members`;
}

// Filter members by search term
function filterMembers(searchTerm) {
    const rows = document.querySelectorAll('#members-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const phone = row.cells[3].textContent.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        if (name.includes(search) || email.includes(search) || phone.includes(search)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('member-count').textContent = `Showing ${visibleCount} members`;
}

// Filter members by status
function filterMembersByStatus(status) {
    if (status === 'all') {
        document.querySelectorAll('#members-table tbody tr').forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    let visibleCount = 0;
    document.querySelectorAll('#members-table tbody tr').forEach(row => {
        const statusBadge = row.cells[5].querySelector('.status-badge');
        if (statusBadge.classList.contains(`status-${status}`)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('member-count').textContent = `Showing ${visibleCount} members`;
}

// Edit member
async function editMember(memberId) {
    try {
        const response = await fetch(`http://127.0.0.1:5002/getData/members/${memberId}`);
        const member = await response.json();
        openMemberModal(member);
    } catch (error) {
        console.error('Error fetching member:', error);
        // Fallback to local storage
        const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
        const member = members.find(m => m.id == memberId);
        if (member) {
            openMemberModal(member);
        } else {
            alert('Member not found');
        }
    }
}

// View member details
function viewMember(memberId) {
    // In a real app, you would redirect to a member details page
    console.log('View member:', memberId);
    alert(`Viewing member ${memberId} details`);
}

// Delete member
async function deleteMember(memberId) {
    if (!confirm('Are you sure you want to delete this member?')) return;
    
    try {
        const response = await fetch(`http://127.0.0.1:5002/deleteMember/${memberId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local storage if exists
            let members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
            members = members.filter(m => m.id != memberId);
            localStorage.setItem('gymMembers', JSON.stringify(members));
            
            alert('Member deleted successfully');
            loadMembers();
        } else {
            throw new Error('Failed to delete member');
        }
    } catch (error) {
        console.error('Error deleting member:', error);
        alert('Error deleting member');
    }
}

// Save member (create or update)
async function saveMember() {
    const form = document.getElementById('member-form');
    const memberId = document.getElementById('member-id').value;
    const isEdit = !!memberId;
    
    const memberData = {
        name: document.getElementById('member-name').value,
        email: document.getElementById('member-email').value,
        phone: document.getElementById('member-phone').value,
        dob: document.getElementById('member-dob').value,
        join_date: document.getElementById('member-join-date').value,
        status: document.getElementById('member-status').value,
        notes: document.getElementById('member-notes').value
    };
    
    // Basic validation
    if (!memberData.name || !memberData.email || !memberData.phone) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        let response;
        
        if (isEdit) {
            // Update existing member
            response = await fetch(`http://127.0.0.1:5002/updateMember/${memberId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(memberData)
            });
        } else {
            // Create new member
            response = await fetch('http://127.0.0.1:5002/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...memberData,
                    password: 'default123' // In a real app, generate a random password
                })
            });
        }
        
        if (response.ok) {
            const result = await response.json();
            
            // Update local storage
            let members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
            
            if (isEdit) {
                members = members.map(m => m.id == memberId ? { ...m, ...memberData } : m);
            } else {
                members.push({
                    id: result.id || Date.now(),
                    ...memberData
                });
            }
            
            localStorage.setItem('gymMembers', JSON.stringify(members));
            
            alert(`Member ${isEdit ? 'updated' : 'added'} successfully`);
            closeMemberModal();
            loadMembers();
        } else {
            throw new Error('Failed to save member');
        }
    } catch (error) {
        console.error('Error saving member:', error);
        alert('Error saving member');
    }
}

// Export members to CSV
function exportMembers() {
    // In a real app, you would generate a CSV file
    console.log('Exporting members to CSV');
    alert('Members exported to CSV (simulated)');
}

// Pagination navigation
function navigatePage(direction) {
    // In a real app, you would implement pagination
    console.log(`Navigating to ${direction} page`);
}