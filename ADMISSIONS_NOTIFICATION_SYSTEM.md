# Admissions Notification System

## Overview

Comprehensive notification system that automatically sends messages to guardians at each stage of the student enrollment cycle via in-app notifications, email, and SMS.

## Architecture

### Components Created

1. **Types** (`src/types/notifications.ts`)
   - `NotificationChannel`: in_app | email | sms
   - `NotificationStage`: 14 different stages from lead creation to enrollment
   - `Notification`: Complete notification data structure
   - `NotificationTemplate`: Template structure for each stage
   - `NotificationPreferences`: Guardian notification preferences

2. **Templates** (`src/config/notificationTemplates.ts`)
   - 14 pre-configured templates for each stage
   - Bilingual support (English & Arabic)
   - Customizable messages with variable replacement
   - Channel-specific content (email subject, SMS message, in-app)
   - Priority levels (low, medium, high)

3. **Service** (`src/services/notificationService.ts`)
   - `createNotification()`: Generate notification from template
   - `sendNotification()`: Send through all channels
   - `notifyGuardians()`: Send to all guardians of an application
   - `getGuardianNotifications()`: Retrieve notification history
   - `markNotificationAsRead()`: Mark as read
   - `getUnreadCount()`: Get unread count

4. **API** (`src/api/admissionsNotifications.ts`)
   - Stage-specific notification triggers
   - Easy integration with existing workflows
   - Automatic data extraction and formatting

5. **Hook** (`src/hooks/useNotifications.ts`)
   - React hook for notification management
   - Real-time updates (polling every 30s)
   - Mark as read functionality
   - Unread count tracking

6. **UI Component** (`src/components/notifications/NotificationCenter.tsx`)
   - Bell icon with unread badge
   - Dropdown notification panel
   - Visual indicators for read/unread
   - Channel status indicators
   - Time formatting (relative time)

## Notification Stages

### 1. Lead Created

**Trigger:** When a parent shows interest
**Channels:** In-app, Email, SMS
**Content:** Thank you message, confirmation of inquiry received

### 2. Lead Contacted

**Trigger:** When admissions team contacts the lead
**Channels:** In-app, Email, SMS
**Content:** Follow-up notification

### 3. Application Submitted

**Trigger:** When application form is submitted
**Channels:** In-app, Email, SMS
**Content:** Confirmation with application ID, next steps

### 4. Documents Pending

**Trigger:** When required documents are missing
**Channels:** In-app, Email, SMS
**Content:** List of missing documents, upload instructions
**Priority:** HIGH

### 5. Documents Complete

**Trigger:** When all documents are uploaded
**Channels:** In-app, Email
**Content:** Confirmation, application under review

### 6. Test Scheduled

**Trigger:** When placement test is scheduled
**Channels:** In-app, Email, SMS
**Content:** Test date, time, location, subject
**Priority:** HIGH

### 7. Test Completed

**Trigger:** When test is completed
**Channels:** In-app, Email
**Content:** Test score, next steps

### 8. Interview Scheduled

**Trigger:** When interview is scheduled
**Channels:** In-app, Email, SMS
**Content:** Interview date, time, location, interviewer
**Priority:** HIGH

### 9. Interview Completed

**Trigger:** When interview is completed
**Channels:** In-app, Email
**Content:** Thank you, decision timeline

### 10. Under Review

**Trigger:** When application enters review stage
**Channels:** In-app, Email
**Content:** Review status, expected decision timeline

### 11. Decision - Accepted

**Trigger:** When student is accepted
**Channels:** In-app, Email, SMS
**Content:** 🎉 Congratulations, enrollment deadline, next steps
**Priority:** HIGH

### 12. Decision - Waitlisted

**Trigger:** When student is waitlisted
**Channels:** In-app, Email, SMS
**Content:** Waitlist status, position, what to expect
**Priority:** HIGH

### 13. Decision - Rejected

**Trigger:** When application is rejected
**Channels:** In-app, Email
**Content:** Decision notification, reason (if applicable)
**Priority:** HIGH

### 14. Enrollment Complete

