export default function FlashcardSetCard({ title, subject, cardCount, date }) {
  return (
    <div style={styles.card}>
      <div style={styles.top}>
        <span style={styles.subject}>{subject}</span>
        <span style={styles.count}>{cardCount} cards</span>
      </div>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.date}>Created {date}</p>
      <button style={styles.btn}>Study now →</button>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '20px 20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  subject: {
    fontSize: 11,
    background: '#E6F1FB',
    color: '#0C447C',
    borderRadius: 4,
    padding: '2px 8px',
    fontWeight: 500,
  },
  count: { fontSize: 12, color: '#888' },
  title: { fontSize: 15, fontWeight: 500, margin: 0, color: '#111' },
  date: { fontSize: 12, color: '#aaa', margin: 0 },
  btn: {
    marginTop: 4,
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '7px 14px',
    fontSize: 13,
    color: '#185FA5',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
};
