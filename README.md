# Development Process

READ THIS BEFORE YOU GET STARTED!!

If this is your first time developing, please read carefully so you don't mess up your files!

To get started run install git and run this command to **clone** the repository:

```
git clone git@github.com:lejio/INST347.git
```

This should have created a file containing the most up to date files.

```
cd ./inst347
```

**You will not be able to make changes into this branch!!**

You need to create your own branch to work on.

Run this command (rename branch-name)
```
git checkout -b branch-name
```

Now you should be in your own branch.

You can see all the other branches by using this command:

```
git branch
```

Use this command to switch branches:

```
git switch branch-name
```

There will be the creation of a preview branch, in which you will push all your changes to.

To push your changes to the preview branch, you can do it on the github website.

Create a pull request if you want to push your changes onto preview branch.

Likewise if you want to get the most recent changes, you can merge into your development branch.



# AI Flashcards Generator

An AI-powered web application that allows users to generate, manage, and study flashcards from uploaded files or manual input.

---

## Overview

AI Flashcards is a full-stack web application built with **Next.js** and powered by **Azure cloud services**. Users can:

* Upload documents and generate flashcards using AI
* Create flashcards manually
* Store and manage flashcard sets
* Authenticate securely using modern auth systems

---

## Tech Stack

### Frontend

* Next.js (App Router)
* React
* Tailwind CSS

### Backend

* Next.js API Routes (`/app/api`)
* Node.js

### Cloud & Services

* Azure Cosmos DB -- database
* Azure Blob Storage -- file storage
* OpenAI GPT-4o-mini API

### Authentication

* Better Auth

---

## Project Structure

```
app/
 ├── api/                 # Backend routes
 │   ├── flashcards/
 │   │   ├── generate/    # AI generation endpoint
 │   │   └── [setId]/     # Flashcard retrieval
 │   └── auth/            # Authentication routes
 │
 ├── dashboard/           # User dashboard UI
 ├── login/               # Login page
 ├── page.tsx             # Homepage
 │
lib/                      # Utility functions (DB, AI, etc.)
public/                   # Static assets
```

---

## Environment Setup

Create a `.env.local` file in the root directory:

```
# Auth
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000

# Azure SQL (Auth DB)
MSSQL_SERVER=your_server
MSSQL_DATABASE=authdb
MSSQL_USER=your_user
MSSQL_PASSWORD=your_password
MSSQL_PORT=1433

# Cosmos DB
COSMOS_ENDPOINT=your_endpoint
COSMOS_KEY=your_key
COSMOS_DATABASE=flashcarddb

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=your_connection
AZURE_STORAGE_CONTAINER_NAME=uploads

# OpenAI
OPENAI_API_KEY=your_key
```

---

## Running Locally

1. Install dependencies:

```
npm install
```

2. Start the dev server:

```
npm run dev
```

3. Open in browser:

```
http://localhost:3000
```

---

## How It Works

### Flashcard Generation Flow

1. User uploads a file (frontend)
2. File is sent to backend API (`/api/flashcards/generate`)
3. Backend:

   * Processes file
   * Sends content to OpenAI
   * Generates flashcards
   * Stores results in Cosmos DB
4. Flashcards are returned and displayed to user

---

## Cloud Architecture

* **Frontend:** Next.js (Vercel or local)
* **Backend:** Next.js API routes
* **Database:** Azure Cosmos DB
* **File Storage:** Azure Blob Storage
* **Authentication DB:** Azure SQL
* **AI Processing:** OpenAI API

---

## Authentication

* Implemented using Better Auth
* Supports secure login/signup
* Uses Azure SQL for storing user credentials

---

## Features

* AI-powered flashcard generation
* File upload + processing
* Manual flashcard creation
* User authentication
* Cloud-based storage
* Dashboard UI

---

## 👥 Team

* Team 3

---

## 📜 License

This project is for academic purposes.
