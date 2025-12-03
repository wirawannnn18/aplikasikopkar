# Rate Limiting Policy
## Fitur Hapus Transaksi Tutup Kasir

---

## Daftar Isi
1. [Tujuan](#tujuan)
2. [Scope](#scope)
3. [Rate Limit Thresholds](#rate-limit-thresholds)
4. [Implementation Details](#implementation-details)
5. [User Experience](#user-experience)
6. [Monitoring dan Reporting](#monitoring-dan-reporting)
7. [Exception Handling](#exception-handling)
8. [Policy Review](#policy-review)

---

## Tujuan

Rate limiting policy ini bertujuan untuk:

1. **Mencegah Penyalahgunaan**
   - Membatasi jumlah penghapusan transaksi tertutup per hari
   - Mencegah penghapusan massal yang tidak terkontrol
   - Mendeteksi aktivitas mencurigakan

2. **Menjaga Integritas Data**
   - Memberikan waktu untuk review setiap penghapusan
   - Mencegah kesalahan beruntun
   - Memastikan setiap penghapusan dipertimbangkan dengan matang

3. **Compliance dan Audit**
   - Memenuhi requirement audit trail
   - Memberikan kontrol tambahan untuk operasi kritis
   - Mendukung investigasi jika diperlukan

---

## Scope

### Operasi yang Dibatasi
Rate limiting **HANYA** berlaku untuk:
- Penghapusan transaksi POS yang sudah masuk dalam shift tertutup
- Dilakukan oleh user dengan role 'administrator'

### Operasi yang TIDAK Dibatasi
Rate limiting **TIDAK** berlaku untuk:
- Penghapusan transaksi POS biasa (belum tutup kasir)
- Operasi lain seperti edit, view, atau create
- User dengan role selain administrator (mereka tidak bisa akses fitur ini)

---

## Rate Limit Thresholds

### Level 1: Normal Operation
**Threshold:** 0-4 penghapusan per hari

**Karakteristik:**
- ✅ Tidak ada peringatan
- ✅ Proses berjalan normal
- ✅ Tidak ada pembatasan

**User Experience:**
- Pengguna dapat menghapus transaksi tanpa hambatan
- Tidak ada notifikasi tambahan
- Proses standar berlaku

**Monitoring:**
- Setiap penghapusan dicatat dalam rate limit tracking
- Counter bertambah untuk setiap penghapusan
- Tidak ada alert yang dikirim

---

### Level 2: Warning
**Threshold:** 5-9 penghapusan per hari

**Karakteristik:**
- ⚠️ Peringatan ditampilkan
- ⚠️ Justifikasi tambahan diminta
- ✅ Masih dapat melanjutkan penghapusan

**User Experience:**
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  PERINGATAN                                         │
├─────────────────────────────────────────────────────────┤
│  Anda telah menghapus 5 transaksi tertutup hari ini.   │
│  Harap berhati-hati.                                    │
│                                                          │
│  Jumlah penghapusan hari ini: 5                         │
│  Batas peringatan: 5                                    │
│  Batas maksimal: 10                                     │
│                                                          │
│  [Lanjutkan]  [Batal]                                   │
└─────────────────────────────────────────────────────────┘
```

**Monitoring:**
- Warning logged dengan level WARNING
- Alert dikirim ke monitoring system
- Supervisor dapat mereview aktivitas

**Justifikasi Tambahan:**
- User diminta untuk lebih detail dalam alasan
- Kategori kesalahan harus dipilih dengan tepat
- Alasan minimal 50 karakter (lebih tinggi dari normal 20)

---

### Level 3: Blocked
**Threshold:** 10+ penghapusan per hari

**Karakteristik:**
- ❌ Akses diblokir
- ❌ Tidak dapat menghapus lagi hari ini
- 📝 Notifikasi dikirim ke log sistem

**User Experience:**
```
┌─────────────────────────────────────────────────────────┐
│  ❌  AKSES DIBLOKIR                                     │
├─────────────────────────────────────────────────────────┤
│  Batas maksimal penghapusan transaksi tertutup         │
│  tercapai (10 per hari).                               │
│                                                          │
│  Akses Anda untuk menghapus transaksi tertutup telah   │
│  diblokir untuk hari ini.                              │
│                                                          │
│  Jumlah penghapusan hari ini: 10                       │
│  Batas maksimal: 10                                     │
│                                                          │
│  Akses akan dipulihkan pada: 00:00 besok               │
│                                                          │
│  Jika ada kebutuhan mendesak, hubungi administrator    │
│  sistem.                                                │
│                                                          │
│  [OK]                                                   │
└─────────────────────────────────────────────────────────┘
```

**Monitoring:**
- Block logged dengan level CRITICAL
- Alert dikirim ke administrator sistem
- Email notification (jika configured)
- Incident report dibuat otomatis

**Bypass:**
- Tidak ada cara untuk bypass secara otomatis
- Harus menunggu hingga reset (pukul 00:00)
- Untuk kasus emergency, hubungi administrator sistem

---

## Implementation Details

### Data Structure

#### Rate Limit Tracking Storage
**localStorage Key:** `rateLimitTracking`

**Data Structure:**
```javascript
{
  "user_<username>": {
    "deletions": [
      {
        "timestamp": "2024-01-15T10:30:00.000Z",
        "transactionId": "trans-123",
        "auditId": "AUDIT-CLOSED-20240115-0001"
      },
      {
        "timestamp": "2024-01-15T14:45:00.000Z",
        "transactionId": "trans-456",
        "auditId": "AUDIT-CLOSED-20240115-0002"
      }
    ]
  }
}
```

**Field Descriptions:**
- `user_<username>`: Prefixed key untuk menghindari prototype pollution
- `deletions`: Array of deletion records
- `timestamp`: ISO 8601 format timestamp
- `transactionId`: ID transaksi yang dihapus
- `auditId`: Audit ID untuk referensi

### Algorithm

#### Check Rate Limit
```javascript
function checkRateLimit(username) {
    // 1. Get tracking data
    const tracking = getTracking();
    const today = getCurrentDate(); // YYYY-MM-DD
    
    // 2. Get user's deletions
    const userKey = `user_${username}`;
    const userDeletions = tracking[userKey]?.deletions || [];
    
    // 3. Filter today's deletions
    const todayDeletions = userDeletions.filter(d => {
        const deletionDate = extractDate(d.timestamp);
        return deletionDate === today;
    });
    
    // 4. Count deletions
    const count = todayDeletions.length;
    
    // 5. Determine level
    if (count >= 10) {
        return {
            allowed: false,
            count: count,
            level: 'block',
            message: 'Batas maksimal tercapai'
        };
    } else if (count >= 5) {
        return {
            allowed: true,
            count: count,
            level: 'warning',
            message: 'Peringatan: sudah 5 penghapusan'
        };
    } else {
        return {
            allowed: true,
            count: count,
            level: 'ok',
            message: 'Rate limit OK'
        };
    }
}
```

#### Record Deletion
```javascript
function recordDeletion(username, transactionId, auditId) {
    // 1. Get tracking data
    const tracking = getTracking();
    
    // 2. Get or initialize user tracking
    const userKey = `user_${username}`;
    const userTracking = tracking[userKey] || { deletions: [] };
    
    // 3. Add new deletion record
    userTracking.deletions.push({
        timestamp: new Date().toISOString(),
        transactionId: transactionId,
        auditId: auditId
    });
    
    // 4. Cleanup old data (>30 days)
    const thirtyDaysAgo = getDateMinusDays(30);
    userTracking.deletions = userTracking.deletions.filter(d => {
        return new Date(d.timestamp) > thirtyDaysAgo;
    });
    
    // 5. Save tracking
    tracking[userKey] = userTracking;
    saveTracking(tracking);
}
```

### Counter Reset

**Reset Time:** Pukul 00:00 setiap hari (midnight)

**Reset Mechanism:**
- Counter **TIDAK** direset secara eksplisit
- Filter berdasarkan tanggal saat check rate limit
- Hanya deletion hari ini yang dihitung
- Data lama (>30 hari) dibersihkan saat record deletion

**Timezone:**
- Menggunakan timezone browser user
- Konsisten dengan sistem waktu aplikasi

---

## User Experience

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  User mencoba menghapus transaksi tertutup              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Check Rate Limit                                        │
│  - Get today's deletion count                           │
│  - Compare with thresholds                              │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Count < 5      │    │  Count >= 5     │
│  (Normal)       │    │                 │
└────────┬────────┘    └────────┬────────┘
         │                      │
         │              ┌───────┴────────┐
         │              │                │
         │              ▼                ▼
         │     ┌─────────────┐  ┌─────────────┐
         │     │  Count 5-9  │  │  Count >=10 │
         │     │  (Warning)  │  │  (Blocked)  │
         │     └──────┬──────┘  └──────┬──────┘
         │            │                │
         ▼            ▼                ▼
┌─────────────────────────────────────────────────────────┐
│  Proceed       Show Warning      Block Access           │
│  Normally      + Allow Continue  + Show Error           │
└─────────────────────────────────────────────────────────┘
```

### User Notifications

#### Normal (0-4 deletions)
**Notification:** None
**Action:** Proceed normally

#### Warning (5-9 deletions)
**Notification Type:** Warning Toast/Alert
**Message:**
```
⚠️ Peringatan: Anda telah menghapus 5 transaksi tertutup hari ini. 
Harap berhati-hati.

Jumlah penghapusan hari ini: 5
Batas maksimal: 10
```
**Action:** User dapat melanjutkan dengan extra caution

#### Blocked (10+ deletions)
**Notification Type:** Error Modal (cannot be dismissed easily)
**Message:**
```
❌ Batas maksimal penghapusan transaksi tertutup tercapai (10 per hari). 
Akses diblokir.

Akses akan dipulihkan pada: 00:00 besok

Jika ada kebutuhan mendesak, hubungi administrator sistem.
```
**Action:** User tidak dapat melanjutkan

---

## Monitoring dan Reporting

### Real-Time Monitoring

#### Metrics to Track
1. **Deletion Count per User per Day**
   - Track setiap user
   - Aggregate per hari
   - Identify high-frequency users

2. **Warning Triggers**
   - Count berapa kali warning triggered
   - Identify users yang sering trigger warning
   - Analyze patterns

3. **Block Events**
   - Log setiap block event
   - Alert administrator
   - Investigate cause

### Reporting

#### Daily Report
**Generated:** Setiap hari pukul 00:30
**Contains:**
- Total deletions per user
- Users who triggered warnings
- Users who were blocked
- Comparison with previous days

**Format:**
```
Daily Rate Limit Report - 2024-01-15
=====================================

Total Deletions: 15
Unique Users: 3

User Activity:
- admin1: 8 deletions (Warning triggered)
- admin2: 5 deletions (Warning triggered)
- admin3: 2 deletions (Normal)

Warnings: 2
Blocks: 0

Trend: +20% from yesterday
```

#### Weekly Report
**Generated:** Setiap Senin pukul 08:00
**Contains:**
- Weekly trends
- Top users by deletion count
- Warning and block statistics
- Recommendations

#### Monthly Report
**Generated:** Tanggal 1 setiap bulan
**Contains:**
- Monthly trends
- Pattern analysis
- Policy effectiveness review
- Recommendations for policy adjustment

### Alerts

#### Warning Alert
**Trigger:** User reaches 5 deletions
**Recipients:** Monitoring system
**Priority:** Low
**Action Required:** None (informational)

#### Block Alert
**Trigger:** User reaches 10 deletions
**Recipients:** 
- Monitoring system
- System administrator
- Security team
**Priority:** High
**Action Required:** Review user activity

#### Anomaly Alert
**Trigger:** 
- Multiple users blocked in same day
- Single user blocked multiple days in a row
- Unusual deletion patterns
**Recipients:**
- System administrator
- Security team
- Management
**Priority:** Critical
**Action Required:** Immediate investigation

---

## Exception Handling

### Emergency Situations

#### Definition
Emergency situation adalah kondisi di mana:
- Terdapat kesalahan kritis yang harus segera diperbaiki
- Dampak kesalahan sangat signifikan
- Tidak dapat menunggu hingga reset counter
- Sudah mencapai rate limit block

#### Process

1. **User Request**
   - User menghubungi administrator sistem
   - Menjelaskan situasi emergency
   - Menyediakan justifikasi detail

2. **Administrator Review**
   - Review request
   - Verify emergency status
   - Check audit trail
   - Assess risk

3. **Approval**
   - If approved:
     - Administrator manually resets counter
     - Document exception in log
     - Notify security team
   - If rejected:
     - Explain reason to user
     - Suggest alternatives
     - Wait for automatic reset

4. **Exception Logging**
   ```javascript
   {
     "type": "RATE_LIMIT_EXCEPTION",
     "timestamp": "2024-01-15T16:30:00.000Z",
     "user": "admin1",
     "requestedBy": "admin1",
     "approvedBy": "sysadmin",
     "reason": "Critical error in financial report",
     "justification": "Detailed explanation...",
     "previousCount": 10,
     "resetTo": 0
   }
   ```

### Manual Reset Procedure

**⚠️ WARNING:** Manual reset should be used ONLY in emergency situations

**Steps:**
1. Open browser console
2. Run command:
   ```javascript
   // Get tracking
   const tracking = JSON.parse(localStorage.getItem('rateLimitTracking') || '{}');
   
   // Reset specific user
   const username = 'admin1';
   const userKey = `user_${username}`;
   if (tracking[userKey]) {
     tracking[userKey].deletions = [];
     localStorage.setItem('rateLimitTracking', JSON.stringify(tracking));
     console.log(`Rate limit reset for ${username}`);
   }
   ```
3. Document in exception log
4. Notify security team

---

## Policy Review

### Review Schedule

#### Quarterly Review
**Frequency:** Every 3 months
**Participants:**
- System administrator
- Security team
- Key users (super admins)
- Management

**Review Points:**
- Threshold effectiveness
- User feedback
- Incident analysis
- Policy violations
- Recommendations for adjustment

#### Annual Review
**Frequency:** Once per year
**Participants:**
- All stakeholders
- External auditors (if applicable)

**Review Points:**
- Comprehensive policy evaluation
- Compliance check
- Industry best practices comparison
- Major policy updates if needed

### Policy Adjustment Criteria

#### Increase Thresholds
**Consider if:**
- Very low violation rate (<1%)
- Legitimate use cases frequently blocked
- Business needs changed
- User feedback indicates too restrictive

**Process:**
1. Analyze data thoroughly
2. Propose new thresholds
3. Get approval from stakeholders
4. Test in staging environment
5. Implement gradually
6. Monitor closely

#### Decrease Thresholds
**Consider if:**
- High violation rate (>10%)
- Abuse detected
- Security concerns
- Audit recommendations

**Process:**
1. Document security concerns
2. Propose new thresholds
3. Get approval from stakeholders
4. Notify users in advance
5. Implement with grace period
6. Monitor and support users

### Metrics for Evaluation

1. **Effectiveness Metrics**
   - % of users who never trigger warning
   - % of users who trigger warning but not block
   - % of users who get blocked
   - Average deletions per user per day

2. **User Impact Metrics**
   - User complaints
   - Exception requests
   - Legitimate use cases blocked
   - User satisfaction

3. **Security Metrics**
   - Abuse attempts detected
   - Suspicious patterns identified
   - Incidents prevented
   - Audit findings

---

## Appendix

### Rationale for Thresholds

#### Why 5 for Warning?
- Allows reasonable daily operations
- Early warning for unusual activity
- Time to review before block
- Based on historical data analysis

#### Why 10 for Block?
- Prevents excessive deletions
- Allows for legitimate high-volume days
- Balances security and usability
- Industry standard for similar operations

### Comparison with Industry Standards

| Operation Type | Our Threshold | Industry Average | Notes |
|---------------|---------------|------------------|-------|
| Critical Deletion | 10/day | 5-15/day | Within range |
| Warning Level | 5/day | 3-7/day | Within range |
| Block Duration | Until midnight | 1-24 hours | Standard |

### Related Policies
- Security Policy
- Audit Trail Policy
- Access Control Policy
- Incident Response Policy

### Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2024 | Initial policy | Development Team |

---

**Versi Dokumen:** 1.0.0  
**Terakhir Diperbarui:** 2024  
**Status:** Final  
**Review Berikutnya:** 3 bulan setelah deployment
