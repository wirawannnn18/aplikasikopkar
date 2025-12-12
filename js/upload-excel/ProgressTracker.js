/**
 * Progress Tracking System for Excel Upload
 * Provides real-time progress updates and UI management
 * 
 * Requirements: 1.5, 5.1, 5.2
 */

class ProgressTracker {
    constructor(options = {}) {
        this.container = options.container || null;
        this.progressCallback = options.progressCallback || null;
        this.showPercentage = options.showPercentage !== false;
        this.showETA = options.showETA !== false;
        this.showSpeed = options.showSpeed !== false;
        this.showDetails = options.showDetails !== false;
        this.animateProgress = options.animateProgress !== false;
        this.updateInterval = options.updateInterval || 100; // ms
        
        // Progress state
        this.currentProgress = 0;
        this.totalItems = 0;
        this.processedItems = 0;
        this.startTime = null;
        this.lastUpdateTime = null;
        this.isActive = false;
        this.isPaused = false;
        this.isCompleted = false;
        
        // Performance tracking
        this.processingHistory = [];
        this.maxHistorySize = 50;
        
        // UI elements
        this.progressBar = null;
        this.percentageLabel = null;
        this.etaLabel = null;
        this.speedLabel = null;
        this.detailsLabel = null;
        this.statusLabel = null;
        
        // Initialize UI if container provided
        if (this.container) {
            this.initializeUI();
        }
    }

    /**
     * Initialize the progress UI elements
     */
    initializeUI() {
        if (!this.container) return;

        // Create main progress container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-tracker-container';
        progressContainer.innerHTML = `
            <div class="progress-header">
                <div class="progress-status">Ready</div>
                <div class="progress-percentage">0%</div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
            <div class="progress-details">
                <div class="progress-eta">ETA: --</div>
                <div class="progress-speed">Speed: --</div>
                <div class="progress-items">Items: 0/0</div>
            </div>
        `;

        // Clear container and add progress UI
        this.container.innerHTML = '';
        this.container.appendChild(progressContainer);

        // Get references to UI elements
        this.progressBar = progressContainer.querySelector('.progress-fill');
        this.percentageLabel = progressContainer.querySelector('.progress-percentage');
        this.etaLabel = progressContainer.querySelector('.progress-eta');
        this.speedLabel = progressContainer.querySelector('.progress-speed');
        this.detailsLabel = progressContainer.querySelector('.progress-items');
        this.statusLabel = progressContainer.querySelector('.progress-status');

        // Add CSS styles
        this.addProgressStyles();
    }

