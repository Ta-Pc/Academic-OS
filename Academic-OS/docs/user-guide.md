# Academic OS - User Guide

Welcome to Academic OS! This guide will walk you through everything you need to know to take control of your academic performance, from initial setup to advanced customization.

## Table of Contents
- [Getting Started: First-Time Setup](#getting-started-first-time-setup)
- [The Main Dashboard: Your Command Center](#the-main-dashboard-your-command-center)
- [Managing Your Modules (Courses)](#managing-your-modules-courses)
- [Managing Your Assessments (Grades & Tasks)](#managing-your-assessments-grades--tasks)
- [Advanced: Customizing Your Views with Tiles](#advanced-customizing-your-views-with-tiles)
- [Settings and Data Management](#settings-and-data-management)

---

## Getting Started: First-Time Setup

When you open Academic OS for the first time, a setup wizard will guide you through a few simple steps to get you up and running.

#### 1. Enter Your Academic Info
First, you'll tell the app about your degree program. You'll be asked for:
*   Your Name and Student Number
*   Degree Name (e.g., BIT Information Systems)
*   Specialization, Duration, and NQF Level

#### 2. Configure Your Academic Calendar
This is a crucial step that powers all the date-related features.
*   The app will start with a default template (e.g., one year with two semesters).
*   Click on a year to expand it.
*   Adjust the start and end dates for your semesters or quarters. You can also add new years if needed.
*   Once you're done, click **Save & Continue**.

#### 3. Import Your Data (Optional)
You can get a head start by importing existing module and assessment data from a CSV file.
*   **If you have a CSV:** Click "Select File" and choose your file. The wizard will guide you through a 5-step process:
    1.  **File Selection:** Upload your `.csv` file.
    2.  **Column Mapping:** Match the columns in your file (like "Assesment Name") to the fields in Academic OS ("Assessment Name"). The "Auto Map" button does a great job of this automatically!
    3.  **Data Preview:** Review the first few rows to make sure everything looks correct. The system will highlight potential errors (in red) or warnings (in yellow).
    4.  **Conflict Resolution:** If you're importing data for modules that don't exist yet, the app will ask you to create them.
    5.  **Confirmation:** Review a final summary and click **Import**.
*   **If you don't have a file:** No problem! Just click **Skip** and you can add your modules and assessments manually later.

#### 4. Set Your Preferences
Finally, choose your preferred look and feel:
*   **Theme:** Light, Dark, or System Default.
*   **Language:** Choose from the available languages.
*   **Notifications:** Enable or disable due date reminders.

Click **Finish Setup**, and you'll be taken to your new dashboard!

---

## The Main Dashboard: Your Command Center

The Dashboard gives you a high-level "10,000-foot view" of your entire academic situation. It's designed to answer "How am I doing?" and "What's next?".

*   **Term Timeline:** See where you are in the current semester, a countdown to exams, and a visual of how much of your grade is still to be determined.
*   **Overall Academic Health:** Get your current Term Average, track weekly study goals, and see a summary of modules that are On Track, Need Attention, or are At Risk.
*   **Priority Actions:** This is your to-do list! It shows the top 3-5 upcoming assessments, automatically sorted by importance.
*   **Day Overload:** A 7-day bar chart that shows how much work is due each day, helping you spot overloaded days in advance.
*   **Modules Overview:** A grid of all your active modules. Each tile gives you a rich summary of that module's status, current mark, and next due item.

#### Switching Between Terms
Use the dropdown menu in the main header to switch the entire dashboard's view to a different semester or year. This is perfect for reviewing past performance or planning for the future.

---

## Managing Your Modules (Courses)

#### Creating a New Module
1.  Click the **"Add New"** button in the global header and select "Create Module".
2.  A drawer will slide open from the right.
3.  Select the Academic Term it belongs to (e.g., "Semester 2, 2025").
4.  Fill in the module details like code, name, credits, and your target grade.
5.  Click **"Save changes"**. You'll be taken directly to the details page for your new module.

#### Viewing and Editing a Module
*   **Quick View:** Click on any module tile on the Dashboard to get a quick overview dialog with key stats and upcoming items.
*   **Full Details:** From the quick view, click **"View Module Details"** to go to its main page.
*   **Editing:** On the Module Details page, click the **"Edit Module"** button in the header. The same drawer from creation will appear, pre-filled with the module's info. Make your changes and click **"Save changes"**.

#### Archiving vs. Deleting a Module
From the Module Details page, you have two options:
*   **Archive (Recommended):** This safely hides the module and its assessments from your main views and calculations. The data is preserved and can be restored later.
*   **Delete (Permanent):** This is a destructive action that will permanently erase the module and all its associated data. To prevent accidents, you will be required to type the module code to confirm.

#### Restoring an Archived Module
1.  Go to **Settings > Data Management > Manage Archived Modules**.
2.  Find the module you want to restore.
3.  Click the "Unarchive" option from its menu. The module will reappear on your dashboard.

---

## Managing Your Assessments (Grades & Tasks)

#### The Assessment View
Navigate to the **"Assessments"** page from the main menu. This gives you a powerful master list of *every single assessment* from *all* your active modules. You can:
*   **Filter:** Show only assessments that are "Overdue," "Due this week," or of a certain type like "Exams."
*   **Sort:** Order your workload by due date, priority score, or module.

#### Adding, Editing, and Deleting Assessments
1.  **Adding:** From a Module Details page or the Assessment View, click the **"Add Assessment"** button. A form will appear where you can enter the name, type (e.g., Quiz, Assignment), due date, and weight.
2.  **Viewing/Editing:** Click on any assessment in a list to open a detailed view.
    *   From this view, click the **"Edit"** button to change its details or enter a grade.
    *   When you enter a grade and save, all your module statistics will update instantly!
3.  **Deleting:** From the detailed view, click the **"Delete"** button. A confirmation will appear to prevent accidental deletion.

---

## Advanced: Customizing Your Views with Tiles

The Module Details page is built with customizable tiles. You can create your own personal dashboard for each course!

#### Customizing the Layout
1.  On any Module Details page, click the three-dot menu in the header and select **"Customize View"**.
2.  The page enters "edit mode." You can now:
    *   Click the red **"X"** on a tile to remove it.
    *   **Drag-and-drop** tiles to reorder them.
    *   Click a **"+"** icon in an empty slot to add a new tile.

#### Creating Your Own Calculation Tiles
1.  While in edit mode, click a **"+"** icon and then **"Create New Tile"**.
2.  The **Tile Builder** will open. Here you can:
    *   Give your tile a name, description, and icon.
    *   Choose how to visualize the data (Number, Progress Bar, etc.).
    *   Define a **formula** using Excel-style syntax. For example, to see your average quiz mark, you could write:
        `=AVERAGE(FILTER(assessments, type="Quiz").result)`
3.  The live preview shows you if your formula works. When you're happy, click **"Save Tile"**. It's now in your library to use in any module!

#### Managing Your Tile Library
In the Tile Selector, click **"Manage Tiles"**. This opens a central library where you can search, edit, duplicate, and archive all your custom tiles.

---

## Settings and Data Management

#### Backing Up and Restoring Your Data
Your data is valuable. We highly recommend making regular backups.
*   **Export Backup:** Go to **Settings > Data Management > Export Full Backup**. This will download a single `.json` file containing all your data. Save this file in a safe place.
*   **Import from Backup:** Go to **Settings > Data Management > Import from Backup**.
    *   **Warning:** This is a destructive action. Importing a file will **completely overwrite** all data currently in the app.
    *   You will be asked to select your backup file and type "IMPORT" to confirm.

#### Resetting the Application
If you want to start completely fresh, you can reset the application.
1.  Go to **Settings > Danger Zone > Reset Application**.
2.  You will be **required** to download a final backup of your data before you can proceed.
3.  After the download, you must type "RESET" to confirm.
4.  All your data will be permanently erased, and the app will return to the first-time setup wizard.