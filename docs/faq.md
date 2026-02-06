# Academic OS - Frequently Asked Questions

Have a question? We've compiled a list of common questions and answers below.

## Table of Contents
- [General Questions](#general-questions)
- [Data and Privacy](#data-and-privacy)
- [Modules and Assessments](#modules-and-assessments)
- [Features and Customization](#features-and-customization)
- [Troubleshooting](#troubleshooting)

---

## General Questions

#### What is Academic OS?
Academic OS is your personal, offline-first analytical engine designed to be the single source of truth for your academic performance. It helps you track grades, manage your workload, and understand what you need to do to achieve your academic goals.

#### What platforms is Academic OS available on?
Academic OS is available for:
*   **Desktop:** Windows 10/11, macOS 11+, and Linux.
*   **Mobile:** Android (Native App) and iOS (Web/PWA).

#### Is Academic OS free?
Academic OS is proprietary software. The compiled binary releases are available for personal, non-commercial use as per the terms of the license.

#### Can I collaborate with friends or classmates using Academic OS?
No. Academic OS is designed as a **single-user, personal tool**. All data and features are for your individual use. There are no social or multi-user capabilities.

---

## Data and Privacy

#### Is my academic data safe? Where is it stored?
**Your data is 100% private.**
*   **Local First:** By default, all data is stored locally on your device in a secure SQLite database.
*   **Cloud Sync (Optional):** You can opt-in to **Cloud Sync** to backup your data to your personal Google Drive. This data remains private to you and is not accessible by us or anyone else.

#### Can Academic OS automatically import my grades from my university's website?
No. To ensure your privacy and stability, Academic OS does not connect to third-party university portals. You can add data manually or use the CSV import feature.

#### How do I move my data to a new computer or phone?
You have two options:
1.  **Cloud Sync (Recommended):** Simply sign in with your Google Account on the new device. Your data will automatically sync.
2.  **Manual Backup:**
    *   **Old Device:** Go to `Settings > Data Management > Export Full Backup` to save a `.json` file.
    *   **New Device:** Go to `Settings > Data Management > Import from Backup` and select that file.

#### What happens if my computer crashes?
If you have **Cloud Sync** enabled, your data is safe in your Google Drive and can be restored instantly. If you use the app offline, we recommend performing regular manual backups (`Export Full Backup`) to an external drive.

---

## Modules and Assessments

#### What's the best way to get my course data into the app?
1.  **Manual Entry:** Use the "Add Module" button for quick setup.
2.  **CSV Import:** Use the Import Wizard (in Settings) to load data from a spreadsheet. This is ideal for bulk importing past marks.

#### I dropped a course. Should I Archive it or Delete it?
**We strongly recommend you Archive it.**
*   **Archiving:** Hides the module from your dashboard but keeps the data for your records. (Restore via `Settings > Data Management`).
*   **Deleting:** Permanently erases the module and all its grades. This cannot be undone.

#### I made a mistake entering a grade. How do I fix it?
Open the assessment details (click on it in any list) and select **"Edit"**. Update the grade, and all your module stats—including term averages—will recalculate instantly.

---

## Features and Customization

#### What does the "Status Badge" mean?
It indicates your performance trend:
*   **On Track:** You are meeting your goals.
*   **Needs Attention:** You are falling slightly behind your target.
*   **At Risk:** Your current performance indicates you might fail or miss exam entry requirements.

#### What are "Tiles"?
Tiles are the widgets on your Module Details page. You can customize them:
*   **Layout:** Drag and drop to rearrange.
*   **Builder:** Create your own tiles using Excel-style formulas (e.g., `=AVERAGE(assessments.result)`) to track exactly what you care about.

---

## Troubleshooting

#### Windows is showing a blue "Windows protected your PC" screen.
This is the **Windows Defender SmartScreen**. It often flags new software. Click **"More info,"** and then click the **"Run anyway"** button to proceed.

#### I want to start over completely. How do I do that?
Go to **Settings > Danger Zone > Reset Application**.
*   **Warning:** This will delete **ALL** local data.
*   If Cloud Sync is on, you may also need to delete your remote backup (an option is provided in the Cloud Settings) to prevent it from re-syncing.
