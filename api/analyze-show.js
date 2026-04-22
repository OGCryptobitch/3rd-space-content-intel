// Vercel Serverless Function: AI-powered show analysis
// Uses Claude to analyze any show and map it to 3rd Space fandom ecosystem

const FANDOM_REF = `romantasy: "Romantasy" (Fantasy & Sci-Fi, 8.5M)
fantasy_epic: "Epic Fantasy" (Fantasy & Sci-Fi, 12M)
grimdark: "Grimdark Fantasy" (Fantasy & Sci-Fi, 3.2M)
urban_fantasy: "Urban Fantasy" (Fantasy & Sci-Fi, 5.5M)
cozy_fantasy: "Cozy Fantasy" (Fantasy & Sci-Fi, 2.8M)
fae_fantasy: "Fae / Faerie Fantasy" (Fantasy & Sci-Fi, 4.1M)
military_fantasy: "Military Fantasy" (Fantasy & Sci-Fi, 2.2M)
space_opera: "Space Opera" (Fantasy & Sci-Fi, 7M)
hard_scifi: "Hard Sci-Fi" (Fantasy & Sci-Fi, 4.5M)
cyberpunk: "Cyberpunk" (Fantasy & Sci-Fi, 5.2M)
dystopian: "Dystopian" (Fantasy & Sci-Fi, 9M)
ya_fantasy: "YA Fantasy" (Fantasy & Sci-Fi, 11M)
progression_fantasy: "Progression Fantasy" (Fantasy & Sci-Fi, 3.5M)
litrpg: "LitRPG" (Fantasy & Sci-Fi, 2.9M)
xianxia: "Xianxia / Wuxia" (Fantasy & Sci-Fi, 6M)
space_western: "Space Western" (Fantasy & Sci-Fi, 1.8M)
dark_romance: "Dark Romance" (Romance & Drama, 6.2M)
paranormal_romance: "Paranormal Romance" (Romance & Drama, 4.8M)
spicy_romance: "Spicy Romance" (Romance & Drama, 7.5M)
contemporary_romance: "Contemporary Romance" (Romance & Drama, 9.5M)
romcom: "Romantic Comedy" (Romance & Drama, 8M)
literary_fiction: "Literary Fiction" (Romance & Drama, 6.5M)
historical_fiction: "Historical Fiction" (Romance & Drama, 5.8M)
regency: "Regency / Period Drama" (Romance & Drama, 4.2M)
cosmic_horror: "Cosmic Horror" (Horror & Thriller, 3.8M)
slasher: "Slasher / Gore" (Horror & Thriller, 4.5M)
final_girl: "Final Girl" (Horror & Thriller, 3.2M)
true_crime: "True Crime" (Horror & Thriller, 15M)
mystery: "Mystery / Whodunit" (Horror & Thriller, 8.5M)
cozy_mystery: "Cozy Mystery" (Horror & Thriller, 3.6M)
tech_thriller: "Tech Thriller" (Horror & Thriller, 4M)
horror_comedy: "Horror Comedy" (Horror & Thriller, 2.5M)
weird_fiction: "Weird Fiction" (Horror & Thriller, 1.8M)
booktok: "BookTok" (Community & Platform, 20M)
book_clubs: "Book Clubs" (Community & Platform, 12M)
fanfiction: "Fanfiction" (Community & Platform, 18M)
web_serial: "Web Serial" (Community & Platform, 5M)
podcast_fiction: "Fiction Podcasts" (Community & Platform, 8M)
audio_drama: "Audio Drama" (Community & Platform, 3.5M)
indie_creators: "Indie Creator Economy" (Community & Platform, 10M)
anime_manga: "Anime / Manga" (Genre Fiction, 25M)
kpop: "K-Pop / K-Drama" (Genre Fiction, 22M)
vampire: "Vampire Fiction" (Genre Fiction, 5.5M)
werewolf: "Werewolf / Shifter" (Genre Fiction, 4.2M)
witchcraft: "Witchcraft" (Genre Fiction, 3.8M)
cottagecore: "Cottagecore" (Genre Fiction, 4M)
gothic: "Gothic Fiction" (Genre Fiction, 3M)
cli_fi: "Climate Fiction" (Genre Fiction, 2M)
slice_of_life: "Slice of Life" (Genre Fiction, 7M)
martial_arts: "Martial Arts" (Genre Fiction, 5M)
western: "Western" (Genre Fiction, 3.5M)
tabletop_rpg: "Tabletop RPG" (Genre Fiction, 8M)
indie_games: "Indie Games" (Genre Fiction, 12M)`;

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = req.query.q;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Missing query parameter: q' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(200).json({ fallback: true, error: 'No API key configured' });
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a content intelligence analyst for 3rd Space, a media platform. Analyze the following show/movie/book/game and map it to our fandom ecosystem.

Title: "${query.trim()}"

Our fandom keys:
${FANDOM_REF}

Return ONLY a JSON object:
{
  "title": "Official title",
  "fandoms": [{"key": "fandom_key", "label": "Name", "audience": 8500000, "reason": "Brief reason"}],
  "themes": ["theme1", "theme2", "theme3"],
  "adjacentFandoms": [{"key": "fandom_key", "label": "Name", "audience": 8500000}],
  "totalAudience": 45000000,
  "promoTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Rules:
- Pick 3-6 direct fandoms that best match this title
- Pick 3-8 adjacent fandoms connected to the direct ones
- Do NOT mix horror fandoms into non-horror shows or romance into non-romance
- totalAudience = sum of all unique fandom audiences
- promoTips = 3-4 actionable promotion strategies for 3rd Space
- Only use fandom keys from the list above`
      }]
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return res.status(200).json({ ...result, source: 'claude' });
  } catch (err) {
    console.error('Claude API error:', err.message || err);
    return res.status(200).json({ fallback: true, error: 'AI analysis unavailable' });
  }
}
