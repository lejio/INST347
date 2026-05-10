# AI Flashcards Generator

## Project Overview

Students across colleges, high schools, and even elementary schools struggle to keep up with the volume of material they need to study. Converting dense lecture notes, textbook chapters, and PDFs into study notes can be time-consuming, time that some students do not have.

Our project is a cloud-based flashcard generator that addresses this problem by allowing students to upload their own documents and receive a set of study flashcards based on the section of their choice.

Built with Microsoft Azure, the project uses a Next.js frontend and backend, Azure Blob Storage for document handling, Azure Cosmos DB to manage user data and flashcard sets, and OpenAI AI models to generate flashcard content.

The goal of the project is to create a tool that gives students more time to study by automatically generating flashcards from uploaded documents.

---

# Team
- Samuel Nnadi
- Gene Ni
- Terrence Assa
- Jake Shalvi
- Diego Fonseca

---

# Features

- AI-generated flashcards from uploaded PDFs and notes
- Manual flashcard creation
- User authentication system
- Cloud-based file storage
- Flashcard storage and retrieval
- Responsive web interface
- Secure environment variable configuration

---

# Tech Stack

## Frontend
- Next.js
- React
- Tailwind CSS

## Backend
- Next.js API Routes
- Node.js

## Cloud & Services
- Azure Cosmos DB
- Azure Blob Storage
- Azure SQL
- OpenAI GPT-4o-mini API
- Vercel Deployment

## Authentication
- Better Auth

---

# System Architecture

The application uses:
- Vercel for hosting and compute
- Azure Blob Storage for uploaded files
- Azure Cosmos DB for flashcard data
- Azure SQL for authentication data
- OpenAI API for AI-generated flashcards

---

# Local Setup

Clone the repository:

```bash
git clone git@github.com:lejio/INST347.git
```

This should create a folder containing the most up to date files.

Move into the project folder:

```bash
cd ./INST347
```

You will not be able to make changes directly into the main branch.

You need to create your own branch to work on.

Run this command (replace `branch-name` with your own branch name):

```bash
git checkout -b branch-name
```

Now you should be in your own branch.

You can see all the other branches by using this command:

```bash
git branch
```

Use this command to switch branches:

```bash
git switch branch-name
```

To push your changes:

```bash
git push origin branch-name
```

Create a Pull Request on GitHub if you want to merge your changes into the main branch.

Likewise, if you want to get the most recent changes, you can pull from the main branch into your development branch.