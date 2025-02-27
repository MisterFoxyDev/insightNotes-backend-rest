import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateSummary = async (
  content: string,
): Promise<string | null> => {
  // if (!content || content.trim().length < 10) {
  //   return null; // Ne pas générer de résumé pour un contenu trop court
  // }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Tu es un assistant chargé de résumer la note suivante: ${content}. Tu privilégies l'usage de mots-clés, plutôt que de développer les idées et utiliser des mots de liaison ou de la grammaire. Le résumé doit être le plus court possible. N'hésite pas à utiliser des émojis représentatifs.`,
        },
      ],
      max_tokens: 100,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Erreur lors de la génération du résumé:", error);
    return null;
  }
};
