# Drop Notifications Design

## Overview

Users can register interest in specific material/thickness combinations. When admin adds matching inventory, users receive email notifications.

## User Stories

1. **User wants steel 3mm but none available**: Sees "No inventory" message with "Notify me" button
2. **User registers for notification**: Enters email (pre-filled if logged in), selects material/thickness preference
3. **Admin adds new sheet**: System automatically emails interested users
4. **User receives notification**: Email with link to upload page

## Data Model

### New Firestore Collection: `dropPreferences`

```typescript
interface DropPreference {
  id: string;
  userId: string | null;  // null for guest users
  email: string;
  material: string;
  thickness: number;
  createdAt: Timestamp;
  notifiedAt: Timestamp | null;  // When notification was sent
  status: "active" | "notified" | "cancelled";
}
```

### Firestore Rules

```javascript
match /dropPreferences/{prefId} {
  // Users can create their own preferences
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid
    && request.resource.data.keys().hasAll(['email', 'material', 'thickness', 'status', 'createdAt']);

  // Users can read/delete their own preferences
  allow read, delete: if request.auth != null
    && resource.data.userId == request.auth.uid;

  // Admins can read all, update status
  allow read, update: if request.auth != null
    && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

## User Flow

### Upload Page - No Inventory Available

When `hasInventory` is false:

```
┌──────────────────────────────────────────┐
│ ⚠ No sheets currently available          │
│                                          │
│ There are no open sheets in inventory.   │
│                                          │
│ [🔔 Notify me when available]            │
└──────────────────────────────────────────┘
```

### Notification Modal

```
┌──────────────────────────────────────────┐
│           Get Notified                   │
│                                          │
│ We'll email you when new sheets arrive.  │
│                                          │
│ Email: [user@example.com      ]          │
│                                          │
│ Material:   [Steel        ▼]             │
│ Thickness:  [3mm          ▼]             │
│                                          │
│    [Cancel]        [Notify Me]           │
└──────────────────────────────────────────┘
```

## Backend: Cloud Function

### Trigger: On Sheet Creation

```typescript
// functions/src/onSheetCreated.ts
export const onSheetCreated = functions.firestore
  .document('sheets/{sheetId}')
  .onCreate(async (snapshot, context) => {
    const sheet = snapshot.data();
    const { material, thickness } = sheet;

    // Find matching active preferences
    const prefsSnapshot = await admin.firestore()
      .collection('dropPreferences')
      .where('material', '==', material)
      .where('thickness', '==', thickness)
      .where('status', '==', 'active')
      .get();

    if (prefsSnapshot.empty) return;

    // Send emails
    const batch = admin.firestore().batch();
    for (const doc of prefsSnapshot.docs) {
      const pref = doc.data();

      // Send email via SendGrid/Resend
      await sendDropNotificationEmail(pref.email, material, thickness);

      // Update status
      batch.update(doc.ref, {
        status: 'notified',
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  });
```

### Email Template

Subject: `🔔 ${material} ${thickness}mm sheets now available!`

```html
<h1>New Sheets Available!</h1>
<p>Great news! The material you were waiting for is now in stock:</p>
<ul>
  <li><strong>Material:</strong> Steel</li>
  <li><strong>Thickness:</strong> 3mm</li>
</ul>
<p>
  <a href="https://sheetmates.com/upload">Upload your parts now →</a>
</p>
<p style="color: #666; font-size: 12px;">
  You received this email because you registered for drop notifications.
  <a href="https://sheetmates.com/account/notifications">Manage preferences</a>
</p>
```

## Implementation Tasks

### Phase 1: Basic Flow (Frontend Only)
1. Create `DropNotificationModal` component
2. Add "Notify me" button to upload page when no inventory
3. Create `lib/firebase/db/drop-preferences.ts` with CRUD operations
4. Add Firestore rules for dropPreferences collection
5. Add translations for modal and button

### Phase 2: Backend (Cloud Functions)
1. Create Cloud Function triggered on sheet creation
2. Configure email provider (SendGrid or Resend)
3. Create email template
4. Deploy and test

### Phase 3: User Preferences Management
1. Add notifications section to account page
2. Allow users to view/cancel their preferences
3. Show history of notified preferences

## Files to Create/Modify

### New Files
- `components/drop-notification-modal.tsx`
- `lib/firebase/db/drop-preferences.ts`
- `functions/src/onSheetCreated.ts` (Cloud Function)

### Modified Files
- `app/[locale]/(protected)/upload/page.tsx` - Add modal trigger
- `firestore.rules` - Add dropPreferences rules
- `messages/en.json`, `messages/fr.json`, `messages/cs.json` - Add translations

## Dependencies

- Email provider: Resend (recommended for simplicity) or SendGrid
- Firebase Cloud Functions (already in project)

## Out of Scope for Initial Release

- Guest user notifications (requires email verification)
- Multiple preference subscriptions per user
- Notification frequency limits
- Push notifications (web/mobile)
