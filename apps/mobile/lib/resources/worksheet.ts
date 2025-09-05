import type { LessonContent } from '@/lib/ai/claudeService';

// Build a simple HTML worksheet from a lesson
export function buildWorksheetHtml(lesson: NonNullable<LessonContent>): string {
  const styles = `
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; color: #111827; }
    h1 { font-size: 22px; margin: 0 0 8px 0; }
    h2 { font-size: 16px; margin: 18px 0 8px 0; }
    p { font-size: 12px; line-height: 1.5; }
    .section { margin-bottom: 16px; }
    .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .activity { margin-bottom: 8px; }
    .meta { color: #6b7280; font-size: 12px; }
    ul { padding-left: 18px; }
  </style>`;

  const activities = (lesson.activities || []).map((a, i) => `
    <div class="activity box">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${i + 1}. ${escapeHtml(a.title)}</strong>
        <span class="meta">${a.estimatedTime} min</span>
      </div>
      <p>${escapeHtml(a.description)}</p>
      <h3>Instructions</h3>
      <p>${escapeHtml(a.instructions)}</p>
      ${a.materials?.length ? `<p class="meta">Materials: ${a.materials.map(escapeHtml).join(', ')}</p>` : ''}
    </div>
  `).join('');

  const assessments = (lesson.assessmentQuestions || []).map(q => `<li>${escapeHtml(q)}</li>`).join('');
  const home = (lesson.homeExtension || []).map(q => `<li>${escapeHtml(q)}</li>`).join('');

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      ${styles}
      <title>${escapeHtml(lesson.title)} - Worksheet</title>
    </head>
    <body>
      <h1>${escapeHtml(lesson.title)}</h1>
      <p class="meta">AI‑generated lesson worksheet</p>
      <div class="section">
        <div class="box">
          <h2>Overview</h2>
          <p>${escapeHtml(lesson.description || '')}</p>
        </div>
      </div>

      <div class="section">
        <h2>Activities</h2>
        ${activities}
      </div>

      ${assessments ? `<div class="section box"><h2>Assessment Questions</h2><ul>${assessments}</ul></div>` : ''}
      ${home ? `<div class="section box"><h2>Home Extension Ideas</h2><ul>${home}</ul></div>` : ''}
    </body>
  </html>`;
}

export async function generateWorksheetPdf(lesson: NonNullable<LessonContent>): Promise<{ fileUri: string } | null> {
  try {
    const { printToFileAsync } = await import('expo-print');
    const html = buildWorksheetHtml(lesson);
    const file = await printToFileAsync({ html });
    return { fileUri: file.uri };
  } catch (e) {
    console.error('Worksheet PDF generation failed:', e);
    return null;
  }
}

export async function shareFileIfPossible(fileUri: string): Promise<boolean> {
  try {
    const Sharing = await import('expo-sharing');
    if (Sharing?.isAvailableAsync) {
      const avail = await Sharing.isAvailableAsync();
      if (avail) {
        await Sharing.shareAsync(fileUri);
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

