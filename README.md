# Academic OS – Academic Performance Ecosystem

> 🔴 **PROJECT STATUS: NO LONGER ACTIVE (Archived at v7.2.1)**
>
> **The Cloud Era is here.**
> As of February 2026, Academic OS evolved into a fully cloud-synchronized platform.
> It now supports **Google Drive Sync**, **iOS**, **Android**, and **Windows** natively.

> 🎓 **Your personal, cloud-synced academic command center.**

[![Version](https://img.shields.io/github/v/release/Ta-Pc/Academic-OS?label=latest%20version)](https://github.com/Ta-Pc/Academic-OS/releases)
[![Downloads](https://img.shields.io/github/downloads/Ta-Pc/Academic-OS/total)](https://github.com/Ta-Pc/Academic-OS/releases)
[![Platform](https://img.shields.io/badge/platform-Web%20|%20iOS%20|%20Android%20|%20Windows-blue)](https://academic-os.pages.dev)

**Academic OS** replaces complex grade spreadsheets with a professional analytics engine that tells you **what your workload is**, **how you’re performing**, and **whether you’re on track to reach your goals**.

This final **v7.2.1** release represents the pinnacle of the tool's evolution, featuring a complete batch-processing suite for rapid workload management and deep performance optimizations.

---

## 📦 Access & Download

**[🌐 Open Web Version (Instant Access)](https://academic-os.pages.dev)**

**[⬇️ Grab the Latest Release (Assets)](https://github.com/Ta-Pc/Academic-OS/releases)**

| Platform | Support | Status | File / Link |
|:---|:---:|:---|:---|
| **Web (Browser)** | ✅ | **Live (Cloud Sync)** | [academic-os.pages.dev](https://academic-os.pages.dev) |
| **Android** | ✅ | **Native** | `Academic-OS.apk` |
| **iOS** | ✅ | **Native** | `AcademicOS.ipa` |
| **Windows** | ✅ | **Desktop** | `Academic-OS.exe` |

---

## ✨ Key Features (The Cloud Era)

| | |
|-|-|
| **☁️ Cloud Synchronization** | • **Google Drive Sync:** Seamlessly backup and restore your data across devices.<br>• **Conflict Resolution:** Smart handling of older/newer files with "Soft" and "Hard" delete capabilities. |
| **📊 The Analytics Deck** | • **Grade Trajectory:** Finance-style area charts showing your average over time.<br>• **Radar Charts:** Analyze your strengths vs. weaknesses by category. |
| **🧠 Advanced Batch Actions** | • **Bulk Management:** Mark as submitted, enter results, shift due dates, and adjust effort for multiple assessments at once.<br>• **Exporting:** Integrated "Export to Excel" for selected assessments.<br>• **Safety Logic:** Selection states respect active filters and include deletion guardrails. |
| **⚡ Optimized Engine** | • **Zero N+1 Queries:** Database layer optimized for batch retrieval.<br>• **Lazy Loading:** Assessment details are deferred until needed to ensure 60fps scrolling. |
| **📜 Reports & Transcripts** | • **Digital Transcript:** View a year-by-year breakdown of your credits.<br>• **PDF Export:** Generate official-looking transcript reports with one click. |

---

## 🖼️ Screenshots

<div align="center">
  <img alt="Academic OS dashboard screenshot dark" src="https://github.com/user-attachments/assets/1e7e08a9-38ee-48ae-be99-1142866a1395" width="49%"/>
  <img alt="Academic OS Action Pane screenshot dark" src="https://github.com/user-attachments/assets/b6898097-8b6a-440d-8719-c7bbe674cd95" width="49%" />
</div>
<br>
<div align="center">
  <img alt="Analytics View 1" src="https://github.com/user-attachments/assets/5cdee4a4-c930-44ef-bfca-17c59efe0500" width="49%" />
  <img alt="Analytics View 2" src="https://github.com/user-attachments/assets/074daac8-51aa-4496-a54d-2383e67726d5" width="49%" />
</div>
<br>
<div align="center">
  <img alt="Academic OS Timer screenshot" src="https://github.com/user-attachments/assets/c4f005cd-d15b-4137-a347-71e8cfb67a59" width="49%" />
  <img alt="Module details light mode" src="https://github.com/user-attachments/assets/65a0e01c-79a8-4e9d-ac34-b7297fffee30" width="49%" />
</div>

---

## 🛠️ Installation

### 🌐 Web (Recommended)
Simply visit **[academic-os.pages.dev](https://academic-os.pages.dev)**. The app runs locally in your browser using WASM, now with optional Cloud Sync.

### 🤖 Android
1. Download **`Academic-OS.apk`** from the release page.
2. Install manually on your device.

### 🍎 iOS
1. Download the **`AcademicOS.ipa`** file.
2. Install via AltStore or Sideloadly (requires developer mode).

### 💻 Windows
1. Download **`Academic-OS.exe`** from the release page.
2. Follow the setup wizard.

---

## 📨 Contact & Support

**Email:** sip.zuma@gmail.com
**GitHub Issues:** [Report a Bug](https://github.com/Ta-Pc/Academic-OS/issues)

---

## Tech Stack
* **Core:** React, Vite, TypeScript
* **State:** TanStack Query, Zustand
* **Database:** SQLite (WASM) via SQL.js
* **Cloud:** Google Drive API (OAuth 2.0)
* **Build:** Electron (Desktop), Capacitor (Mobile), GitHub Actions (CI/CD)

---

© 2026 Sipho Zuma – All rights reserved.
