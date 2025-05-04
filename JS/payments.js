document.addEventListener('DOMContentLoaded', function() {
    // Initialize payments table
    initPaymentsTable();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load payments data
    loadPayments();
});

// Initialize payments table
function initPaymentsTable() {
    // Set default dates for date range (current month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('start-date').valueAsDate = firstDayOfMonth;
    document.getElementById('end-date').valueAsDate = today;
    
    console.log('Payments table initialized with default date range');
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('payment-search').addEventListener('input', function() {
        filterPayments(this.value);
    });
    
    // Date range changes
    document.getElementById('start-date').addEventListener('change', function() {
        filterPaymentsByDate();
    });
    
    document.getElementById('end-date').addEventListener('change', function() {
        filterPaymentsByDate();
    });
    
    // Filter dropdown
    document.getElementById('payments-filter').addEventListener('change', function() {
        filterPaymentsByMethod(this.value);
    });
    
    // Export button
    document.getElementById('export-payments').addEventListener('click', function() {
        exportPayments();
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
        closePaymentModal();
    });
    
    document.getElementById('close-details').addEventListener('click', function() {
        closePaymentModal();
    });
}

// Load payments data
async function loadPayments() {
    try {
        showLoading(true);
        
        const [paymentsRes, membersRes] = await Promise.all([
            fetch('http://127.0.0.1:5002/getData/payments?_sort=payment_date&_order=desc'),
            fetch('http://127.0.0.1:5002/getData/members')
        ]);
        
        if (!paymentsRes.ok) throw new Error(`Payments fetch failed with status ${paymentsRes.status}`);
        if (!membersRes.ok) throw new Error(`Members fetch failed with status ${membersRes.status}`);
        
        const payments = await paymentsRes.json();
        const members = await membersRes.json();
        
        // Validate and normalize payments data
        const normalizedPayments = payments.map(payment => ({
            id: payment.id || Date.now().toString(),
            member_id: payment.member_id || null,
            amount: parseFloat(payment.amount) || parseFloat(payment.total_amount) || 0,
            payment_method: payment.payment_method?.toLowerCase() || 'cash',
            items: parsePaymentItems(payment.items),
            payment_date: payment.payment_date || payment.date || new Date().toISOString(),
            promo_used: payment.promo_used || null
        }));
        
        // Store in localStorage as fallback
        localStorage.setItem('gymPayments', JSON.stringify(normalizedPayments));
        localStorage.setItem('gymMembers', JSON.stringify(members));
        
        calculatePaymentStats(normalizedPayments);
        displayPayments(normalizedPayments, members);
        
    } catch (error) {
        console.error('Error loading payments:', error);
        showError('Failed to load payments. Using local data...');
        loadPaymentsFromLocalStorage();
    } finally {
        showLoading(false);
    }
}

// Parse payment items (handle both string and array formats)
function parsePaymentItems(items) {
    if (!items) return [];
    try {
        return typeof items === 'string' ? JSON.parse(items) : items;
    } catch (e) {
        console.error('Error parsing payment items:', e);
        return [];
    }
}

// Fallback to local storage for payments
function loadPaymentsFromLocalStorage() {
    try {
        const payments = JSON.parse(localStorage.getItem('gymPayments') || '[]');
        const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
        
        if (!Array.isArray(payments)) throw new Error('Invalid payments data');
        if (!Array.isArray(members)) throw new Error('Invalid members data');
        
        calculatePaymentStats(payments);
        displayPayments(payments, members);
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        showError('Failed to load payment data. Please try again later.');
        displayPayments([], []);
    }
}

// Calculate payment statistics
function calculatePaymentStats(payments) {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let dailyRevenue = 0;
    
    payments.forEach(payment => {
        const paymentDate = new Date(payment.payment_date);
        const paymentDay = paymentDate.toISOString().split('T')[0];
        const amount = parseFloat(payment.amount) || 0;
        
        // Total revenue
        totalRevenue += amount;
        
        // Monthly revenue
        if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
            monthlyRevenue += amount;
        }
        
        // Daily revenue
        if (paymentDay === today) {
            dailyRevenue += amount;
        }
    });
    
    // Update summary cards
    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('monthly-revenue').textContent = formatCurrency(monthlyRevenue);
    document.getElementById('daily-revenue').textContent = formatCurrency(dailyRevenue);
}

