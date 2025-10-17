# Academic OS Installation Guide

This guide provides step-by-step instructions for installing Academic OS on your computer or mobile device.

## System Requirements

Before you begin, please ensure your device meets the following minimum requirements:

*   **Windows:** Windows 10 or Windows 11
*   **macOS:** macOS 11 (Big Sur) or newer
*   **Linux:** A modern distribution that supports AppImage (e.g., Ubuntu 20.04+, Fedora 34+, Arch Linux)
*   **Android:** Android 7.0 (Nougat) or newer with a modern browser (Google Chrome recommended)
*   **iOS / iPadOS:** iOS 14 or newer with Safari

## Download the Latest Release

All installation files for desktop platforms can be found on our GitHub Releases page.

📦 **[Download the Latest Release](https://github.com/siphozuma/Academic-OS/releases/latest)**

---

## Desktop Installation

Follow the instructions for your specific operating system.

### 🖥️ Windows

1.  Download the `Academic-OS-Setup-x.x.x.exe` file from the latest release.
2.  Double-click the downloaded `.exe` file to run the installer.
3.  Follow the on-screen instructions to complete the installation.

> **⚠️ Note: Windows Defender SmartScreen**
> You may see a blue "Windows protected your PC" screen. This is normal for new applications.
> *   Click **"More info"**.
> *   Then, click the **"Run anyway"** button that appears.

### 🍎 macOS

1.  Download the `Academic-OS-x.x.x.dmg` file from the latest release.
2.  Double-click the downloaded `.dmg` file to open it. A new window will appear.
3.  Drag the **Academic OS** icon into your **Applications** folder.
4.  You can now eject the disk image and run Academic OS from your Applications folder or Launchpad.

> **⚠️ Note: "App can't be opened because it is from an unidentified developer"**
> This is a standard macOS security feature. To run the app for the first time:
> *   Right-click the **Academic OS** icon in your Applications folder.
> *   Select **"Open"** from the context menu.
> *   A dialog will appear. Click the **"Open"** button again to confirm.
> You will only need to do this once.

### 🐧 Linux (AppImage)

1.  Download the `Academic-OS-x.x.x.AppImage` file from the latest release.
2.  Make the file executable. You can do this in two ways:
    *   **Via the Terminal (Recommended):**
        Navigate to the directory where you downloaded the file and run:
        ```bash
        chmod a+x Academic-OS-*.AppImage
        ```
    *   **Via the GUI:**
        Right-click the `.AppImage` file, go to **Properties > Permissions**, and check the box that says **"Allow executing file as program"** (this may vary slightly between desktop environments).
3.  Double-click the `.AppImage` file to run Academic OS. No installation is required.

---

## Mobile Installation (Progressive Web App)

Academic OS is a Progressive Web App (PWA), which means you can "install" it directly from your browser to your home screen for an app-like experience.

### 🤖 Android (using Chrome)

1.  Navigate to the Academic OS web application URL in your Chrome browser.
2.  Tap the three-dot menu icon (⋮) in the top-right corner.
3.  Select **"Install app"** or **"Add to Home screen"** from the menu.
4.  Confirm the action in the prompt that appears.
5.  An Academic OS icon will be added to your home screen, and it will run like a native app.

### 📱 iOS / iPadOS (using Safari)

1.  Navigate to the Academic OS web application URL in your Safari browser.
2.  Tap the **Share** icon (a box with an arrow pointing up) in the bottom navigation bar.
3.  Scroll down in the share sheet and tap **"Add to Home Screen"**.
4.  Confirm the name and tap **"Add"** in the top-right corner.
5.  The Academic OS icon will now be on your Home Screen.

---

## First Launch

After installation, open Academic OS. The first-time setup wizard will launch automatically to guide you through configuring your degree profile, academic calendar, and preferences. For more details, please see our [User Guide](user-guide.md).

## Having Trouble?

If you've followed these steps and are still having issues:
*   Ensure your internet connection is stable and try downloading the file again.
*   Double-check that you have followed the OS-specific notes for bypassing security warnings (SmartScreen on Windows, Gatekeeper on macOS).
*   If the problem persists, please [open a bug report on our GitHub Issues page](https://github.com/siphozuma/Academic-OS/issues/new?template=bug_report.md) with details about your operating system and the issue you're facing.