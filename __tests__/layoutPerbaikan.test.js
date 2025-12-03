/**
 * Layout Perbaikan Tests
 * 
 * Tests for layout improvements including navbar positioning, sidebar layout,
 * main content spacing, and responsive behavior.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5
 */

describe('Layout Perbaikan - Navbar', () => {
    let document;
    let window;

    beforeEach(() => {
        // Load the HTML
        document = global.document;
        window = global.window;
        
        // Create navbar element
        const navbar = document.createElement('nav');
        navbar.className = 'navbar navbar-expand-lg navbar-dark';
        navbar.id = 'testNavbar';
        document.body.appendChild(navbar);
    });

    afterEach(() => {
        // Clean up
        const navbar = document.getElementById('testNavbar');
        if (navbar) {
            navbar.remove();
        }
    });

    /**
     * Property 1: Navbar visibility consistency
     * For any viewport size, the navbar should always have a fixed height of 56px 
     * and remain visible at the top of the screen
     * Validates: Requirements 1.1, 1.4
     */
    test('Property 1: Navbar has consistent height of 56px', () => {
        const navbar = document.getElementById('testNavbar');
        const styles = window.getComputedStyle(navbar);
        
        // Check if navbar has fixed positioning
        expect(styles.position).toBe('fixed');
        
        // Check if navbar height is 56px
        expect(styles.height).toBe('56px');
        
        // Check if navbar is at top
        expect(styles.top).toBe('0px');
        
        // Check if navbar has proper z-index
        const zIndex = parseInt(styles.zIndex);
        expect(zIndex).toBeGreaterThanOrEqual(1030);
    });

    test('Navbar remains visible at top of screen', () => {
        const navbar = document.getElementById('testNavbar');
        const styles = window.getComputedStyle(navbar);
        
        expect(styles.position).toBe('fixed');
        expect(styles.top).toBe('0px');
        expect(styles.left).toBe('0px');
        expect(styles.right).toBe('0px');
    });
});

describe('Layout Perbaikan - Main Content', () => {
    let document;
    let window;

    beforeEach(() => {
        document = global.document;
        window = global.window;
        
        // Create main content element
        const main = document.createElement('main');
        main.id = 'testMain';
        document.body.appendChild(main);
    });

    afterEach(() => {
        const main = document.getElementById('testMain');
        if (main) {
            main.remove();
        }
    });

    /**
     * Property 2: Content not obscured by navbar
     * For any page content, the top of the main content area should start at least 56px 
     * from the top of the viewport to avoid being hidden by the navbar
     * Validates: Requirements 1.2, 3.4
     */
    test('Property 2: Main content has margin-top of at least 56px', () => {
        const main = document.getElementById('testMain');
        const styles = window.getComputedStyle(main);
        
        const marginTop = parseInt(styles.marginTop);
        expect(marginTop).toBeGreaterThanOrEqual(56);
    });

    test('Main content has minimum height to fill viewport', () => {
        const main = document.getElementById('testMain');
        const styles = window.getComputedStyle(main);
        
        // Check if min-height is set (should be calc(100vh - 56px) or equivalent)
        expect(styles.minHeight).toBeTruthy();
    });
});

describe('Layout Perbaikan - Sidebar Desktop', () => {
    let document;
    let window;

    beforeEach(() => {
        document = global.document;
        window = global.window;
        
        // Create sidebar element
        const sidebar = document.createElement('nav');
        sidebar.className = 'sidebar';
        sidebar.id = 'testSidebar';
        document.body.appendChild(sidebar);
        
        // Create main content
        const main = document.createElement('main');
        main.id = 'testMainDesktop';
        document.body.appendChild(main);
        
        // Simulate desktop viewport
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1200
        });
    });

    afterEach(() => {
        const sidebar = document.getElementById('testSidebar');
        if (sidebar) {
            sidebar.remove();
        }
        const main = document.getElementById('testMainDesktop');
        if (main) {
            main.remove();
        }
    });

    /**
     * Property 3: Desktop sidebar spacing
     * For any desktop viewport (≥992px), the main content should have a left margin 
     * equal to the sidebar width (250px) to prevent overlap
     * Validates: Requirements 1.3, 3.2
     */
    test('Property 3: Sidebar has width of 250px', () => {
        const sidebar = document.getElementById('testSidebar');
        const styles = window.getComputedStyle(sidebar);
        
        expect(styles.width).toBe('250px');
    });

    test('Sidebar is positioned below navbar', () => {
        const sidebar = document.getElementById('testSidebar');
        const styles = window.getComputedStyle(sidebar);
        
        expect(styles.position).toBe('fixed');
        expect(styles.top).toBe('56px');
    });

    test('Sidebar has correct z-index', () => {
        const sidebar = document.getElementById('testSidebar');
        const styles = window.getComputedStyle(sidebar);
        
        const zIndex = parseInt(styles.zIndex);
        expect(zIndex).toBe(100);
    });
});

