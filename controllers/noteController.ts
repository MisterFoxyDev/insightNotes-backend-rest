import { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { formatNote } from "../utils/utils";
import AppError from "../utils/appError";
import { generateSummary } from "../utils/aiUtils";

const prisma = new PrismaClient();

const noteController = {
  createNote: (async (req, res, next) => {
    try {
      const { title, content } = req.body;

      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Utilisateur non authentifié", 401));
      }

      // Générer un résumé automatique si le contenu est disponible
      const summary = content ? await generateSummary(content) : null;
      console.log("Résumé généré lors de la création:", summary);

      // 1. Créer d'abord la note sans le résumé
      const newNote = await prisma.note.create({
        data: {
          title,
          content,
          user: {
            connect: { id: userId },
          },
        },
      });

      // 2. Puis mettre à jour le résumé séparément si disponible
      if (summary) {
        try {
          // Utiliser Prisma.raw pour s'assurer que la valeur est correctement échappée
          await prisma.$executeRaw`
            UPDATE notes 
            SET summary = ${Prisma.sql`${summary}`}
            WHERE id = ${newNote.id}
          `;
          console.log(
            "Résumé ajouté à la base de données pour la note:",
            newNote.id.toString(),
          );
        } catch (summaryError) {
          console.error("Erreur lors de l'ajout du résumé:", summaryError);
        }
      }

      // Récupérer la note avec le résumé pour la réponse
      const completeNote = await prisma.note.findUnique({
        where: { id: newNote.id },
      });

      res.status(201).json({
        status: "success",
        data: {
          note: formatNote(completeNote || newNote),
        },
      });
    } catch (error) {
      console.error("Erreur détaillée:", error);
      return next(
        new AppError(
          "Erreur lors de la création de la note, merci de réessayer plus tard",
          400,
        ),
      );
    }
  }) as RequestHandler,

  getUserNotes: (async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return next(
          new AppError("Veuillez vous connecter pour accéder à vos notes", 401),
        );
      }

      const notes = await prisma.note.findMany({
        where: {
          userId,
        },
      });

      res.status(200).json({
        status: "success",
        data: {
          notes: notes.map(formatNote),
        },
      });
    } catch (error) {
      return next(
        new AppError(
          "Erreur lors de la récupération des notes, merci de réessayer plus tard",
          400,
        ),
      );
    }
  }) as RequestHandler,

  getNoteById: (async (req, res, next) => {
    try {
      const { id } = req.params;
      const note = await prisma.note.findUnique({
        where: { id: BigInt(id) },
      });

      if (!note) {
        return next(new AppError("Note non trouvée", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          note: formatNote(note),
        },
      });
    } catch (error) {
      return next(
        new AppError(
          "Erreur lors de la récupération de la note, merci de réessayer plus tard",
          400,
        ),
      );
    }
  }) as RequestHandler,

  updateNote: (async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Utilisateur non authentifié", 401));
      }

      // Vérifie si la note existe et appartient à l'utilisateur
      const existingNote = await prisma.note.findFirst({
        where: {
          id: BigInt(id),
          userId,
        },
      });

      if (!existingNote) {
        return next(new AppError("Note non trouvée ou non autorisée", 404));
      }

      // 1. Mettre à jour la note sans le résumé
      const updateFields: any = { ...updates };
      delete updateFields.summary; // Supprimer le résumé s'il est présent dans les mises à jour

      const updatedNote = await prisma.note.update({
        where: { id: BigInt(id) },
        data: updateFields,
      });

      // 2. Si le contenu a été modifié, régénérer et mettre à jour le résumé séparément
      if (updates.content && updates.content !== existingNote.content) {
        try {
          const summary = await generateSummary(updates.content);
          console.log("Résumé généré lors de la mise à jour:", summary);

          if (summary) {
            // Utiliser Prisma.raw pour s'assurer que la valeur est correctement échappée
            await prisma.$executeRaw`
              UPDATE notes 
              SET summary = ${Prisma.sql`${summary}`}
              WHERE id = ${BigInt(id)}
            `;
            console.log(
              "Résumé mis à jour dans la base de données pour la note:",
              id,
            );
          }
        } catch (summaryError) {
          console.error(
            "Erreur lors de la mise à jour du résumé:",
            summaryError,
          );
        }
      }

      // Récupérer la note avec le résumé pour la réponse
      const completeNote = await prisma.note.findUnique({
        where: { id: BigInt(id) },
      });

      res.status(200).json({
        status: "success",
        data: { note: formatNote(completeNote || updatedNote) },
      });
    } catch (error) {
      console.error("Erreur détaillée:", error);
      return next(
        new AppError(
          "Erreur lors de la mise à jour de la note, merci de réessayer plus tard",
          400,
        ),
      );
    }
  }) as RequestHandler,

  deleteNote: (async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Utilisateur non authentifié", 401));
      }

      // Conversion sécurisée de l'ID en BigInt
      let noteId;
      try {
        noteId = BigInt(id);
      } catch (error) {
        return next(new AppError("Format d'ID de note invalide", 400));
      }

      const existingNote = await prisma.note.findFirst({
        where: { id: noteId, userId },
      });

      if (!existingNote) {
        return next(new AppError("Note non trouvée ou non autorisée", 404));
      }

      await prisma.note.delete({ where: { id: noteId } });

      // Ajout de logs pour débogage
      console.log(`Note avec ID ${id} supprimée avec succès`);

      res.status(204).send();
    } catch (error) {
      console.error("Erreur détaillée:", error);
      return next(
        new AppError(
          "Erreur lors de la suppression de la note, merci de réessayer plus tard",
          400,
        ),
      );
    }
  }) as RequestHandler,
};

export default noteController;
