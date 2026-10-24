# Freelancer Saathi

### Your AI-Powered Financial Saathi

**Freelancer Saathi** is an agentic AI financial assistant designed specifically for freelancers. It combines AI-powered financial intelligence with a human-in-the-loop approval system, helping freelancers understand their income, evaluate currency conversion opportunities, manage approvals, track transactions, and maintain financial records from one intelligent dashboard.

> **Autonomous Intelligence. Human Authority.**

---

## ✨ Key Features

### 🤖 AI Saathi
A conversational AI assistant that helps freelancers understand their financial activity using natural language.

- English support
- Roman Urdu support
- Financial context awareness
- Income and payment insights
- Approval and transaction assistance
- Safe fallback when AI services are unavailable

### 💰 Income Intelligence
Automatically analyzes freelancer income and separates it into:

- Total income
- Available funds
- Processed funds
- Recent payment activity

### 💱 FX Advisor
Analyzes USD/PKR conversion information and provides intelligent conversion recommendations.

The current implementation uses **mock/demo exchange-rate data** for safe development and demonstration.

### 🛡️ Guardian Agent
The core safety layer of Freelancer Saathi.

Financial actions cannot be executed directly by the AI. The Guardian Agent creates an approval request and keeps the user in control.

**Core principle:**

`AI Recommendation → Guardian Approval → Human Decision → Execution`

### ✅ Human-in-the-Loop Approval
Users can:

- Review recommended actions
- See the reason for an action
- Approve a conversion
- Reject a conversion

No financial action is executed without explicit user authorization.

### 🏦 Mock Banking Engine
A secure demonstration banking layer that simulates USD → PKR conversion.

It includes:

- Approval verification
- Duplicate execution prevention
- Payment processing
- Transaction records
- Audit logging

> No real banking transaction is performed by the current system.

### 📄 Smart Documents
Freelancer Saathi can generate transaction receipts for completed demo transactions.

### 📊 Analytics Dashboard
Provides a visual overview of:

- Total income
- Available funds
- Processed funds
- Payment activity
- Financial health
- Guardian status
- Approval activity

### 🧾 Audit Trail
Important financial decisions and system actions are recorded to improve transparency and traceability.

---

## 🧠 Agentic Workflow

```text
Freelance Payment
       ↓
Income Agent
       ↓
FX Advisor
       ↓
Guardian Agent
       ↓
Approval Request
       ↓
Human Decision
   ↙         ↘
Reject      Approve
               ↓
         Mock Bank Engine
               ↓
          Transaction
               ↓
         Audit + Receipt
```

The AI assists with reasoning and communication, while deterministic backend services enforce financial rules and authorization.

---

## 🏗️ Architecture

```text
┌──────────────────────────────┐
│        Next.js Frontend      │
│ Dashboard • Chat • Analytics │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│        FastAPI Backend       │
│                              │
│  Income Agent                │
│  FX Advisor                  │
│  Guardian Agent              │
│  AI Saathi                   │
│  Document Agent              │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
   Database         OpenAI API
       │
       ▼
 Mock Banking Engine
```

---

## 🛠️ Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Motion
- Lucide React

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- OpenAI API

### Database

- SQLite for local development
- PostgreSQL-ready production configuration

### Documents

- ReportLab

### Deployment

- Vercel
- Environment-based production configuration

---

## 🔐 Safety Architecture

Freelancer Saathi is designed around a simple rule:

> **AI can recommend. Humans authorize.**

The system separates AI reasoning from financial execution.

Key protections include:

- Human approval before financial actions
- Guardian Agent authorization
- Duplicate transaction protection
- Audit logging
- Database-backed transaction verification
- Environment-based secret management
- No API keys stored in the repository
- AI cannot directly execute banking actions

---

## 📁 Project Structure

```text
freelancer-saathi/
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   │
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── lib/
│   └── package.json
│
└── README.md
```

---

## 🚀 Local Development

### 1. Clone the repository

```bash
git clone https://github.com/buildwithalee/freelancer-saathi.git
cd freelancer-saathi
```

### 2. Backend Setup

```bash
cd backend

python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-6-luna
APP_ENV=development
FRONTEND_ORIGINS=http://localhost:3000
```

Run the backend:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger during development:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

## 🌐 Production Environment Variables

The production deployment uses environment variables rather than committed secrets.

### Backend

```env
APP_ENV=production
DATABASE_URL=your_production_database_url
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-6-luna
FRONTEND_ORIGINS=https://your-frontend-domain.com
```

Never commit `.env` files or API keys to GitHub.

---

## 🔌 Main API Modules

Freelancer Saathi provides APIs for:

- Payments
- Income analysis
- FX advice
- Guardian approvals
- Approval decisions
- Audit logs
- Mock bank conversions
- Transactions
- Receipt generation
- Agent workflow
- AI chat
- Health monitoring

---

## ⚠️ Important Disclaimer

Freelancer Saathi is currently a **software prototype / demonstration system**.

The banking engine and exchange-rate information used by the current implementation are mock/demo components. The application does **not** perform real banking transactions.

Financial recommendations generated by the system should not be considered professional financial advice.

---

## 🎯 Project Vision

Freelancers often manage income across platforms, currencies, payment systems, and financial tools.

Freelancer Saathi explores a different approach: an intelligent financial companion capable of understanding financial context and recommending useful actions while preserving human authority over consequential decisions.

The long-term vision is:

**Understand → Recommend → Protect → Authorize → Execute → Record**

---

## 👨‍💻 Developer

**Ali Raza Memon**  
BS Information Technology  
Quaid-e-Awam University of Engineering, Science & Technology (QUEST), Nawabshah

---

## 📌 Project Status

**Active Development**

Core capabilities currently implemented:

- ✅ AI financial assistant
- ✅ Income Agent
- ✅ FX Advisor
- ✅ Guardian Agent
- ✅ Human approval workflow
- ✅ Mock banking execution
- ✅ Audit logging
- ✅ Transaction records
- ✅ PDF receipts
- ✅ Dashboard
- ✅ Income & Payments views
- ✅ Approval management
- ✅ Transactions view
- ✅ Documents view
- ✅ Analytics dashboard
- ✅ Production-oriented environment configuration

---

### Freelancer Saathi

**AI-powered financial intelligence — with the freelancer always in control.**
