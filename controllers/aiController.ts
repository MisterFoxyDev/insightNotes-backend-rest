import { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { formatNote } from "../utils/utils";
import AppError from "../utils/appError";

import OpenAI from "openai";

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const aiController = {
  summarizeNote: (async (req, res, next) => {
    try {
      const { noteId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Utilisateur non authentifié", 401));
      }

      const note = await prisma.note.findFirst({
        where: {
          id: BigInt(noteId),
          userId,
        },
      });

      if (!note) {
        return next(new AppError("Note non trouvée ou non autorisée", 404));
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Tu es un assistant chargé de résumer la note suivante: ${note.content}. Tu privilégies l'usage de mots-clés, plutôt que de développer les idées et utiliser des mots de liaison ou de la grammaire. Le résumé doit être le plus court possible. N'hésite pas à utiliser des émojis représentatifs.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.5,
      });

      const summary =
        completion.choices[0]?.message?.content?.trim() ||
        "Aucun résumé généré";

      try {
        await prisma.$executeRaw`
          UPDATE notes 
          SET summary = ${Prisma.sql`${summary}`}
          WHERE id = ${BigInt(noteId)}
        `;
        console.log(
          "Résumé mis à jour dans la base de données pour la note:",
          noteId,
        );
      } catch (summaryError) {
        console.error("Erreur lors de la mise à jour du résumé:", summaryError);
      }

      const updatedNote = await prisma.note.findUnique({
        where: { id: BigInt(noteId) },
      });

      res.status(200).json({
        status: "success",
        data: {
          summary,
          note: formatNote(updatedNote || note),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la génération du résumé:", error);
      return next(
        AppError.create("Erreur lors de la génération du résumé", 500, error),
      );
    }
  }) as RequestHandler,

  organizeNotes: (async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Utilisateur non authentifié", 401));
      }

      const notes = await prisma.note.findMany({
        where: {
          userId,
        },
      });

      if (notes.length === 0) {
        return res.status(200).json({
          status: "success",
          data: {
            categories: [],
            message: "Aucune note à organiser",
          },
        });
      }

      const notesData = notes.map((note) => ({
        id: note.id.toString(),
        title: note.title,
        content: note.content || "",
      }));

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Organise ces notes en catégories pertinentes. Pour chaque catégorie, donne un nom et liste les IDs des notes qui appartiennent à cette catégorie. Voici les notes : ${JSON.stringify(
              notesData,
            )}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const organizationResult =
        completion.choices[0]?.message?.content?.trim() ||
        "Aucune organisation générée";

      res.status(200).json({
        status: "success",
        data: {
          organization: organizationResult,
          notes: notes.map(formatNote),
        },
      });
    } catch (error) {
      console.error("Erreur lors de l'organisation des notes:", error);
      return next(
        AppError.create("Erreur lors de l'organisation des notes", 500, error),
      );
    }
  }) as RequestHandler,
};

export default aiController;