**Trigger:** When enrollment is finalized
**Channels:** In-app, Email, SMS
**Content:** 🎓 Welcome message, grade, section, start date
**Priority:** HIGH

## Usage Examples

### Example 1: Send notification when application is submitted

```typescript
import { notifyApplicationSubmitted } from "@/api/admissionsNotifications";

// In your application submission handler
async function handleApplicationSubmit(application: Application) {
  // Save application to database
  await saveApplication(application);

  // Send notifications to all guardians
  await notifyApplicationSubmitted(application);
}
```

### Example 2: Send notification when test is scheduled

```typescript
import { notifyTestScheduled } from "@/api/admissionsNotifications";

async function scheduleTest(application: Application, test: Test) {
  // Save test to database
  await saveTest(test);

  // Notify guardians
  await notifyTestScheduled(application, test);
}
```

### Example 3: Send notification when decision is made

```typescript
import { notifyDecision } from "@/api/admissionsNotifications";

async function makeDecision(application: Application, decision: Decision) {
  // Save decision
  await saveDecision(decision);

  // Update application status
  application.status =
    decision.decision === "accept"
      ? "accepted"
      : decision.decision === "reject"
        ? "rejected"
        : "waitlisted";
  await updateApplication(application);

  // Notify guardians
  await notifyDecision(application, decision);
}
```

### Example 4: Use NotificationCenter in UI

```typescript
import NotificationCenter from "@/components/notifications/NotificationCenter";

export default function ParentDashboard() {
  const guardianId = "G001"; // Get from auth context

  return (
    <div>
      <header>
        <NotificationCenter guardianId={guardianId} />
      </header>
      {/* Rest of dashboard */}
    </div>
  );
}
```

## Integration Points

### Where to Add Notification Triggers

1. **Lead Creation** (`src/components/leads/CreateLeadModal.tsx`)
   - After successful lead creation
   - Call `notifyLeadCreated()`

2. **Application Submission** (`src/components/admissions/ApplicationCreateStepper.tsx`)
   - After final step completion
   - Call `notifyApplicationSubmitted()`

3. **Document Upload** (Document management component)
   - After each document upload
   - Check if all complete, call `notifyDocumentsComplete()`
   - If missing, call `notifyDocumentsPending()`

4. **Test Scheduling** (`src/components/admissions/ScheduleTestModal.tsx`)
   - After test is scheduled
   - Call `notifyTestScheduled()`

5. **Test Completion** (Test management)
   - After test score is entered
   - Call `notifyTestCompleted()`

6. **Interview Scheduling** (`src/components/admissions/ScheduleInterviewModal.tsx`)
   - After interview is scheduled
   - Call `notifyInterviewScheduled()`

7. **Interview Completion** (Interview management)
   - After interview is marked complete
   - Call `notifyInterviewCompleted()`

8. **Status Change to Under Review** (Application management)
   - When status changes to "under_review"
   - Call `notifyUnderReview()`

9. **Decision Making** (`src/components/admissions/DecisionModal.tsx`)
   - After decision is submitted
   - Call `notifyDecision()`

10. **Enrollment** (`src/components/admissions/EnrollmentForm.tsx`)
    - After enrollment is complete
    - Call `notifyEnrollmentComplete()`

## Message Templates

### Template Variables

All templates support these variables:

- `{studentName}`: Student's name
- `{applicationId}`: Application ID
- `{guardianName}`: Guardian's name
- `{schoolName}`: School name
- `{schoolPhone}`: School phone number
- Plus stage-specific variables (test dates, scores, etc.)

### Customization

To customize templates, edit `src/config/notificationTemplates.ts`:

```typescript
export const NOTIFICATION_TEMPLATES = {
  application_submitted: {
    stage: "application_submitted",
    title: "Your Custom Title",
    titleAr: "عنوانك المخصص",
    message: "Your custom message with {studentName}",
    messageAr: "رسالتك المخصصة مع {studentName}",
    // ... rest of template
  },
};
```

## Channel Configuration

### In-App Notifications

