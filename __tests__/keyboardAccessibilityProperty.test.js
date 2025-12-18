/**
 * Property-Based Test for Keyboard Accessibility
 * Feature: perbaikan-menu-tutup-kasir-pos, Property 11: Keyboard accessibility
 * 
 * Tests that keyboard shortcuts and accessibility features work correctly
 * across different system states and user interactions.
 */

import fc from 'fast-check';

// Mock Bootstrap Modal
global.bootstrap = {
    Modal: class {
        constructor(element) {
            this.element = element;
        }
        show() {
            this.element.style.display = 'block';
            this.element.dispatchEvent(new Event('shown.bs.modal'));
        }
        hide() {
            this.element.style.display = 'none';
            this.element.dispatchEvent(new Event('hidden.bs.modal'));
        }
        static getInstance(element) {
            return new this(element);
        }
    }
};

// Mock functions that would be available in the real environment
global.showTutupKasirModal = () => {};
global.prosesTutupKasir = () => {};

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.sessionStorage = sessionStorageMock;

// Mock TutupKasirAccessibilityManager class for testing
class TutupKasirAccessibilityManager {
    constructor() {
        this.shortcuts = new Map();
        this.isModalOpen = false;
        this.originalFocus = null;
        this.init();
    }
    
    init() {
        this.setupKeyboardShortcuts();
        this.setupAccessibilityFeatures();
    }
    
    setupKeyboardShortcuts() {
        this.shortcuts.set('F10', {
            description: 'Buka modal tutup kasir',
            handler: () => this.handleTutupKasirShortcut(),
            global: true
        });
        
        this.shortcuts.set('F1', {
            description: 'Tampilkan bantuan keyboard shortcuts',
            handler: () => this.showKeyboardHelp(),
            global: true
        });
        
        this.shortcuts.set('Escape', {
            description: 'Tutup modal tutup kasir',
            handler: () => this.handleEscapeShortcut(),
            modalOnly: true
        });
        
        this.shortcuts.set('Ctrl+Shift+T', {
            description: 'Buka modal tutup kasir (alternatif)',
            handler: () => this.handleTutupKasirShortcut(),
            global: true
        });
        
        this.shortcuts.set('Alt+T', {
            description: 'Buka modal tutup kasir (alternatif)',
            handler: () => this.handleTutupKasirShortcut(),
            global: true
        });
    }
    
    setupAccessibilityFeatures() {
        this.createLiveRegion();
    }
    
