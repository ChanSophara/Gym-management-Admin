document.addEventListener('DOMContentLoaded', function() {
    // Initialize trainers table
    initTrainersTable();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load trainers data
    loadTrainers();
});

// Initialize trainers table
function initTrainersTable() {
    // In a real app, you might use a library like DataTables
    console.log('Trainers table initialized');
}

// Set up event listeners
function setupEventListeners() {
    // Add trainer button
    document.getElementById('add-trainer-btn').addEventListener('click', function() {
        openTrainerModal();
    });
    
    // Close modal button
    document.getElementById('close-modal').addEventListener('click', function() {
        closeTrainerModal();
    });
    
    // Cancel button
    document.getElementById('cancel-trainer').addEventListener('click', function() {
        closeTrainerModal();
    });
    
    // Trainer form submission
    document.getElementById('trainer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveTrainer();
    });
    
    // Search input
    document.getElementById('trainer-search').addEventListener('input', function() {
        filterTrainers(this.value);
    });
    
    // Filter dropdown
    document.getElementById('trainers-filter').addEventListener('change', function() {
        filterTrainersByStatus(this.value);
    });
    
    // Export button
    document.getElementById('export-trainers').addEventListener('click', function() {
        exportTrainers();
    });
    
    // Pagination buttons
    document.getElementById('prev-page').addEventListener('click', function() {
        navigatePage('prev');
    });
    
    document.getElementById('next-page').addEventListener('click', function() {
        navigatePage('next');
    });
}

// Open trainer modal
function openTrainerModal(trainer = null) {
    const modal = document.getElementById('trainer-modal');
    const form = document.getElementById('trainer-form');
    
    if (trainer) {
        // Edit mode
        document.getElementById('modal-title').textContent = 'Edit Trainer';
        document.getElementById('trainer-id').value = trainer.id;
        document.getElementById('trainer-name').value = trainer.name;
        document.getElementById('trainer-email').value = trainer.email;
        document.getElementById('trainer-specialty').value = trainer.specialty;
        document.getElementById('trainer-experience').value = trainer.experience;
        document.getElementById('trainer-schedule').value = trainer.schedule || '';
        document.getElementById('trainer-status').value = trainer.status || 'active';
        document.getElementById('trainer-bio').value = trainer.bio || '';
    } else {
        // Add mode
        document.getElementById('modal-title').textContent = 'Add New Trainer';
        form.reset();
        document.getElementById('trainer-id').value = '';
    }
    
    modal.classList.add('active');
}

// Close trainer modal
function closeTrainerModal() {
    document.getElementById('trainer-modal').classList.remove('active');
}

// Load trainers data
async function loadTrainers() {
    try {
        const response = await fetch('http://127.0.0.1:5002/getData/trainers');
        const trainers = await response.json();
        displayTrainers(trainers);
    } catch (error) {
        console.error('Error loading trainers:', error);
        // Fallback to local storage
        loadTrainersFromLocalStorage();
    }
}

// Fallback to local storage for trainers
function loadTrainersFromLocalStorage() {
    const trainers = JSON.parse(localStorage.getItem('gymTrainers') || '[]');
    displayTrainers(trainers);
}

