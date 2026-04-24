'use client';

import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import FlashcardSetCard from '@/components/FlashcardSetCard';

// Placeholder sets — replace with real Cosmos DB fetch later
const MOCK_SETS = [
  { id: 1, title: 'Cell Biology Chapter 4', subject: 'Biology', cardCount: 24, date: 'Apr 8, 2026' },
  { id: 2, title: 'Constitutional Law Review', subject: 'Law', cardCount: 18, date: 'Apr 6, 2026' },
  { id: 3, title: 'Organic Chemistry — Reactions', subject: 'Chemistry', cardCount: 31, date: 'Apr 3, 2026' },
];

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.push('/');
  }, [session, isPending, router]);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    // TODO: POST file to your /api/upload route → Azure Blob → generate flashcards
    await new Promise((r) => setTimeout(r, 1500)); // simulate upload
    setUploading(false);
    alert(`"${file.name}" uploaded! Flashcard generation coming soon.`);
  }

  async function handleLogout() {
    await signOut();
    router.push('/');
  }

  if (isPending) return <p style={{ padding: 40 }}>Loading...</p>;
  if (!session) return null;

  const firstName = session.user?.name?.split(' ')[0] ?? 'there';

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.navLogo}>⚡ FlashGen</span>
        <div style={styles.navRight}>
          <span style={styles.navUser}>{session.user?.email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      <main style={styles.main}>
        {/* Greeting */}
        <div style={styles.greeting}>
          <h1 style={styles.h1}>Hey {firstName} 👋</h1>
          <p style={styles.greetingSub}>Upload a document to generate a new flashcard set.</p>
        </div>

        {/* Upload zone */}
        <div
          style={{
            ...styles.uploadZone,
            borderColor: dragOver ? '#185FA5' : '#d1d5db',
            background: dragOver ? '#E6F1FB' : '#f9fafb',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.docx"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <p style={styles.uploadIcon}>📄</p>
          <p style={styles.uploadText}>
            {uploading ? 'Uploading...' : 'Drag & drop your file here, or click to browse'}
          </p>
          <p style={styles.uploadHint}>Supports PDF, DOCX, JPG, PNG</p>
          <button
            style={styles.uploadBtn}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            disabled={uploading}
          >
            {uploading ? 'Processing...' : 'Choose file'}
          </button>
        </div>

        {/* Saved sets */}
        <div style={styles.setsSection}>
          <h2 style={styles.h2}>Your flashcard sets</h2>
          {MOCK_SETS.length === 0 ? (
            <p style={styles.empty}>No flashcard sets yet. Upload a document to get started!</p>
          ) : (
            <div style={styles.grid}>
              {MOCK_SETS.map((set) => (
                <FlashcardSetCard key={set.id} {...set} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f3f4f6' },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: 56,
    background: '#185FA5',
  },
  navLogo: { fontSize: 18, fontWeight: 600, color: '#fff' },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  navUser: { fontSize: 13, color: '#B5D4F4' },
  logoutBtn: {
    fontSize: 13,
    color: '#fff',
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    borderRadius: 6,
    padding: '5px 12px',
    cursor: 'pointer',
  },
  main: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
  greeting: { marginBottom: 28 },
  h1: { fontSize: 26, fontWeight: 500, margin: '0 0 6px', color: '#111' },
  greetingSub: { fontSize: 14, color: '#666', margin: 0 },
  uploadZone: {
    border: '2px dashed',
    borderRadius: 12,
    padding: '40px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: 40,
  },
  uploadIcon: { fontSize: 32, margin: '0 0 10px' },
  uploadText: { fontSize: 14, color: '#444', margin: '0 0 4px', fontWeight: 500 },
  uploadHint: { fontSize: 12, color: '#999', margin: '0 0 16px' },
  uploadBtn: {
    padding: '9px 22px',
    background: '#185FA5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  },
  setsSection: {},
  h2: { fontSize: 18, fontWeight: 500, margin: '0 0 16px', color: '#111' },
  empty: { fontSize: 14, color: '#999' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
};