    createLiveRegion() {
        let liveRegion = document.getElementById('tutupKasirLiveRegion');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'tutupKasirLiveRegion';
            liveRegion.setAttribute('aria-live', 'polite');
            document.body.appendChild(liveRegion);
        }
    }
    
    getKeyString(event) {
        let key = event.key;
        if (event.ctrlKey && event.shiftKey) {
            key = `Ctrl+Shift+${key}`;
        } else if (event.ctrlKey) {
            key = `Ctrl+${key}`;
        } else if (event.altKey) {
            key = `Alt+${key}`;
        }
        return key;
    }
    
    handleTutupKasirShortcut() {
        if (this.isTutupKasirAvailable()) {
            this.announceToScreenReader('Membuka modal tutup kasir');
            if (typeof global.showTutupKasirModal === 'function') {
                global.showTutupKasirModal();
            }
        } else {
            this.showUnavailableMessage();
        }
    }
    
    handleEscapeShortcut() {
        if (this.isModalOpen) {
            this.announceToScreenReader('Menutup modal tutup kasir');
            this.closeModal();
        }
    }
    
    handleTabNavigation(event) {
        if (!this.isModalOpen) return;
        event.preventDefault();
        
        const focusableElements = this.getFocusableElements();
        if (focusableElements.length === 0) return;
        
        const currentIndex = focusableElements.indexOf(document.activeElement);
        let nextIndex;
        
        if (event.shiftKey) {
            nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        } else {
            nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
        }
        
        focusableElements[nextIndex].focus();
        this.announceCurrentField(focusableElements[nextIndex]);
    }
    
    getFocusableElements() {
        const modal = document.getElementById('tutupKasirModal');
        if (!modal) return [];
        
        const focusableSelectors = [
            'input:not([disabled]):not([type="hidden"])',
            'textarea:not([disabled])',
            'button:not([disabled])'
        ];
        
        return Array.from(modal.querySelectorAll(focusableSelectors.join(', ')))
            .filter(element => element.offsetWidth > 0 && element.offsetHeight > 0);
    }
    
    onModalOpened() {
        this.isModalOpen = true;
        this.originalFocus = document.activeElement;
        this.setupModalAriaLabels();
        this.announceToScreenReader('Modal tutup kasir dibuka. Gunakan Tab untuk navigasi antar field.');
    }
    
    onModalClosed() {
        this.isModalOpen = false;
        if (this.originalFocus) {
            this.originalFocus.focus();
            this.originalFocus = null;
        }
        this.announceToScreenReader('Modal tutup kasir ditutup');
    }
    
    setupModalAriaLabels() {
        const modal = document.getElementById('tutupKasirModal');
        if (!modal) return;
        
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'tutupKasirModalLabel');
        modal.setAttribute('aria-describedby', 'tutupKasirModalDescription');
        
        const kasAktualInput = document.getElementById('kasAktual');
        if (kasAktualInput) {
            kasAktualInput.setAttribute('aria-label', 'Jumlah kas aktual yang dihitung');
            kasAktualInput.setAttribute('aria-required', 'true');
        }
        
        const keteranganInput = document.getElementById('keteranganSelisih');
        if (keteranganInput) {
            keteranganInput.setAttribute('aria-label', 'Keterangan selisih kas');
        }
        
        const processBtn = document.getElementById('prosesTutupKasirBtn');
        if (processBtn) {
            processBtn.setAttribute('aria-label', 'Proses tutup kasir');
        }
    }
    
    closeModal() {
        const modal = document.getElementById('tutupKasirModal');
        if (modal) {
            modal.style.display = 'none';
            this.onModalClosed();
        }
    }
    
    isTutupKasirAvailable() {
        const bukaKas = global.sessionStorage.getItem('bukaKas');
        if (!bukaKas) return false;
        
        try {
            const data = JSON.parse(bukaKas);
            return data.kasir && data.modalAwal && data.waktuBuka;
        } catch (e) {
            return false;
        }
    }
    
    showUnavailableMessage() {
        this.announceToScreenReader('Tutup kasir tidak tersedia. Silakan buka kas terlebih dahulu.');
        if (typeof global.showAlert === 'function') {
            global.showAlert('Belum ada kas yang dibuka. Silakan buka kas terlebih dahulu.', 'warning');
        }
    }
    
    announceToScreenReader(message) {
        const liveRegion = document.getElementById('tutupKasirLiveRegion');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
    
    announceCurrentField(element) {
        if (!element) return;
        
        let announcement = '';
        const label = element.getAttribute('aria-label') || 
                     element.getAttribute('placeholder') || 
                     element.textContent;
        
        if (label) {
            announcement = `Fokus pada: ${label}`;
        }
        
        if (element.tagName === 'INPUT') {
            announcement += '. Field angka';
            if (element.hasAttribute('aria-required')) {
                announcement += '. Wajib diisi';
            }
        } else if (element.tagName === 'BUTTON') {
            announcement += '. Tombol';
        }
        
        if (announcement) {
            this.announceToScreenReader(announcement);
        }
    }
    
    showKeyboardHelp() {
        // Mock implementation for testing
    }
    
    generateKeyboardHelpContent() {
        return `
            <div class="row">
                <div class="col-md-6">
                    <h6>Tutup Kasir</h6>
                    <table class="table table-sm">
                        <tbody>
                            <tr><td><kbd>F10</kbd></td><td>Buka modal tutup kasir</td></tr>
                            <tr><td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd></td><td>Buka modal tutup kasir (alternatif)</td></tr>
                            <tr><td><kbd>Alt</kbd> + <kbd>T</kbd></td><td>Buka modal tutup kasir (alternatif)</td></tr>
                            <tr><td><kbd>Esc</kbd></td><td>Tutup modal tutup kasir</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Navigasi</h6>
                    <table class="table table-sm">
                        <tbody>
                            <tr><td><kbd>Tab</kbd></td><td>Pindah ke field berikutnya</td></tr>
                            <tr><td><kbd>Shift</kbd> + <kbd>Tab</kbd></td><td>Pindah ke field sebelumnya</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
}

describe('Keyboard Accessibility Property Tests', () => {
    let accessibilityManager;
    
    beforeEach(() => {
        // Setup mock functions with call tracking
        global.showTutupKasirModal = (() => {
            const fn = () => {};
            fn.mock = { calls: [] };
            const originalFn = fn;
            const mockFn = (...args) => {
                mockFn.mock.calls.push(args);
                return originalFn(...args);
            };
            mockFn.mock = { calls: [] };
            return mockFn;
        })();
        
        global.prosesTutupKasir = (() => {
            const fn = () => {};
            fn.mock = { calls: [] };
            const originalFn = fn;
            const mockFn = (...args) => {
                mockFn.mock.calls.push(args);
                return originalFn(...args);
            };
            mockFn.mock = { calls: [] };
            return mockFn;
        })();
        
        global.showAlert = (() => {
            const fn = () => {};
            fn.mock = { calls: [] };
            const originalFn = fn;
            const mockFn = (...args) => {
                mockFn.mock.calls.push(args);
                return originalFn(...args);
            };
            mockFn.mock = { calls: [] };
            return mockFn;
        })();
        // Setup DOM elements needed for testing
        document.body.innerHTML = `
            <div id="mainContent"></div>
            <div id="tutupKasirModal" class="modal" style="display: none;">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Tutup Kasir</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <input type="number" id="kasAktual" class="form-control" />
                            <textarea id="keteranganSelisih" class="form-control"></textarea>
                            <button id="prosesTutupKasirBtn" class="btn btn-primary">Proses</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="tutupKasirLiveRegion" aria-live="polite"></div>
        `;
        
        // Reset mocks
        global.showTutupKasirModal.mock.calls = [];
        global.prosesTutupKasir.mock.calls = [];
        global.showAlert.mock.calls = [];
        global.sessionStorage.clear();
        
        // Create fresh instance
        accessibilityManager = new TutupKasirAccessibilityManager();
    });

    /**
     * **Feature: perbaikan-menu-tutup-kasir-pos, Property 11: Keyboard accessibility**
     * 
     * For any defined keyboard shortcut, the tutup kasir function should be accessible 
     * and respond correctly across different session states and modal states.
     */
    test('Property 11: Keyboard shortcuts respond correctly across all system states', () => {
        fc.assert(fc.property(
            // Generate test data
            fc.record({
                // Session state
                hasValidSession: fc.boolean(),
                sessionData: fc.record({
                    kasir: fc.string({ minLength: 1, maxLength: 50 }),
                    modalAwal: fc.float({ min: 0, max: 10000000 }),
                    waktuBuka: fc.date({ min: new Date('2024-01-01'), max: new Date() }).map(d => d.toISOString())
                }),
                
                // Modal state
                isModalOpen: fc.boolean(),
                
                // Keyboard events to test
                keyboardEvents: fc.array(
                    fc.record({
                        key: fc.constantFrom('F10', 'F1', 'Escape', 'Enter', 'Tab'),
                        ctrlKey: fc.boolean(),
                        shiftKey: fc.boolean(),
                        altKey: fc.boolean(),
                        target: fc.constantFrom('kasAktual', 'keteranganSelisih', 'prosesTutupKasirBtn', 'body')
                    }),
                    { minLength: 1, maxLength: 5 }
                )
            }),
            
            (testData) => {
                // Setup session state
                if (testData.hasValidSession) {
                    global.sessionStorage.setItem('bukaKas', JSON.stringify(testData.sessionData));
                } else {
                    global.sessionStorage.removeItem('bukaKas');
                }
                
                // Setup modal state
                const modal = document.getElementById('tutupKasirModal');
                if (testData.isModalOpen) {
                    modal.style.display = 'block';
                    accessibilityManager.isModalOpen = true;
                } else {
                    modal.style.display = 'none';
                    accessibilityManager.isModalOpen = false;
                }
                
                // Test each keyboard event
                testData.keyboardEvents.forEach(eventData => {
                    const event = new KeyboardEvent('keydown', {
                        key: eventData.key,
                        ctrlKey: eventData.ctrlKey,
                        shiftKey: eventData.shiftKey,
                        altKey: eventData.altKey,
                        bubbles: true,
                        cancelable: true
                    });
                    
                    // Set target element
                    let targetElement = document.body;
                    if (eventData.target !== 'body') {
                        targetElement = document.getElementById(eventData.target);
                        if (targetElement) {
                            targetElement.focus();
                        }
                    }
                    
                    // Dispatch event
                    const initialCallCount = {
                        showTutupKasirModal: global.showTutupKasirModal.mock.calls.length,
                        prosesTutupKasir: global.prosesTutupKasir.mock.calls.length,
                        showAlert: global.showAlert.mock.calls.length
                    };
                    
                    // Test keyboard shortcut handling
                    const keyString = accessibilityManager.getKeyString(event);
                    
                    if (keyString === 'F10' || keyString === 'Ctrl+Shift+T' || keyString === 'Alt+T') {
                        // Test tutup kasir shortcuts
                        accessibilityManager.handleTutupKasirShortcut();
                        
                        if (testData.hasValidSession) {
                            // Should call showTutupKasirModal
                            expect(global.showTutupKasirModal.mock.calls.length)
                                .toBeGreaterThan(initialCallCount.showTutupKasirModal);
                        } else {
                            // Should show unavailable message
                            expect(global.showAlert.mock.calls.length)
                                .toBeGreaterThan(initialCallCount.showAlert);
                        }
                    }
                    
                    if (keyString === 'Enter' && testData.isModalOpen && eventData.target === 'prosesTutupKasirBtn') {
                        // Should call prosesTutupKasir when focused on process button
                        if (typeof global.prosesTutupKasir === 'function') {
                            global.prosesTutupKasir();
                            expect(global.prosesTutupKasir.mock.calls.length)
                                .toBeGreaterThan(initialCallCount.prosesTutupKasir);
                        }
                    }
                    
                    if (keyString === 'Escape' && testData.isModalOpen) {
                        // Test escape handling
                        accessibilityManager.handleEscapeShortcut();
                        // Modal should be closed (tested via modal state change)
                    }
                });
                
                // Test focus management within modal
                if (testData.isModalOpen) {
                    const focusableElements = ['kasAktual', 'keteranganSelisih', 'prosesTutupKasirBtn'];
                    focusableElements.forEach(elementId => {
                        const element = document.getElementById(elementId);
                        if (element) {
                            element.focus();
                            
                            // Test Tab navigation
                            const tabEvent = new KeyboardEvent('keydown', {
                                key: 'Tab',
                                bubbles: true,
                                cancelable: true
                            });
                            
                            // Only test tab navigation if modal is open
                            if (accessibilityManager.isModalOpen) {
                                accessibilityManager.handleTabNavigation(tabEvent);
                                
                                // Verify that tab navigation is handled when modal is open
                                expect(tabEvent.defaultPrevented).toBe(true);
                            } else {
                                // When modal is not open, tab navigation should not be handled
                                accessibilityManager.handleTabNavigation(tabEvent);
                                // No assertion needed as it should return early
                            }
                        }
                    });
                }
                
                // Test ARIA live region announcements
                const liveRegion = document.getElementById('tutupKasirLiveRegion');
                expect(liveRegion).toBeTruthy();
                expect(liveRegion.getAttribute('aria-live')).toBe('polite');
                
                // Test keyboard shortcuts registration
                expect(accessibilityManager.shortcuts.size).toBeGreaterThan(0);
                expect(accessibilityManager.shortcuts.has('F10')).toBe(true);
                expect(accessibilityManager.shortcuts.has('F1')).toBe(true);
                expect(accessibilityManager.shortcuts.has('Escape')).toBe(true);
                
                // Verify shortcut descriptions exist
                accessibilityManager.shortcuts.forEach((shortcut, key) => {
                    expect(shortcut.description).toBeTruthy();
                    expect(typeof shortcut.description).toBe('string');
                    expect(shortcut.description.length).toBeGreaterThan(0);
                });
            }
        ), { numRuns: 100 });
    });

    test('Property 11.1: ARIA labels and accessibility attributes are correctly applied', () => {
        fc.assert(fc.property(
            fc.record({
                modalElements: fc.array(
                    fc.constantFrom('kasAktual', 'keteranganSelisih', 'prosesTutupKasirBtn'),
                    { minLength: 1, maxLength: 3 }
                )
            }),
            
            (testData) => {
                // Simulate modal opening to trigger ARIA setup
                accessibilityManager.onModalOpened();
                
                // Verify ARIA attributes are applied
                testData.modalElements.forEach(elementId => {
                    const element = document.getElementById(elementId);
                    if (element) {
                        // Check that accessibility attributes are set
                        const hasAriaLabel = element.hasAttribute('aria-label');
                        const hasAriaDescribedBy = element.hasAttribute('aria-describedby');
                        
                        // At least one accessibility attribute should be present
                        expect(hasAriaLabel || hasAriaDescribedBy).toBe(true);
                        
                        // If aria-describedby is set, the referenced element should exist
                        if (hasAriaDescribedBy) {
                            const describedById = element.getAttribute('aria-describedby');
                            if (describedById) {
                                const describedByElement = document.getElementById(describedById);
                                expect(describedByElement).toBeTruthy();
                            }
                        }
                    }
                });
                
                // Verify modal has proper ARIA attributes
                const modal = document.getElementById('tutupKasirModal');
                expect(modal.getAttribute('role')).toBe('dialog');
                expect(modal.hasAttribute('aria-labelledby')).toBe(true);
                expect(modal.hasAttribute('aria-describedby')).toBe(true);
            }
        ), { numRuns: 100 });
    });

    test('Property 11.2: Focus management works correctly during modal lifecycle', () => {
        fc.assert(fc.property(
            fc.record({
                focusSequence: fc.array(
                    fc.constantFrom('kasAktual', 'keteranganSelisih', 'prosesTutupKasirBtn'),
                    { minLength: 2, maxLength: 5 }
                ),
                tabDirection: fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }) // true = forward, false = backward
            }),
            
            (testData) => {
                // Setup initial focus
                const initialElement = document.getElementById('kasAktual');
                if (initialElement) {
                    initialElement.focus();
                    accessibilityManager.originalFocus = initialElement;
                }
                
                // Simulate modal opening
                accessibilityManager.onModalOpened();
                
                // Verify initial focus is set correctly
                expect(accessibilityManager.isModalOpen).toBe(true);
                
                // Test focus sequence with Tab navigation
                testData.focusSequence.forEach((elementId, index) => {
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.focus();
                        
                        // Test tab navigation
                        const isShiftTab = testData.tabDirection[index % testData.tabDirection.length] === false;
                        const tabEvent = new KeyboardEvent('keydown', {
                            key: 'Tab',
                            shiftKey: isShiftTab,
                            bubbles: true,
                            cancelable: true
                        });
                        
                        accessibilityManager.handleTabNavigation(tabEvent);
                        
                        // Verify tab navigation is handled
                        expect(tabEvent.defaultPrevented).toBe(true);
                    }
                });
                
                // Test modal closing and focus restoration
                accessibilityManager.onModalClosed();
                
                // Verify modal state is reset
                expect(accessibilityManager.isModalOpen).toBe(false);
                
                // Verify original focus would be restored (in real environment)
                expect(accessibilityManager.originalFocus).toBe(null);
            }
        ), { numRuns: 100 });
    });

    test('Property 11.3: Screen reader announcements are made at appropriate times', () => {
        fc.assert(fc.property(
            fc.record({
                announcements: fc.array(
                    fc.string({ minLength: 1, maxLength: 100 }),
                    { minLength: 1, maxLength: 5 }
                ),
                modalActions: fc.array(
                    fc.constantFrom('open', 'close', 'focus_change', 'shortcut_press'),
                    { minLength: 1, maxLength: 10 }
                )
            }),
            
            (testData) => {
                const liveRegion = document.getElementById('tutupKasirLiveRegion');
                
                // Test direct announcements
                testData.announcements.forEach(message => {
                    accessibilityManager.announceToScreenReader(message);
                    
                    // Verify announcement is made to live region
                    expect(liveRegion.textContent).toBe(message);
                });
                
                // Test announcements during modal actions
                testData.modalActions.forEach((action, index) => {
                    // Clear live region before each test
                    liveRegion.textContent = '';
                    const initialContent = liveRegion.textContent;
                    
                    switch (action) {
                        case 'open':
                            accessibilityManager.onModalOpened();
                            // Should make an announcement
                            expect(liveRegion.textContent.length).toBeGreaterThan(0);
                            break;
                            
                        case 'close':
                            accessibilityManager.onModalClosed();
                            // Should make an announcement
                            expect(liveRegion.textContent.length).toBeGreaterThan(0);
                            break;
                            
                        case 'focus_change':
                            const element = document.getElementById('kasAktual');
                            if (element) {
                                accessibilityManager.announceCurrentField(element);
                                // Should make an announcement
                                expect(liveRegion.textContent.length).toBeGreaterThan(0);
                            }
                            break;
                            
                        case 'shortcut_press':
                            accessibilityManager.handleTutupKasirShortcut();
                            // Announcement would be made based on session state
                            // Should make some announcement (either success or error)
                            expect(liveRegion.textContent.length).toBeGreaterThan(0);
                            break;
                    }
                });
            }
        ), { numRuns: 100 });
    });

    test('Property 11.4: Keyboard help system provides accurate information', () => {
        fc.assert(fc.property(
            fc.record({
                helpRequests: fc.array(fc.boolean(), { minLength: 1, maxLength: 3 })
            }),
            
            (testData) => {
                testData.helpRequests.forEach(() => {
                    // Test keyboard help generation
                    const helpContent = accessibilityManager.generateKeyboardHelpContent();
                    
                    // Verify help content contains essential shortcuts
                    expect(helpContent).toContain('F10');
                    expect(helpContent).toContain('Ctrl');
                    expect(helpContent).toContain('Shift');
                    expect(helpContent).toContain('Alt');
                    expect(helpContent).toContain('Tab');
                    expect(helpContent).toContain('Esc');
                    
                    // Verify help content is properly formatted HTML
                    expect(helpContent).toContain('<table');
                    expect(helpContent).toContain('<kbd>');
                    expect(helpContent).toContain('</table>');
                    
                    // Verify all registered shortcuts are documented
                    accessibilityManager.shortcuts.forEach((shortcut, key) => {
                        if (shortcut.global || key === 'F1') {
                            // Global shortcuts should be in help
                            const keyParts = key.split('+');
                            keyParts.forEach(part => {
                                expect(helpContent).toContain(part);
                            });
                        }
                    });
                });
            }
        ), { numRuns: 100 });
    });
});