// Display trainers in table
function displayTrainers(trainers) {
    const tableBody = document.querySelector('#trainers-table tbody');
    tableBody.innerHTML = '';
    
    if (trainers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No trainers found</td>
            </tr>
        `;
        document.getElementById('trainer-count').textContent = 'Showing 0 trainers';
        return;
    }
    
    trainers.forEach(trainer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trainer.id}</td>
            <td>${trainer.name}</td>
            <td>${trainer.specialty || 'N/A'}</td>
            <td>${trainer.experience || '0'} years</td>
            <td class="rating">${trainer.rating ? trainer.rating + '⭐' : 'N/A'}</td>
            <td><span class="status-badge status-${trainer.status || 'active'}">${trainer.status || 'active'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit" data-id="${trainer.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" data-id="${trainer.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon view" data-id="${trainer.id}" title="View">
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
            const trainerId = this.getAttribute('data-id');
            editTrainer(trainerId);
        });
    });
    
    document.querySelectorAll('.btn-icon.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const trainerId = this.getAttribute('data-id');
            deleteTrainer(trainerId);
        });
    });
    
    document.querySelectorAll('.btn-icon.view').forEach(btn => {
        btn.addEventListener('click', function() {
            const trainerId = this.getAttribute('data-id');
            viewTrainer(trainerId);
        });
    });
    
    // Update trainer count
    document.getElementById('trainer-count').textContent = `Showing ${trainers.length} trainers`;
}

// Filter trainers by search term
function filterTrainers(searchTerm) {
    const rows = document.querySelectorAll('#trainers-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const specialty = row.cells[2].textContent.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        if (name.includes(search) || specialty.includes(search)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('trainer-count').textContent = `Showing ${visibleCount} trainers`;
}

// Filter trainers by status
function filterTrainersByStatus(status) {
    if (status === 'all') {
        document.querySelectorAll('#trainers-table tbody tr').forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    let visibleCount = 0;
    document.querySelectorAll('#trainers-table tbody tr').forEach(row => {
        const statusBadge = row.cells[5].querySelector('.status-badge');
        if (statusBadge.classList.contains(`status-${status}`)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('trainer-count').textContent = `Showing ${visibleCount} trainers`;
}

// Edit trainer
async function editTrainer(trainerId) {
    try {
        const response = await fetch(`http://127.0.0.1:5002/getData/trainers/${trainerId}`);
        const trainer = await response.json();
        openTrainerModal(trainer);
    } catch (error) {
        console.error('Error fetching trainer:', error);
        // Fallback to local storage
        const trainers = JSON.parse(localStorage.getItem('gymTrainers') || '[]');
        const trainer = trainers.find(t => t.id == trainerId);
        if (trainer) {
            openTrainerModal(trainer);
        } else {
            alert('Trainer not found');
        }
    }
}

// View trainer details
function viewTrainer(trainerId) {
    // In a real app, you would redirect to a trainer details page
    console.log('View trainer:', trainerId);
    alert(`Viewing trainer ${trainerId} details`);
}

// Delete trainer
async function deleteTrainer(trainerId) {
    if (!confirm('Are you sure you want to delete this trainer?')) return;
    
    try {
        const response = await fetch(`http://127.0.0.1:5002/deleteTrainer/${trainerId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local storage if exists
            let trainers = JSON.parse(localStorage.getItem('gymTrainers') || '[]');
            trainers = trainers.filter(t => t.id != trainerId);
            localStorage.setItem('gymTrainers', JSON.stringify(trainers));
            
            alert('Trainer deleted successfully');
            loadTrainers();
        } else {
            throw new Error('Failed to delete trainer');
        }
    } catch (error) {
        console.error('Error deleting trainer:', error);
        alert('Error deleting trainer');
    }
}

// Save trainer (create or update)
async function saveTrainer() {
    const form = document.getElementById('trainer-form');
    const trainerId = document.getElementById('trainer-id').value;
    const isEdit = !!trainerId;
    
    const trainerData = {
        name: document.getElementById('trainer-name').value,
        email: document.getElementById('trainer-email').value,
        specialty: document.getElementById('trainer-specialty').value,
        experience: document.getElementById('trainer-experience').value,
        schedule: document.getElementById('trainer-schedule').value,
        status: document.getElementById('trainer-status').value,
        bio: document.getElementById('trainer-bio').value
    };
    
    // Basic validation
    if (!trainerData.name || !trainerData.email || !trainerData.specialty) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        let response;
        
        if (isEdit) {
            // Update existing trainer
            response = await fetch(`http://127.0.0.1:5002/updateTrainer/${trainerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(trainerData)
            });
        } else {
            // Create new trainer
            response = await fetch('http://127.0.0.1:5002/addTrainer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(trainerData)
            });
        }
        
        if (response.ok) {
            const result = await response.json();
            
            // Update local storage
            let trainers = JSON.parse(localStorage.getItem('gymTrainers') || '[]');
            
            if (isEdit) {
                trainers = trainers.map(t => t.id == trainerId ? { ...t, ...trainerData } : t);
            } else {
                trainers.push({
                    id: result.id || Date.now(),
                    ...trainerData
                });
            }
            
            localStorage.setItem('gymTrainers', JSON.stringify(trainers));
            
            alert(`Trainer ${isEdit ? 'updated' : 'added'} successfully`);
            closeTrainerModal();
            loadTrainers();
        } else {
            throw new Error('Failed to save trainer');
        }
    } catch (error) {
        console.error('Error saving trainer:', error);
        alert('Error saving trainer');
    }
}

// Export trainers to CSV
function exportTrainers() {
    // In a real app, you would generate a CSV file
    console.log('Exporting trainers to CSV');
    alert('Trainers exported to CSV (simulated)');
}

// Pagination navigation
function navigatePage(direction) {
    // In a real app, you would implement pagination
    console.log(`Navigating to ${direction} page`);
}