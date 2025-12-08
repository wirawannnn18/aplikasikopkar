# Implementasi Task 1: Create Wizard Controller Class

**Tanggal**: 2024-12-09  
**Status**: ✅ Complete

---

## 📋 Task Description

Create wizard controller class with state management, navigation methods, validation methods, and snapshot/rollback methods for error handling.

**Requirements**: 7.1, 8.1, 8.2, 10.1

---

## ✅ Implementation Summary

### File Created

**`js/anggotaKeluarWizard.js`** - Main wizard controller class (600+ lines)

---

## 🎯 AnggotaKeluarWizard Class

### Constructor
```javascript
constructor(anggotaId)
```

**Features:**
- Validates anggotaId parameter
- Initializes wizard state (currentStep, maxStep, completedSteps)
- Creates wizardData storage for each step
- Sets up snapshot for rollback
- Logs wizard start to audit log

**Properties:**
- `anggotaId` - ID of anggota being processed
- `currentStep` - Current step number (1-5)
- `maxStep` - Maximum steps (5)
- `completedSteps` - Array of completed step numbers
- `wizardData` - Object storing data from each step
- `snapshot` - Snapshot for rollback
- `status` - Wizard status (in_progress/completed/cancelled/error)
- `createdAt` - Wizard creation timestamp
- `completedAt` - Wizard completion timestamp

---

## 🧭 Navigation Methods

### 1. `nextStep()`
**Purpose:** Navigate to next step

**Logic:**
- Checks if can navigate next (current step completed)
- Marks current step as completed
- Increments currentStep
- Logs step change to audit log

**Returns:** `{ success: boolean, currentStep: number }`

### 2. `previousStep()`
**Purpose:** Navigate to previous step

**Logic:**
- Checks if can navigate previous (not at first step)
- Decrements currentStep
- Logs step change to audit log

**Returns:** `{ success: boolean, currentStep: number }`

### 3. `goToStep(stepNumber)`
**Purpose:** Navigate to specific step

**Logic:**
- Validates step number (1-5)
- Cannot skip steps (sequential enforcement)
- Can only go forward if current step completed
- Can go back to any completed step
- Logs step change to audit log

**Returns:** `{ success: boolean, currentStep: number }`

### 4. `canNavigateNext()`
**Purpose:** Check if can navigate to next step

**Logic:**
- Returns false if at max step
- Returns true if current step is completed

**Returns:** `boolean`

### 5. `canNavigatePrevious()`
**Purpose:** Check if can navigate to previous step

**Logic:**
- Returns true if not at first step

**Returns:** `boolean`

---

## 🔧 Step Execution Methods

### 1. `executeStep1Validation()`
**Purpose:** Execute Step 1 - Validasi Hutang/Piutang

**Logic:**
- Validates on step 1
- Calls `validateHutangPiutang(anggotaId)`
- Stores result in wizardData
- Marks step as completed if validation passed
- Logs result to audit log

**Returns:** Validation result object

### 2. `executeStep2Pencairan(metodePembayaran, tanggalPembayaran, keterangan)`
**Purpose:** Execute Step 2 - Pencairan Simpanan

**Logic:**
- Validates on step 2
- Validates step 1 completed
- Calls `prosesPencairanSimpanan()`
- Stores result in wizardData
- Marks step as completed if successful
- Logs result with amount details to audit log

**Returns:** Pencairan result object

### 3. `executeStep3Print()`
**Purpose:** Execute Step 3 - Print Dokumen

**Logic:**
- Validates on step 3
- Validates step 2 completed
- Gets pengembalianId from step 2 data
- Calls `generateDokumenAnggotaKeluar()`
- Stores document refs in wizardData
- Marks step as completed
- Logs result to audit log

**Returns:** Document generation result

### 4. `executeStep4Update(tanggalKeluar, alasanKeluar)`
**Purpose:** Execute Step 4 - Update Status

**Logic:**
- Validates on step 4
- Validates step 3 completed
- Gets pengembalianId and documentRefs from previous steps
- Calls `updateStatusAnggotaKeluar()`
- Stores result in wizardData
- Marks step as completed if successful
- Logs result to audit log

**Returns:** Update result object

### 5. `executeStep5Verification()`
**Purpose:** Execute Step 5 - Verifikasi Accounting

**Logic:**
- Validates on step 5
- Validates step 4 completed
- Gets pengembalianId from step 2 data
- Calls `verifikasiAccounting()`
- Stores result in wizardData
- Marks step as completed if verification passed
- Logs result to audit log

**Returns:** Verification result object

---

## 💾 State Management Methods

### 1. `saveSnapshot()`
**Purpose:** Save snapshot of current state for rollback

**Logic:**
- Captures current state of:
  - anggota
  - simpananPokok
  - simpananWajib
  - simpananSukarela
  - jurnal
  - pengembalian
- Stores snapshot with timestamp
- Logs snapshot creation to audit log

**Returns:** Snapshot object

### 2. `rollback()`
**Purpose:** Rollback to saved snapshot

**Logic:**
- Checks if snapshot exists
- Restores all data from snapshot to localStorage
- Logs rollback execution to audit log
- Logs error if rollback fails

**Returns:** `boolean` (true if successful)

### 3. `getWizardState()`
**Purpose:** Get current wizard state

**Returns:** Object with:
- anggotaId
- currentStep
- maxStep
- completedSteps
- wizardData
- status
- createdAt
- completedAt

### 4. `complete()`
**Purpose:** Complete wizard

**Logic:**
- Validates all steps completed
- Sets status to 'completed'
- Sets completedAt timestamp
- Logs completion to audit log with duration

