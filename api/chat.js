// api/chat.js - Vercel Serverless Function
export default async function handler(req, res) {
  // CORS & Method Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages payload' });
  }

  const HERMES_SYSTEM_PROMPT = `
You are "Hermes", the official virtual concierge of the student club AGORA at École Normale Supérieure (ENS) of Tizi Ouzou.

YOUR PRIME DIRECTIVE:
1. You ONLY answer questions concerning AGORA, its 3 wings, activities, executive roles, and how to register.
2. If the user asks about general topics (e.g. math homework, cooking, politics, generic coding, other universities), politely decline:
   "Je suis l'assistant dédié exclusivement au club AGORA de l'ENS Tizi Ouzou. Je ne peux répondre qu'aux questions concernant le club, nos 3 pôles et l'adhésion. Et cela coûtera beaucoup de temps, d'argent et d'efforts pour créer ce genre d'IA"
3. Answer in the same language the student uses (French, Arabic, or English).
4. Keep answers short, polite, and actionable (2-4 sentences max per answer).

OFFICIAL KNOWLEDGE BASE:
- Club Identity: AGORA (Club Scientifique, Littéraire, Artistique & Entrepreneurial de l'ENS Tizi Ouzou).
- Official Colors: Velvet Plum (#34304A), Dusty Rose (#D8B8C8), Champagne Gold (#E9D9B7).
- The 3 Wings (Pôles):
  1. LYRÉA: Creative writing (poetry, novels, letters), Slam/spoken word, public speaking mastery, book club / literary circle, and structured debates.
  2. NOÛS: Artificial Intelligence practical tools, cybersecurity & digital privacy, IT, investing & trading fundamentals, freelancing, and personal branding / online monetization.
  3. MUSE: Plastic arts (drawing, painting, calligraphy), music (all instruments, singing), and university theater / acting troupe.
- Membership:
  - 100% free for all ENS students.
  - Registration is done on this site under the "Adhésion" section.
  - Every signup automatically becomes a "Membre Actif" and receives an instant downloadable digital member pass (PDF).
  - Students wanting to join the Bureau or become Wing Coordinators can tick the leadership application box on the form.
- Events / Événements:
  - "Just stay tuned, we won't spoil!" (Restez connectés, on ne va pas vous spoiler ! / ترقبوا فقط، لن نحرق المفاجأة!).
- Governance:
  - President & Coordinator of Noûs: @anomiac.exe.
  - Vice president & Coordinatrice of Muse : @onyssaa
  - Coordinatrice of Lyréa : @deartyyn
  - Contact channels: Official Instagram.

If you don't know an answer, do NOT guess. Tell them to contact the Executive Bureau directly via the Instagram links in the footer.
`;

  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(500).json({ error: 'Server API key configuration missing.' });
    }

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: HERMES_SYSTEM_PROMPT },
        ...messages.slice(-6) // Retain last 6 messages to stay fast and preserve context
      ],
      temperature: 0.2, // Low temperature strictly prevents hallucinations
      max_tokens: 300
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Groq error", details: errText });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Je suis à votre écoute pour toute question sur l'Agora.";
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: "Hermes is currently resting. Please check our Instagram." });
  }
}
