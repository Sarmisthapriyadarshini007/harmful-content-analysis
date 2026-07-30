const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const dummyData = [
  {
    video_url: 'https://www.youtube.com/watch?v=IaigtoNPAZw',
    video_title: 'Kolkata Is Bad !',
    channel_name: 'NOT YOUR TYPE',
    thumbnail_url: 'https://i.ytimg.com/vi/IaigtoNPAZw/maxresdefault.jpg',
    overall_safety_score: 87,
    risk_level: 'Low Risk',
    toxic_percentage: 2,
    spam: 5,
    hate_speech: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    scan_duration_ms: 12400
  },
  {
    video_url: 'https://www.youtube.com/watch?v=IP-2zn-oz7E',
    video_title: 'Best Engineering Colleges in Odisha',
    channel_name: 'UORMiND',
    thumbnail_url: 'https://i.ytimg.com/vi/IP-2zn-oz7E/maxresdefault.jpg',
    overall_safety_score: 73,
    risk_level: 'Medium Risk',
    toxic_percentage: 25,
    spam: 10,
    hate_speech: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    scan_duration_ms: 14200
  },
  {
    video_url: 'https://www.youtube.com/watch?v=z1iJsPdrICY',
    video_title: 'Desi Friends With Benefits',
    channel_name: 'NOT YOUR TYPE',
    thumbnail_url: 'https://i.ytimg.com/vi/z1iJsPdrICY/maxresdefault.jpg',
    overall_safety_score: 94,
    risk_level: 'Safe',
    toxic_percentage: 1,
    spam: 2,
    hate_speech: 0,
    created_at: new Date().toISOString(),
    scan_duration_ms: 9800
  },
  {
    video_url: 'https://www.youtube.com/watch?v=uefE3Id1yDw',
    video_title: 'Indian Siblings & Childhood Memories',
    channel_name: 'NOT YOUR TYPE',
    thumbnail_url: 'https://i.ytimg.com/vi/uefE3Id1yDw/maxresdefault.jpg',
    overall_safety_score: 96,
    risk_level: 'Safe',
    toxic_percentage: 0,
    spam: 1,
    hate_speech: 0,
    created_at: new Date().toISOString(),
    scan_duration_ms: 10500
  }
];

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO reports (
      video_url, video_title, channel_name, thumbnail_url,
      overall_safety_score, risk_level, toxic_percentage, spam, hate_speech,
      created_at, scan_duration_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  dummyData.forEach(d => {
    stmt.run([
      d.video_url, d.video_title, d.channel_name, d.thumbnail_url,
      d.overall_safety_score, d.risk_level, d.toxic_percentage, d.spam, d.hate_speech,
      d.created_at, d.scan_duration_ms
    ]);
  });
  
  stmt.finalize();
  console.log("Dummy data seeded successfully.");
});

db.close();
