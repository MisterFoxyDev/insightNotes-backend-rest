import { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { formatNote } from "../utils/utils";
import AppError from "../utils/appError";
// Vous devrez installer ces packages
// npm install openai axios

import OpenAI from "openai";

const prisma = new PrismaClient();

// Configuration de l'API OpenAI - à adapter selon votre service
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const aiController = {
  // Service de résumé des notes
  summarizeNote: (async (req, res, next) => {
    try {
      const { noteId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Utilisateur non authentifié", 401));
      }

      // Récupérer la note à résumer
      const note = await prisma.note.findFirst({
        where: {
          id: BigInt(noteId),
          userId,
        },
      });

      if (!note) {
        return next(new AppError("Note non trouvée ou non autorisée", 404));
      }

      // Appel à l'API d'IA pour générer un résumé
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Résume ce texte de manière concise : ${note.content}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.5,
      });

      const summary =
        completion.choices[0]?.message?.content?.trim() ||
        "Aucun résumé généré";

      // Mettre à jour la note avec le résumé généré en utilisant $executeRaw
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

      // Récupérer la note mise à jour
      const updatedNote = await prisma.note.findUnique({
        where: { id: BigInt(noteId) },
      });

      // Retourner le résumé
      res.status(200).json({
        status: "success",
        data: {
          summary,
          note: formatNote(updatedNote || note),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la génération du résumé:", error);
      return next(new AppError("Erreur lors de la génération du résumé", 500));
    }
  }) as RequestHandler,

  // Service d'organisation des notes
  organizeNotes: (async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Utilisateur non authentifié", 401));
      }

      // Récupérer toutes les notes de l'utilisateur
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

      // Préparer les notes pour l'analyse par l'IA
      const notesData = notes.map((note) => ({
        id: note.id.toString(),
        title: note.title,
        content: note.content || "",
      }));

      // Appel à l'API d'IA pour organiser les notes
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

      // Traitement du résultat
      const organizationResult =
        completion.choices[0]?.message?.content?.trim() ||
        "Aucune organisation générée";

      // Note: Dans une implémentation réelle, vous devriez parser la réponse
      // et la formater correctement. Ici c'est simplifiée.

      res.status(200).json({
        status: "success",
        data: {
          organization: organizationResult,
          notes: notes.map(formatNote),
        },
      });
    } catch (error) {
      console.error("Erreur lors de l'organisation des notes:", error);
      return next(new AppError("Erreur lors de l'organisation des notes", 500));
    }
  }) as RequestHandler,
};

export default aiController;
