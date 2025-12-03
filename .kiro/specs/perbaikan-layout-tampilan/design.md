# Design Document - Perbaikan Layout Tampilan

## Overview

Perbaikan layout tampilan akan mengatasi masalah elemen yang tertutup atau terpotong dengan memperbaiki CSS positioning, spacing, dan responsive behavior. Solusi akan fokus pada penyesuaian navbar fixed positioning, sidebar layout, dan main content spacing untuk memastikan semua elemen tampil dengan baik di berbagai ukuran layar.

## Architecture

Perbaikan akan dilakukan pada layer presentasi (CSS) tanpa mengubah struktur HTML atau JavaScript yang ada. Pendekatan yang digunakan:

1. **Fixed Navbar dengan Proper Spacing**: Navbar akan tetap fixed di atas, dengan konten di bawahnya diberi padding-top yang sesuai
2. **Sidebar Layout Optimization**: Sidebar akan menggunakan positioning yang tepat dengan koordinasi z-index
3. **Main Content Adjustment**: Area konten utama akan disesuaikan margin dan padding-nya
4. **Responsive Breakpoints**: Menggunakan breakpoint yang konsisten untuk mobile, tablet, dan desktop

## Components and Interfaces

### 1. Navbar Component
- **Position**: Fixed di top dengan z-index tinggi
- **Height**: 56px (konsisten di semua breakpoint)
- **Behavior**: Tetap terlihat saat scroll
- **Responsive**: Menyesuaikan padding dan font size di mobile

### 2. Sidebar Component
- **Desktop (≥992px)**: Fixed position, selalu terlihat
- **Mobile (<992px)**: Transform translateX untuk hide/show
- **Width**: 250px
- **Top Position**: 56px (di bawah navbar)
- **Z-index**: 100 (di bawah navbar tapi di atas konten)

### 3. Main Content Area
- **Desktop**: margin-left 250px (lebar sidebar) + margin-top 56px (tinggi navbar)
- **Mobile**: margin-left 0 + margin-top 56px
- **Padding**: Konsisten di semua breakpoint
- **Min-height**: calc(100vh - 56px) untuk full height

### 4. Overlay Component (Mobile)
- **Display**: Hanya muncul saat sidebar terbuka di mobile
- **Z-index**: 99 (di bawah sidebar)
- **Background**: rgba(0, 0, 0, 0.5)
- **Click behavior**: Menutup sidebar

## Data Models

Tidak ada perubahan data model karena ini hanya perbaikan CSS.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navbar visibility consistency
*For any* viewport size, the navbar should always have a fixed height of 56px and remain visible at the top of the screen
**Validates: Requirements 1.1, 1.4**

### Property 2: Content not obscured by navbar
*For any* page content, the top of the main content area should start at least 56px from the top of the viewport to avoid being hidden by the navbar
**Validates: Requirements 1.2, 3.4**

### Property 3: Desktop sidebar spacing
*For any* desktop viewport (≥992px), the main content should have a left margin equal to the sidebar width (250px) to prevent overlap
**Validates: Requirements 1.3, 3.2**

### Property 4: Mobile sidebar behavior
*For any* mobile viewport (<992px), when the sidebar is closed, it should be completely hidden off-screen using translateX(-100%)
**Validates: Requirements 2.2, 2.3**

### Property 5: Responsive spacing consistency
*For any* viewport size, all spacing values (margins, paddings) should follow the defined responsive scale without causing overflow
**Validates: Requirements 2.1, 4.4**

### Property 6: Z-index hierarchy
*For any* overlapping elements, the z-index values should maintain the order: navbar (1030) > sidebar (100) > overlay (99) > content (default)
**Validates: Requirements 4.3**

## Error Handling

### CSS Fallbacks
- Jika browser tidak support calc(), gunakan fixed pixel values
- Jika browser tidak support CSS variables, gunakan hardcoded colors
- Jika flexbox tidak support, gunakan float-based layout

### Responsive Breakpoints
- Gunakan mobile-first approach dengan min-width media queries
- Fallback untuk browser yang tidak support media queries

