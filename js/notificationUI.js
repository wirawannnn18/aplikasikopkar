// Notification UI Module

/**
 * Initialize notification UI
 * Called after login
 */
function initializeNotificationUI() {
    if (!currentUser) return;
    
    // Load and display notifications
    updateNotificationUI();
    
    // Set up auto-refresh every 30 seconds
    setInterval(updateNotificationUI, 30000);
}

/**
 * Update notification UI (badge and list)
 */
function updateNotificationUI() {
    if (!currentUser) return;
    
    // Get unread notifications
    const unreadNotifications = getNotificationsByUser(currentUser.id, true);
    
    // Update badge
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (unreadNotifications.length > 0) {
            badge.textContent = unreadNotifications.length > 99 ? '99+' : unreadNotifications.length;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // Update notification list
    updateNotificationList();
}

/**
 * Update notification list in dropdown
 */
function updateNotificationList() {
    if (!currentUser) return;
    
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    // Get all notifications (limit to 10 most recent)
    const notifications = getNotificationsByUser(currentUser.id, false).slice(0, 10);
    
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <li class="text-center py-3 text-muted">
                <i class="bi bi-bell-slash"></i><br>
                <small>Tidak ada notifikasi</small>
            </li>
        `;
        return;
    }
    
    notificationList.innerHTML = notifications.map(n => {
        const isUnread = !n.read;
        const bgClass = isUnread ? 'bg-light' : '';
        const iconClass = getNotificationIcon(n.type);
        const iconColor = getNotificationIconColor(n.type);
        
        return `
            <li>
                <a class="dropdown-item ${bgClass}" href="#" 
                    onclick="handleNotificationClick('${n.id}'); return false;"
                    style="padding: 12px 16px; border-bottom: 1px solid #eee;">
                    <div class="d-flex align-items-start">
                        <div class="me-2" style="font-size: 1.5rem; color: ${iconColor};">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <strong style="font-size: 0.9rem;">${n.title}</strong>
                                ${isUnread ? '<span class="badge bg-primary" style="font-size: 0.65rem;">Baru</span>' : ''}
                            </div>
                            <p class="mb-1" style="font-size: 0.85rem; color: #666;">${n.message}</p>
                            <small class="text-muted" style="font-size: 0.75rem;">
                                <i class="bi bi-clock"></i> ${formatNotificationTime(n.createdAt)}
                            </small>
                        </div>
                    </div>
                </a>
            </li>
        `;
    }).join('');
}

/**
 * Get notification icon based on type
 * @param {string} type - Notification type
 * @returns {string} Icon class
 */
function getNotificationIcon(type) {
    const icons = {
        'success': 'bi bi-check-circle-fill',
        'error': 'bi bi-x-circle-fill',
        'warning': 'bi bi-exclamation-triangle-fill',
        'info': 'bi bi-info-circle-fill'
    };
    return icons[type] || 'bi bi-bell-fill';
}

/**
 * Get notification icon color based on type
 * @param {string} type - Notification type
 * @returns {string} Color code
 */
function getNotificationIconColor(type) {
    const colors = {
        'success': '#28a745',
        'error': '#dc3545',
        'warning': '#ffc107',
        'info': '#17a2b8'
    };
    return colors[type] || '#6c757d';
}

/**
 * Format notification time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
function formatNotificationTime(timestamp) {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return 'Baru saja';
    } else if (diffMins < 60) {
        return `${diffMins} menit yang lalu`;
    } else if (diffHours < 24) {
        return `${diffHours} jam yang lalu`;
    } else if (diffDays < 7) {
        return `${diffDays} hari yang lalu`;
    } else {
        return notifTime.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }
}

/**
 * Handle notification click
 * @param {string} notificationId - ID notifikasi
 */
function handleNotificationClick(notificationId) {
    // Mark as read
    markNotificationAsRead(notificationId);
    
    // Get notification data
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) return;
    
    // Update UI
    updateNotificationUI();
    
    // Handle navigation based on notification data
    if (notification.data && notification.data.type) {
        switch (notification.data.type) {
            case 'approval':
            case 'rejection':
                // Navigate to riwayat pengajuan kasir
                if (currentUser.role === 'kasir') {
                    navigateTo('riwayat-pengajuan-kasir');
                }
                break;
            default:
                // Do nothing, just mark as read
                break;
        }
    }
}

/**
 * Mark all notifications as read
 */
function markAllNotificationsAsRead() {
    if (!currentUser) return;
    
    const notifications = getNotificationsByUser(currentUser.id, true);
    
    notifications.forEach(n => {
        markNotificationAsRead(n.id);
    });
    
    updateNotificationUI();
    showAlert('Semua notifikasi ditandai sebagai dibaca', 'success');
}

/**
 * Show notification toast (for real-time notifications)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 */
function showNotificationToast(title, message, type = 'info') {
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const iconClass = getNotificationIcon(type);
    const iconColor = getNotificationIconColor(type);
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center border-0" role="alert" aria-live="assertive" aria-atomic="true"
            style="position: fixed; top: 80px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-start">
                    <div class="me-2" style="font-size: 1.5rem; color: ${iconColor};">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <strong>${title}</strong><br>
                        <small>${message}</small>
                    </div>
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    
    // Show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    toast.show();
    
    // Remove from DOM after hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
    
    // Update notification UI
    updateNotificationUI();
}

/**
 * Check for new notifications (polling)
 * This function can be called periodically to check for new notifications
 */
function checkNewNotifications() {
    if (!currentUser) return;
    
    // Get current unread count
    const currentUnread = getNotificationsByUser(currentUser.id, true).length;
    
    // Store in session for comparison
    const lastUnreadCount = parseInt(sessionStorage.getItem('lastUnreadCount') || '0');
    
    if (currentUnread > lastUnreadCount) {
        // New notification(s) received
        const newNotifications = getNotificationsByUser(currentUser.id, true).slice(0, currentUnread - lastUnreadCount);
        
        // Show toast for the most recent one
        if (newNotifications.length > 0) {
            const latest = newNotifications[0];
            showNotificationToast(latest.title, latest.message, latest.type);
        }
    }
    
    // Update stored count
    sessionStorage.setItem('lastUnreadCount', currentUnread.toString());
}

/**
 * Initialize notification polling
 * Called after login
 */
function startNotificationPolling() {
    if (!currentUser) return;
    
    // Initialize count
    const unreadCount = getNotificationsByUser(currentUser.id, true).length;
    sessionStorage.setItem('lastUnreadCount', unreadCount.toString());
    
    // Poll every 10 seconds
    setInterval(checkNewNotifications, 10000);
}