**Returns:** `{ success: boolean, message: string, wizardState: object }`

### 5. `cancel(reason)`
**Purpose:** Cancel wizard

**Logic:**
- Sets status to 'cancelled'
- Sets completedAt timestamp
- Logs cancellation with reason and current progress

**Returns:** `{ success: boolean, message: string, reason: string }`

---

## 🎨 UI Rendering Methods

### 1. `renderStepIndicator()`
**Purpose:** Render step indicator HTML

**Features:**
- Shows all 5 steps
- Visual indicators:
  - ✅ Completed: Green checkmark
  - ⏳ Active: Blue circle
  - ⏸️ Pending: Gray circle
- Arrows between steps
- Step labels (Validasi, Pencairan, Print, Update, Verifikasi)

**Returns:** HTML string

### 2. `renderNavigationButtons()`
**Purpose:** Render navigation buttons HTML

**Features:**
- **Kembali** button (disabled if at first step)
- **Batal** button (always enabled)
- **Lanjut** button (disabled if current step not completed)
- **Selesai** button (shown on last step if all completed)
- Icons for each button

**Returns:** HTML string

---

## 📝 Audit Logging

### Events Logged

1. **START_WIZARD_ANGGOTA_KELUAR** - Wizard started
2. **WIZARD_STEP_CHANGED** - Step navigation
3. **COMPLETE_STEP_1_VALIDATION** - Step 1 completed
4. **STEP_1_VALIDATION_FAILED** - Step 1 failed
5. **COMPLETE_STEP_2_PENCAIRAN** - Step 2 completed (with amount)
6. **STEP_2_PENCAIRAN_FAILED** - Step 2 failed
7. **COMPLETE_STEP_3_PRINT** - Step 3 completed
8. **COMPLETE_STEP_4_UPDATE** - Step 4 completed
9. **COMPLETE_STEP_5_VERIFICATION** - Step 5 completed
10. **STEP_5_VERIFICATION_FAILED** - Step 5 failed
11. **SNAPSHOT_CREATED** - Snapshot saved
12. **ROLLBACK_EXECUTED** - Rollback performed
13. **ROLLBACK_FAILED** - Rollback failed
14. **WIZARD_COMPLETED** - Wizard completed successfully
15. **WIZARD_CANCELLED** - Wizard cancelled

### Log Format
```javascript
{
    id: string,
    timestamp: ISO string,
    userId: string,
    userName: string,
    action: string,
    anggotaId: string,
    details: object,
    severity: 'INFO' | 'ERROR'
}
```

---

## 🔒 Error Handling

### Validation Checks
- ✅ anggotaId parameter validation in constructor
- ✅ Step number validation in goToStep()
- ✅ Sequential step enforcement
- ✅ Current step validation in execute methods
- ✅ Previous step completion validation
- ✅ All steps completed validation in complete()

### Error Recovery
- ✅ Try-catch blocks in all methods
- ✅ Detailed error messages
- ✅ Error logging to audit log
- ✅ Rollback capability via snapshot

---

## 🧪 Testing Considerations

### Unit Tests Needed
1. Constructor validation
2. Navigation logic (next, previous, goTo)
3. canNavigateNext/Previous logic
4. Step execution validation
5. Snapshot/rollback mechanism
6. State management
7. Complete/cancel logic

### Integration Tests Needed
1. Complete wizard flow (all 5 steps)
2. Navigation between steps
3. Error scenarios with rollback
4. Audit log creation
5. UI rendering

---

## 📊 Code Statistics

- **Total Lines:** ~600
- **Methods:** 20
- **Navigation Methods:** 5
- **Step Execution Methods:** 5
- **State Management Methods:** 5
- **UI Rendering Methods:** 2
- **Private Methods:** 1
- **Audit Events:** 15

---

## ✅ Requirements Satisfied

### Requirement 7.1
✅ Wizard displays step indicator with 5 stages

### Requirement 8.1
✅ Wizard validates each step before allowing navigation

### Requirement 8.2
✅ Validation failures block navigation

### Requirement 10.1
✅ Snapshot/rollback mechanism implemented

---

## 🚀 Next Steps

**Task 2:** Implement Step 1 - Validasi Hutang/Piutang
- Create `validateHutangPiutang()` function
- Check for active loans and receivables
- Return detailed validation result

**Integration:**
- Wizard controller is ready
- Needs step execution functions from anggotaKeluarManager.js
- Needs UI rendering functions from anggotaKeluarUI.js

---

## 💡 Usage Example

```javascript
// Create wizard instance
const wizard = new AnggotaKeluarWizard('anggota-123');

// Execute Step 1
const validation = await wizard.executeStep1Validation();
if (validation.valid) {
    // Navigate to Step 2
    wizard.nextStep();
    
    // Execute Step 2
    const pencairan = await wizard.executeStep2Pencairan('Kas', '2024-12-09', 'Pengembalian simpanan');
    if (pencairan.success) {
        // Continue to next steps...
    }
}

// Get current state
const state = wizard.getWizardState();
console.log('Current step:', state.currentStep);
console.log('Completed steps:', state.completedSteps);

// Render UI
document.getElementById('step-indicator').innerHTML = wizard.renderStepIndicator();
document.getElementById('nav-buttons').innerHTML = wizard.renderNavigationButtons();
```

---

**Task 1 Status:** ✅ COMPLETE

**Files Created:** 1
- `js/anggotaKeluarWizard.js` (600+ lines)

**Next Task:** Task 2 - Implement Step 1: Validasi Hutang/Piutang
