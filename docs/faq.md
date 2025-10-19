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
Academic OS is your personal, offline-first analytical engine designed to be the single source of truth for your academic performance. It helps you track grades, manage your workload, and understand what you need to do to achieve your academic goals, all without needing an internet connection.

#### What platforms is Academic OS available on?
Academic OS is available for:
*   Windows 10/11
*   macOS 11+
*   Linux (via AppImage)
*   Android and iOS (as a Progressive Web App installed from your browser)

Please see the [Installation Guide](installation.md) for detailed instructions.

#### Is Academic OS free?
Academic OS is proprietary software. The compiled binary releases are available for personal, non-commercial use as per the terms of the license.

#### Can I collaborate with friends or classmates using Academic OS?
No. Academic OS is designed as a single-user, personal tool. All data and features are for your individual use on your own devices. There are no social or multi-user capabilities.

---

## Data and Privacy

#### Is my academic data safe? Where is it stored?
**Your data is 100% private and safe.** All information you enter into Academic OS is stored **locally on your device's storage** (using a SQLite database file). Nothing is ever uploaded to a server, the cloud, or sent over the internet. You have full control over your data.

#### Can Academic OS automatically import my grades from my university's website?
No. To ensure your privacy and maintain its offline-first design, Academic OS does not connect to any university systems. You can add your data manually or use the CSV import feature.

#### How do I move my data to a new computer?
You can easily move your entire Academic OS setup to a new device by following these two steps:
1.  **On your OLD device:** Go to `Settings > Data Management > Export Full Backup`. This will save a single `.json` file containing all your data.
2.  **On your NEW device:** Install Academic OS, then go to `Settings > Data Management > Import from Backup`. Select the `.json` file you just saved.
    **Warning:** Importing from a backup will completely overwrite any data on the new device.

#### What happens if my computer crashes? Is my data gone forever?
Academic OS has a robust backup system. It automatically creates "safety backups" before certain critical operations (like an app update). While these are helpful for recovery from system errors, we **strongly recommend** that you perform regular manual backups using the `Export Full Backup` feature and save the file to a separate location (like a USB drive or cloud storage service) for maximum safety.

---

## Modules and Assessments

#### What's the best way to get my course data into the app?
You have two options:
1.  **Manual Entry:** Use the "Add New" button to create your modules and assessments one by one. This is great for starting fresh.
2.  **CSV Import:** If you have your data in a spreadsheet, you can export it as a CSV file and use our powerful import wizard. This is the fastest way to get set up.

#### What's the correct format for the CSV import?
The import wizard is flexible, but here are some key guidelines:
*   The file must be a `.csv` file.
*   It should use a **semicolon (`;')** or **comma (`,')** as the delimiter.
*   The first row must be headers (e.g., "Module Code", "Assessment Name").
*   **Required columns:** `Module Code`, `Assessment Name`, `Assessment Type`, `Weight (%)`.
*   **Date format:** The importer can understand many formats (like `YYYY-MM-DD`, `DD/MM/YYYY`, `21 October 2025`). For unconfirmed dates, you can simply write `TBC`.

#### I dropped a course. Should I Archive it or Delete it?
**We strongly recommend you Archive it.**
*   **Archiving** a module hides it from your dashboard and excludes it from all calculations, but it preserves the data. You can restore it at any time from `Settings > Data Management > Manage Archived Modules`.
*   **Deleting** a module is a **permanent, irreversible** action that erases the module and all its associated assessments and grades forever.

#### I made a mistake entering a grade. How do I fix it?
Simply find the assessment in the Assessment View or on its Module Details page, click on it to open the details dialog, and click the "Edit" button. You can then change the grade and save your corrections. All your stats will update automatically.

---

## Features and Customization

#### What does the "Status Badge" on a module (e.g., "At Risk") mean?
The status badge is a quick indicator of a module's health, based on your performance and goals:
*   **On Track:** Everything looks good!
*   **Needs Attention:** Your projected final grade is below your target grade.
*   **At Risk:** Your performance is low enough that you may not meet the minimum requirement to pass or enter the final exam.

#### What are the customizable "Tiles" on the Module Details page?
Tiles are widgets that show specific pieces of information about a module. You can completely customize the layout for each module!
*   Click the three-dot menu on a module page and select "Customize View."
*   From there, you can add, remove, and drag-and-drop tiles.
*   You can even create your own custom tiles with unique formulas to track the stats that matter most to you.

---

## Troubleshooting

#### I'm trying to open the app on my Mac and it says it's from an "unidentified developer."
This is a standard macOS security feature. To fix this, right-click the Academic OS icon in your Applications folder, select "Open" from the menu, and then click "Open" again in the dialog box. You only need to do this the first time you run the app.

#### Windows is showing a blue "Windows protected your PC" screen.
This is the Windows Defender SmartScreen, which is common for new applications. Click **"More info,"** and then click the **"Run anyway"** button.

#### I forgot to add a semester during the initial setup. Can I add it later?
Yes. You can manage your academic calendar at any time by going to `Settings > Academic Setup`.

#### I want to start over completely. How do I do that?
You can reset the entire application by going to `Settings > Danger Zone > Reset Application`.
**Warning:** This is a highly destructive action that will erase all your data. The system will force you to download a final backup of your data before you can proceed with the reset.

---

### Still have questions?
If your question isn't answered here, please feel free to:
*   🐛 [Report a Bug](https://github.com/siphozuma/Academic-OS/issues/new?template=bug_report.md)
*   💡 [Request a Feature](https://github.com/siphozuma/Academic-OS/issues/new?template=feature_request.md)
*   📧 Email us at **support@academicos.com**