    /**
     * Add CSS styles for progress UI
     */
    addProgressStyles() {
        const styleId = 'progress-tracker-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .progress-tracker-container {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 20px;
                margin: 10px 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .progress-status {
                font-weight: 600;
                color: #495057;
            }

            .progress-percentage {
                font-weight: 700;
                font-size: 1.2em;
                color: #007bff;
            }

            .progress-bar-container {
                margin-bottom: 15px;
            }

            .progress-bar {
                width: 100%;
                height: 20px;
                background-color: #e9ecef;
                border-radius: 10px;
                overflow: hidden;
                position: relative;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #007bff, #0056b3);
                border-radius: 10px;
                width: 0%;
                transition: width 0.3s ease;
                position: relative;
            }

            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.3),
                    transparent
                );
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .progress-details {
                display: flex;
                justify-content: space-between;
                font-size: 0.9em;
                color: #6c757d;
            }

            .progress-tracker-container.completed .progress-fill {
                background: linear-gradient(90deg, #28a745, #1e7e34);
            }

            .progress-tracker-container.error .progress-fill {
                background: linear-gradient(90deg, #dc3545, #c82333);
            }

            .progress-tracker-container.paused .progress-fill {
                background: linear-gradient(90deg, #ffc107, #e0a800);
            }

            @media (max-width: 768px) {
                .progress-details {
                    flex-direction: column;
                    gap: 5px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Start progress tracking
     * @param {number} totalItems - Total number of items to process
     */
    start(totalItems) {
        this.totalItems = totalItems;
        this.processedItems = 0;
        this.currentProgress = 0;
        this.startTime = Date.now();
        this.lastUpdateTime = this.startTime;
        this.isActive = true;
        this.isPaused = false;
        this.isCompleted = false;
        this.processingHistory = [];

        this.updateStatus('Processing...');
        this.updateUI();

        // Call progress callback
        if (this.progressCallback) {
            this.progressCallback({
                type: 'start',
                progress: 0,
                processedItems: 0,
                totalItems: this.totalItems,
                startTime: this.startTime
            });
        }
    }

    /**
     * Update progress
     * @param {number} processedItems - Number of items processed
     * @param {string} currentItem - Current item being processed (optional)
     */
    updateProgress(processedItems, currentItem = null) {
        if (!this.isActive || this.isPaused) return;

        const now = Date.now();
        this.processedItems = Math.min(processedItems, this.totalItems);
        this.currentProgress = this.totalItems > 0 ? (this.processedItems / this.totalItems) * 100 : 0;
        
        // Track processing speed
        this.trackProcessingSpeed(now);
        
        this.lastUpdateTime = now;
        this.updateUI();

        // Call progress callback
        if (this.progressCallback) {
            this.progressCallback({
                type: 'progress',
                progress: this.currentProgress,
                processedItems: this.processedItems,
                totalItems: this.totalItems,
                currentItem: currentItem,
                eta: this.calculateETA(),
                speed: this.calculateSpeed(),
                elapsedTime: now - this.startTime
            });
        }
    }

    /**
     * Track processing speed for ETA calculation
     * @param {number} timestamp - Current timestamp
     */
    trackProcessingSpeed(timestamp) {
        this.processingHistory.push({
            timestamp: timestamp,
            processedItems: this.processedItems
        });

        // Keep only recent history
        if (this.processingHistory.length > this.maxHistorySize) {
            this.processingHistory.shift();
        }
    }

    /**
     * Calculate estimated time of arrival (ETA)
     * @returns {number} ETA in milliseconds
     */
    calculateETA() {
        if (this.processingHistory.length < 2 || this.processedItems === 0) {
            return null;
        }

        const speed = this.calculateSpeed();
        if (speed <= 0) return null;

        const remainingItems = this.totalItems - this.processedItems;
        return Math.round(remainingItems / speed * 1000); // Convert to milliseconds
    }

    /**
     * Calculate processing speed (items per second)
     * @returns {number} Items per second
     */
    calculateSpeed() {
        if (this.processingHistory.length < 2) return 0;

        const recent = this.processingHistory.slice(-10); // Use last 10 data points
        const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
        const itemsProcessed = recent[recent.length - 1].processedItems - recent[0].processedItems;

        if (timeSpan <= 0) return 0;

        return (itemsProcessed / timeSpan) * 1000; // Items per second
    }

    /**
     * Pause progress tracking
     */
    pause() {
        if (!this.isActive || this.isPaused) return;

        this.isPaused = true;
        this.updateStatus('Paused');
        this.container?.classList.add('paused');

        if (this.progressCallback) {
            this.progressCallback({
                type: 'pause',
                progress: this.currentProgress,
                processedItems: this.processedItems,
                totalItems: this.totalItems
            });
        }
    }

    /**
     * Resume progress tracking
     */
    resume() {
        if (!this.isActive || !this.isPaused) return;

        this.isPaused = false;
        this.updateStatus('Processing...');
        this.container?.classList.remove('paused');

        if (this.progressCallback) {
            this.progressCallback({
                type: 'resume',
                progress: this.currentProgress,
                processedItems: this.processedItems,
                totalItems: this.totalItems
            });
        }
    }

    /**
     * Complete progress tracking
     * @param {string} message - Completion message
     */
    complete(message = 'Completed') {
        this.isActive = false;
        this.isPaused = false;
        this.isCompleted = true;
        this.currentProgress = 100;
        this.processedItems = this.totalItems;

        this.updateStatus(message);
        this.updateUI();
        this.container?.classList.add('completed');

        if (this.progressCallback) {
            this.progressCallback({
                type: 'complete',
                progress: 100,
                processedItems: this.totalItems,
                totalItems: this.totalItems,
                elapsedTime: Date.now() - this.startTime,
                message: message
            });
        }
    }

    /**
     * Handle error during progress
     * @param {string} errorMessage - Error message
     */
    error(errorMessage = 'Error occurred') {
        this.isActive = false;
        this.isPaused = false;

        this.updateStatus(errorMessage);
        this.container?.classList.add('error');

        if (this.progressCallback) {
            this.progressCallback({
                type: 'error',
                progress: this.currentProgress,
                processedItems: this.processedItems,
                totalItems: this.totalItems,
                error: errorMessage
            });
        }
    }

    /**
     * Reset progress tracker
     */
    reset() {
        this.currentProgress = 0;
        this.totalItems = 0;
        this.processedItems = 0;
        this.startTime = null;
        this.lastUpdateTime = null;
        this.isActive = false;
        this.isPaused = false;
        this.isCompleted = false;
        this.processingHistory = [];

        this.updateStatus('Ready');
        this.updateUI();
        this.container?.classList.remove('completed', 'error', 'paused');

        if (this.progressCallback) {
            this.progressCallback({
                type: 'reset',
                progress: 0,
                processedItems: 0,
                totalItems: 0
            });
        }
    }

    /**
     * Update status message
     * @param {string} status - Status message
     */
    updateStatus(status) {
        if (this.statusLabel) {
            this.statusLabel.textContent = status;
        }
    }

    /**
     * Update UI elements
     */
    updateUI() {
        if (!this.container) return;

        // Update progress bar
        if (this.progressBar) {
            const width = Math.min(100, Math.max(0, this.currentProgress));
            this.progressBar.style.width = `${width}%`;
        }

        // Update percentage
        if (this.percentageLabel && this.showPercentage) {
            this.percentageLabel.textContent = `${Math.round(this.currentProgress)}%`;
        }

        // Update ETA
        if (this.etaLabel && this.showETA) {
            const eta = this.calculateETA();
            if (eta !== null && eta > 0) {
                this.etaLabel.textContent = `ETA: ${this.formatTime(eta)}`;
            } else {
                this.etaLabel.textContent = 'ETA: --';
            }
        }

        // Update speed
        if (this.speedLabel && this.showSpeed) {
            const speed = this.calculateSpeed();
            if (speed > 0) {
                this.speedLabel.textContent = `Speed: ${speed.toFixed(1)} items/s`;
            } else {
                this.speedLabel.textContent = 'Speed: --';
            }
        }

        // Update details
        if (this.detailsLabel && this.showDetails) {
            this.detailsLabel.textContent = `Items: ${this.processedItems}/${this.totalItems}`;
        }
    }

    /**
     * Format time duration
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Get current progress information
     * @returns {Object} Progress information
     */
    getProgressInfo() {
        return {
            progress: this.currentProgress,
            processedItems: this.processedItems,
            totalItems: this.totalItems,
            isActive: this.isActive,
            isPaused: this.isPaused,
            isCompleted: this.isCompleted,
            startTime: this.startTime,
            elapsedTime: this.startTime ? Date.now() - this.startTime : 0,
            eta: this.calculateETA(),
            speed: this.calculateSpeed()
        };
    }

    /**
     * Set progress callback function
     * @param {Function} callback - Callback function
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Update configuration options
     * @param {Object} options - Configuration options
     */
    updateOptions(options) {
        Object.assign(this, options);
        
        if (this.container) {
            this.updateUI();
        }
    }

    /**
     * Destroy progress tracker and clean up
     */
    destroy() {
        this.reset();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // Remove event listeners if any
        this.progressCallback = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressTracker;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ProgressTracker = ProgressTracker;
}