const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateAISuggestions(formData) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

  const prompt = `You are a LinkedIn growth expert. Analyze this profile and provide improvement suggestions.

Current Profile:
- Headline: ${formData.headline}
- About: ${formData.about}
- Skills: ${formData.skills}
- Certifications: ${formData.certifications}
- Target Role: ${formData.targetRole}
- Current Connections: ${formData.connections}

Provide the following in a structured format:

1. THREE HEADLINES: Provide 3 optimized LinkedIn headlines (each max 220 characters)
2. IMPROVED ABOUT SECTION: Rewrite the about section to be compelling and professional (max 2600 characters)
3. RECOMMENDED SKILLS: List 10-15 key skills they should add
4. CERTIFICATIONS TO ADD: Suggest 5 relevant certifications
5. POST IDEAS: Give 5 LinkedIn post topic ideas
6. READY-TO-POST CONTENT: Write 1 complete LinkedIn post (engaging, professional, 150-200 words)
7. DAILY GROWTH TASKS: List specific daily actions

Format your response as JSON with these exact keys:
{
  "headlines": ["headline1", "headline2", "headline3"],
  "about": "improved about section",
  "skills": "skill1, skill2, skill3...",
  "certifications": "cert1, cert2, cert3...",
  "postIdeas": "1. idea1\\n2. idea2\\n3. idea3\\n4. idea4\\n5. idea5",
  "fullPost": "complete ready-to-post content",
  "growthTasks": "Task 1\\nTask 2\\nTask 3"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('Failed to parse AI response');
}

module.exports = { generateAISuggestions };