### Browser Compatibility
- Target: Modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation untuk older browsers
- Vendor prefixes untuk CSS properties yang memerlukan

## Testing Strategy

### Manual Testing
1. **Visual Regression Testing**
   - Test di berbagai ukuran layar (320px, 768px, 1024px, 1920px)
   - Verify navbar tidak menutupi konten
   - Verify sidebar tidak overlap dengan konten
   - Verify semua elemen terlihat dan accessible

2. **Responsive Testing**
   - Test di Chrome DevTools dengan berbagai device presets
   - Test orientasi portrait dan landscape
   - Test dengan zoom level berbeda (100%, 125%, 150%)

3. **Cross-browser Testing**
   - Test di Chrome, Firefox, Safari, Edge
   - Verify konsistensi tampilan di semua browser
   - Check untuk CSS bugs spesifik browser

4. **Interaction Testing**
   - Test sidebar toggle di mobile
   - Test scroll behavior dengan navbar fixed
   - Test overlay click untuk close sidebar
   - Test keyboard navigation

### Automated Testing
Karena ini adalah perbaikan CSS visual, automated testing akan minimal. Namun bisa dilakukan:

1. **CSS Validation**
   - Validate CSS syntax dengan W3C CSS Validator
   - Check untuk unused CSS rules
   - Verify no conflicting styles

2. **Accessibility Testing**
   - Check color contrast ratios
   - Verify focus states visible
   - Check touch target sizes (min 44x44px)

### Test Cases

**Test Case 1: Navbar Fixed Position**
- Given: User loads any page
- When: User scrolls down
- Then: Navbar remains visible at top
- And: Content scrolls underneath navbar

**Test Case 2: Content Not Hidden**
- Given: User is on any page
- When: Page loads
- Then: First element of content is visible
- And: No content is hidden behind navbar

**Test Case 3: Desktop Sidebar Layout**
- Given: Viewport width ≥ 992px
- When: Page loads
- Then: Sidebar is visible on left
- And: Main content has left margin of 250px
- And: No horizontal scrollbar appears

**Test Case 4: Mobile Sidebar Toggle**
- Given: Viewport width < 992px
- When: User clicks sidebar toggle button
- Then: Sidebar slides in from left
- And: Overlay appears behind sidebar
- And: Body scroll is prevented

**Test Case 5: Mobile Sidebar Close**
- Given: Sidebar is open on mobile
- When: User clicks overlay
- Then: Sidebar slides out to left
- And: Overlay disappears
- And: Body scroll is restored

**Test Case 6: Responsive Breakpoints**
- Given: User resizes browser window
- When: Window crosses breakpoint (768px, 992px)
- Then: Layout adjusts smoothly
- And: No elements overflow viewport
- And: All content remains accessible

## Implementation Notes

### CSS Organization
```css
/* 1. Root Variables */
/* 2. Base Styles */
/* 3. Navbar Styles */
/* 4. Sidebar Styles */
/* 5. Main Content Styles */
/* 6. Responsive Styles */
```

### Key CSS Changes

1. **Navbar**
```css
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    z-index: 1030;
}
```

2. **Sidebar**
```css
.sidebar {
    position: fixed;
    top: 56px;
    left: 0;
    bottom: 0;
    width: 250px;
    z-index: 100;
}
```

3. **Main Content**
```css
main {
    margin-top: 56px;
    min-height: calc(100vh - 56px);
}

@media (min-width: 992px) {
    main {
        margin-left: 250px;
    }
}
```

### Performance Considerations
- Use `transform` for sidebar animation (GPU accelerated)
- Avoid layout thrashing dengan batch DOM reads/writes
- Use `will-change` untuk elements yang akan di-animate
- Minimize repaints dengan proper CSS containment

### Accessibility Considerations
- Maintain focus management saat sidebar toggle
- Ensure keyboard navigation works properly
- Provide skip links untuk bypass navigation
- Maintain proper heading hierarchy
- Ensure sufficient color contrast