describe('Layout Perbaikan - Sidebar Mobile', () => {
    let document;
    let window;

    beforeEach(() => {
        document = global.document;
        window = global.window;
        
        // Create sidebar element
        const sidebar = document.createElement('nav');
        sidebar.className = 'sidebar';
        sidebar.id = 'testSidebarMobile';
        document.body.appendChild(sidebar);
        
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'testOverlay';
        document.body.appendChild(overlay);
        
        // Simulate mobile viewport
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375
        });
    });

    afterEach(() => {
        const sidebar = document.getElementById('testSidebarMobile');
        if (sidebar) {
            sidebar.remove();
        }
        const overlay = document.getElementById('testOverlay');
        if (overlay) {
            overlay.remove();
        }
    });

    /**
     * Property 4: Mobile sidebar behavior
     * For any mobile viewport (<992px), when the sidebar is closed, it should be 
     * completely hidden off-screen using translateX(-100%)
     * Validates: Requirements 2.2, 2.3
     */
    test('Property 4: Sidebar is hidden by default on mobile', () => {
        const sidebar = document.getElementById('testSidebarMobile');
        const styles = window.getComputedStyle(sidebar);
        
        // Check if sidebar has transform translateX(-100%)
        expect(styles.transform).toContain('translateX(-100%)');
    });

    test('Sidebar overlay has correct z-index', () => {
        const overlay = document.getElementById('testOverlay');
        const styles = window.getComputedStyle(overlay);
        
        const zIndex = parseInt(styles.zIndex);
        expect(zIndex).toBe(99);
    });

    test('Sidebar overlay is positioned correctly', () => {
        const overlay = document.getElementById('testOverlay');
        const styles = window.getComputedStyle(overlay);
        
        expect(styles.position).toBe('fixed');
        expect(styles.top).toBe('56px');
    });
});

describe('Layout Perbaikan - Z-Index Hierarchy', () => {
    let document;
    let window;

    beforeEach(() => {
        document = global.document;
        window = global.window;
        
        // Create all elements
        const navbar = document.createElement('nav');
        navbar.className = 'navbar';
        navbar.id = 'testNavbarZ';
        document.body.appendChild(navbar);
        
        const sidebar = document.createElement('nav');
        sidebar.className = 'sidebar';
        sidebar.id = 'testSidebarZ';
        document.body.appendChild(sidebar);
        
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'testOverlayZ';
        document.body.appendChild(overlay);
    });

    afterEach(() => {
        ['testNavbarZ', 'testSidebarZ', 'testOverlayZ'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    });

    /**
     * Property 6: Z-index hierarchy
     * For any overlapping elements, the z-index values should maintain the order: 
     * navbar (1030) > sidebar (100) > overlay (99) > content (default)
     * Validates: Requirements 4.3
     */
    test('Property 6: Z-index hierarchy is correct', () => {
        const navbar = document.getElementById('testNavbarZ');
        const sidebar = document.getElementById('testSidebarZ');
        const overlay = document.getElementById('testOverlayZ');
        
        const navbarZ = parseInt(window.getComputedStyle(navbar).zIndex);
        const sidebarZ = parseInt(window.getComputedStyle(sidebar).zIndex);
        const overlayZ = parseInt(window.getComputedStyle(overlay).zIndex);
        
        // Verify hierarchy: navbar > sidebar > overlay
        expect(navbarZ).toBeGreaterThan(sidebarZ);
        expect(sidebarZ).toBeGreaterThan(overlayZ);
        
        // Verify specific values
        expect(navbarZ).toBe(1030);
        expect(sidebarZ).toBe(100);
        expect(overlayZ).toBe(99);
    });
});

describe('Layout Perbaikan - Responsive Spacing', () => {
    let document;
    let window;

    beforeEach(() => {
        document = global.document;
        window = global.window;
    });

    /**
     * Property 5: Responsive spacing consistency
     * For any viewport size, all spacing values (margins, paddings) should follow 
     * the defined responsive scale without causing overflow
     * Validates: Requirements 2.1, 4.4
     */
    test('Property 5: No horizontal overflow on mobile', () => {
        // Simulate mobile viewport
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375
        });
        
        const body = document.body;
        const html = document.documentElement;
        
        const bodyStyles = window.getComputedStyle(body);
        const htmlStyles = window.getComputedStyle(html);
        
        // Check overflow-x is hidden
        expect(bodyStyles.overflowX).toBe('hidden');
        expect(htmlStyles.overflowX).toBe('hidden');
    });

    test('Responsive breakpoints are defined correctly', () => {
        // Test different viewport sizes
        const viewportSizes = [320, 768, 1024, 1920];
        
        viewportSizes.forEach(width => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: width
            });
            
            // Verify no overflow
            const body = document.body;
            const styles = window.getComputedStyle(body);
            expect(styles.overflowX).toBe('hidden');
        });
    });
});

describe('Layout Perbaikan - CSS Organization', () => {
    test('CSS variables are defined', () => {
        const root = document.documentElement;
        const styles = window.getComputedStyle(root);
        
        // Check if z-index variables are defined
        const navbarZ = styles.getPropertyValue('--z-index-navbar');
        const sidebarZ = styles.getPropertyValue('--z-index-sidebar');
        const overlayZ = styles.getPropertyValue('--z-index-overlay');
        
        expect(navbarZ).toBeTruthy();
        expect(sidebarZ).toBeTruthy();
        expect(overlayZ).toBeTruthy();
    });
});