- Stored in localStorage (demo)
- In production: Store in database
- Real-time updates via polling (30s interval)
- Can be upgraded to WebSocket for instant delivery

### Email Notifications

- Currently logs to console (demo)
- In production: Integrate with:
  - SendGrid
  - AWS SES
  - Mailgun
  - Postmark

Example integration:

```typescript
async function sendEmailNotification(notification: Notification) {
  await sendgrid.send({
    to: notification.recipientEmail,
    from: "admissions@school.com",
    subject: getEmailSubject(notification),
    html: generateEmailHTML(notification),
  });
}
```

### SMS Notifications

- Currently logs to console (demo)
- In production: Integrate with:
  - Twilio
  - AWS SNS
  - Vonage (Nexmo)
  - MessageBird

Example integration:

```typescript
async function sendSMSNotification(notification: Notification) {
  await twilio.messages.create({
    to: notification.recipientPhone,
    from: "+1234567890",
    body: getSMSMessage(notification),
  });
}
```

## Guardian Preferences

### Future Enhancement

Add guardian notification preferences:

```typescript
interface NotificationPreferences {
  guardianId: string;
  enableInApp: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  language: "en" | "ar";
  emailAddress?: string;
  phoneNumber?: string;
}
```

Store in database and check before sending:

```typescript
const prefs = await getGuardianPreferences(guardian.id);
if (!prefs.enableEmail) {
  // Skip email channel
}
```

## Monitoring & Analytics

### Track Notification Metrics

- Delivery rate per channel
- Open rate (email)
- Click rate (in-app)
- Response time
- Failed deliveries

### Add to Dashboard

```typescript
const metrics = {
  totalSent: 1250,
  deliveryRate: {
    email: 98.5,
    sms: 99.2,
    in_app: 100,
  },
  openRate: {
    email: 75.3,
    in_app: 82.1,
  },
};
```

## Testing

### Test Notification Flow

```typescript
// Test all stages
import { mockApplications } from "@/data/mockAdmissions";
import * as notifications from "@/api/admissionsNotifications";

async function testNotifications() {
  const app = mockApplications[0];

  // Test each stage
  await notifications.notifyApplicationSubmitted(app);
  await notifications.notifyDocumentsPending(app);
  await notifications.notifyTestScheduled(app, app.tests[0]);
  // ... etc
}
```

## Security Considerations

1. **PII Protection**: Ensure notification data is encrypted in transit
2. **Access Control**: Only authorized guardians can view notifications
3. **Rate Limiting**: Prevent notification spam
4. **Opt-out**: Allow guardians to unsubscribe from certain channels
5. **Data Retention**: Define retention policy for notification history

## Performance Optimization

1. **Batch Processing**: Send multiple notifications in batches
2. **Queue System**: Use message queue (Redis, RabbitMQ) for async processing
3. **Caching**: Cache templates and preferences
4. **Retry Logic**: Implement exponential backoff for failed deliveries

## Localization

Currently supports:

- English (en)
- Arabic (ar)

To add more languages:

1. Add language to `Notification` type
2. Add translations to templates
3. Update `createNotification()` to handle new language

## Next Steps

1. **Integrate with existing workflows**: Add notification triggers to all stage transitions
2. **Set up email service**: Configure SendGrid/AWS SES
3. **Set up SMS service**: Configure Twilio/AWS SNS
4. **Add to TopNav**: Include NotificationCenter in main navigation
5. **Create admin panel**: Allow admins to view all notifications sent
6. **Add notification settings**: Let guardians customize preferences
7. **Implement WebSocket**: For real-time in-app notifications
8. **Add analytics**: Track delivery and engagement metrics

## Files Created

1. `src/types/notifications.ts` - Type definitions
2. `src/config/notificationTemplates.ts` - Message templates
3. `src/services/notificationService.ts` - Core notification logic
4. `src/api/admissionsNotifications.ts` - Stage-specific triggers
5. `src/hooks/useNotifications.ts` - React hook
6. `src/components/notifications/NotificationCenter.tsx` - UI component
7. `ADMISSIONS_NOTIFICATION_SYSTEM.md` - This documentation
