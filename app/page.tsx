import AuthForm from "@/app/components/AuthForm";

export default function LandingPage() {
  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.logoRow}>
          <span style={styles.logoText}> FlashGen</span>
        </div>
        <div style={styles.hero}>
          <h1 style={styles.h1}>Study smarter,<br />not harder.</h1>
          <p style={styles.heroSub}>
            Upload your notes, textbooks, or lecture slides
            and get a personalized flashcard set in seconds.
          </p>
        </div>
        <ul style={styles.featureList}>
          {[
            'Upload PDFs, images, or any document type',
            'AI generates challenging, thoughtful questions',
            'Organize sets by subject — free, no paywall',
          ].map((f) => (
            <li key={f} style={styles.featureItem}>
              <span style={styles.checkDot}>✓</span>
              <span style={styles.featureText}>{f}</span>
            </li>
          ))}
        </ul>
        <p style={styles.tagline}>Powered by Azure + OpenAI · Built for students</p>
      </div>
      <div style={styles.right}>
        <AuthForm />
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh' },
  left: {
    flex: 1.1, background: '#185FA5', padding: '48px 40px',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  },
  logoRow: { marginBottom: 8 },
  logoText: { fontSize: 20, fontWeight: 600, color: '#fff' },
  hero: { marginTop: 40 },
  h1: { fontSize: 32, fontWeight: 500, color: '#fff', lineHeight: 1.3, margin: '0 0 12px' },
  heroSub: { fontSize: 14, color: '#B5D4F4', lineHeight: 1.7, margin: 0 },
  featureList: {
    listStyle: 'none', padding: 0, margin: '36px 0 0',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  featureItem: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  checkDot: {
    background: '#378ADD', color: '#fff', borderRadius: '50%',
    width: 20, height: 20, minWidth: 20, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 11, marginTop: 2,
  },
  featureText: { fontSize: 13, color: '#E6F1FB', lineHeight: 1.5 },
  tagline: { fontSize: 12, color: '#85B7EB', marginTop: 'auto', paddingTop: 32 },
  right: {
    flex: 1, background: '#f3f4f6',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
  },
} as const;
