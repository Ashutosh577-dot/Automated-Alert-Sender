# Automated-Alert-Sender

A dedicated microservice designed to handle automated, bulk communications for the Gurukulam Management Suite. This module connects the backend attendance database with third-party messaging APIs to ensure parents are instantly notified about their ward's absence or exam results.

## ⚙️ Core Architecture & Logic

This system is built with a strong focus on reliability, error handling, and avoiding spam. It utilizes the following software engineering principles:

### 1. Human-in-the-Loop (HITL) Execution
100% automation in bulk messaging can lead to API rate limits or accidental spam if the primary data source has an error. To mitigate this:
* **Data Aggregation:** The script first aggregates the data of all absent students for the day.
* **Review Dashboard:** It displays this compiled list on a secure dashboard.
* **Manual Override:** An authorized admin reviews the list and manually triggers the final broadcast button.

### 2. Multi-Channel Fallback Mechanism
To achieve a near 100% delivery rate, the notification engine relies on a fail-proof routing system:
* **Primary Route:** The system initially attempts to dispatch the alert via the WhatsApp API.
* **Fallback Route:** If the WhatsApp delivery fails (due to network timeout, unlinked number, or API limits), the system automatically catches the error and reroutes the message via standard SMS.

## ✨ Features
* **Daily Absentee Alerts:** Instant notifications to parents if a student is marked absent in the main database.
* **Exam Result Broadcaster:** A parallel module integrated within the same engine that compiles student marks and dispatches personalized digital result cards directly to parents' inboxes.

## 🛠️ Tech Stack
* **Language:** JavaScript (ES6+)
* **Environment:** Google Apps Script / Node.js
* **Integrations:** RESTful APIs (WhatsApp Business / SMS Gateways)

## 🔒 Security Notice: Secret Management
Following secure coding practices, all sensitive credentials (e.g., Messaging API Keys, Authentication Tokens) have been intentionally stripped from this public repository. 
* Placeholder `"YOUR_API_KEY_HERE"` has been used in the codebase. 
* In the production environment, these variables are injected securely.