// Format currency value
function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Display payments in table
function displayPayments(payments, members) {
    const tableBody = document.querySelector('#payments-table tbody');
    tableBody.innerHTML = '';
    
    if (!payments.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No payments found</td>
            </tr>
        `;
        updatePaymentCount(0);
        return;
    }
    
    payments.forEach(payment => {
        const member = members.find(m => m.id == payment.member_id);
        const memberName = member ? member.name : 'Unknown Member';
        const paymentDate = new Date(payment.payment_date);
        const formattedDate = paymentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.id}</td>
            <td>${memberName}</td>
            <td>${formattedDate}</td>
            <td>${formatCurrency(payment.amount)}</td>
            <td><span class="payment-method method-${payment.payment_method}">
                ${payment.payment_method.toUpperCase()}
            </span></td>
            <td>${payment.items.length} item(s)</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon view" data-id="${payment.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon refund" data-id="${payment.id}" title="Refund">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addActionButtonListeners();
    
    // Update payment count
    updatePaymentCount(payments.length);
}

// Add event listeners to action buttons
function addActionButtonListeners() {
    document.querySelectorAll('.btn-icon.view').forEach(btn => {
        btn.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-id');
            viewPaymentDetails(paymentId);
        });
    });
    
    document.querySelectorAll('.btn-icon.refund').forEach(btn => {
        btn.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-id');
            if (confirm('Are you sure you want to refund this payment?')) {
                refundPayment(paymentId);
            }
        });
    });
}

// Update payment count display
function updatePaymentCount(count) {
    document.getElementById('payment-count').textContent = `Showing ${count} payment${count !== 1 ? 's' : ''}`;
}

// Filter payments by search term
function filterPayments(searchTerm) {
    const rows = document.querySelectorAll('#payments-table tbody tr');
    let visibleCount = 0;
    const search = searchTerm.toLowerCase().trim();
    
    rows.forEach(row => {
        const member = row.cells[1].textContent.toLowerCase();
        const method = row.cells[4].textContent.toLowerCase();
        const amount = row.cells[3].textContent.toLowerCase();
        const date = row.cells[2].textContent.toLowerCase();
        
        if (member.includes(search) || method.includes(search) || 
            amount.includes(search) || date.includes(search)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    updatePaymentCount(visibleCount);
}

// Filter payments by date range
function filterPaymentsByDate() {
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);
    
    if (!startDate || !endDate) return;
    
    // Adjust end date to include the entire day
    endDate.setHours(23, 59, 59, 999);
    
    const rows = document.querySelectorAll('#payments-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const dateStr = row.cells[2].textContent;
        const rowDate = new Date(dateStr);
        
        if (rowDate >= startDate && rowDate <= endDate) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    updatePaymentCount(visibleCount);
}

// Filter payments by method
function filterPaymentsByMethod(method) {
    if (method === 'all') {
        document.querySelectorAll('#payments-table tbody tr').forEach(row => {
            row.style.display = '';
        });
        updatePaymentCount(document.querySelectorAll('#payments-table tbody tr:not([style*="display: none"])').length);
        return;
    }
    
    let visibleCount = 0;
    document.querySelectorAll('#payments-table tbody tr').forEach(row => {
        const methodSpan = row.cells[4].querySelector('.payment-method');
        if (methodSpan.classList.contains(`method-${method}`)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    updatePaymentCount(visibleCount);
}

// View payment details
async function viewPaymentDetails(paymentId) {
    try {
        showLoading(true, 'Loading payment details...');
        
        const response = await fetch(`http://127.0.0.1:5002/getData/payments/${paymentId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const payment = await response.json();
        
        if (!payment) {
            throw new Error('Payment not found');
        }
        
        // Normalize payment data
        const normalizedPayment = {
            id: payment.id,
            member_id: payment.member_id,
            amount: parseFloat(payment.amount) || 0,
            payment_method: payment.payment_method || 'cash',
            items: parsePaymentItems(payment.items),
            payment_date: payment.payment_date || new Date().toISOString(),
            promo_used: payment.promo_used || 'None'
        };
        
        // Get member name
        let memberName = 'Unknown Member';
        try {
            const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
            const member = members.find(m => m.id == normalizedPayment.member_id);
            if (member) memberName = member.name;
        } catch (e) {
            console.error('Error getting member name:', e);
        }
        
        // Format payment date
        const paymentDate = new Date(normalizedPayment.payment_date);
        const formattedDate = paymentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Update modal with payment details
        document.getElementById('payment-id').textContent = normalizedPayment.id;
        document.getElementById('payment-member').textContent = memberName;
        document.getElementById('payment-date').textContent = formattedDate;
        document.getElementById('payment-amount').textContent = formatCurrency(normalizedPayment.amount);
        document.getElementById('payment-method').textContent = normalizedPayment.payment_method.toUpperCase();
        document.getElementById('payment-promo').textContent = normalizedPayment.promo_used;
        
        // Update items list
        const itemsList = document.getElementById('payment-items-list');
        itemsList.innerHTML = '';
        
        normalizedPayment.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name || 'Unknown Item'}</td>
                <td>${formatCurrency(item.price || 0)}</td>
            `;
            itemsList.appendChild(row);
        });
        
        // Open modal
        document.getElementById('payment-modal').classList.add('active');
        
    } catch (error) {
        console.error('Error fetching payment details:', error);
        showError('Failed to load payment details: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Close payment modal
function closePaymentModal() {
    document.getElementById('payment-modal').classList.remove('active');
}

// Refund payment
async function refundPayment(paymentId) {
    try {
        showLoading(true, 'Processing refund...');
        
        const response = await fetch(`http://127.0.0.1:5002/refundPayment/${paymentId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.message) {
            showSuccess(result.message);
            loadPayments(); // Refresh the payments list
        } else {
            throw new Error('Invalid response from server');
        }
        
    } catch (error) {
        console.error('Error refunding payment:', error);
        showError('Failed to process refund: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Export payments to CSV
function exportPayments() {
    try {
        const rows = document.querySelectorAll('#payments-table tbody tr:not([style*="display: none"])');
        if (rows.length === 0) {
            showError('No payments to export');
            return;
        }
        
        let csvContent = "ID,Member,Date,Amount,Method,Items\n";
        
        rows.forEach(row => {
            const cells = row.cells;
            const rowData = [
                cells[0].textContent,
                `"${cells[1].textContent}"`,
                cells[2].textContent,
                cells[3].textContent.replace('$', ''),
                cells[4].textContent,
                cells[5].textContent
            ];
            csvContent += rowData.join(',') + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `payments_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess('Payments exported successfully');
        
    } catch (error) {
        console.error('Error exporting payments:', error);
        showError('Failed to export payments');
    }
}

// Pagination navigation
function navigatePage(direction) {
    // In a real app, you would implement pagination
    console.log(`Navigating to ${direction} page`);
    showInfo('Pagination not yet implemented');
}

// Show loading state
function showLoading(show, message = 'Loading...') {
    const loader = document.getElementById('loading-overlay') || createLoaderElement();
    loader.querySelector('.loading-message').textContent = message;
    loader.style.display = show ? 'flex' : 'none';
}

function createLoaderElement() {
    const loader = document.createElement('div');
    loader.id = 'loading-overlay';
    loader.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <p class="loading-message">Loading...</p>
        </div>
    `;
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    document.body.appendChild(loader);
    return loader;
}

// Show error message
function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Show info message
function showInfo(message) {
    const notification = document.createElement('div');
    notification.className = 'notification info';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}