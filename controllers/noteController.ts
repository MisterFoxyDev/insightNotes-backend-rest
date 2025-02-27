import { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { formatNote } from "../utils/utils";
import AppError from "../utils/appError";
import { generateSummary, generateTags } from "../utils/aiUtils";

const prisma = new PrismaClient();

const noteController = {
  createNote: (async (req, res, next) => {
    try {
      const { title, content } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Utilisateur non authentifié", 401));
      }

      const summary = content ? await generateSummary(content) : null;
      const tags = content ? await generateTags(content, title) : null;

      const newNote = await prisma.note.create({
        data: {
          title,
          content,
          user: {
            connect: { id: userId },
          },
        },
      });

      if (summary) {
        try {
          await prisma.$executeRaw`
            UPDATE notes 
            SET summary = ${Prisma.sql`${summary}`}
            WHERE id = ${newNote.id}
          `;
        } catch (summaryError) {
          return next(
            AppError.create(
              "Erreur lors de la création de la note, merci de réessayer plus tard",
              400,
              summaryError,
            ),
          );
        }
      }

      if (tags) {
        try {
          await prisma.note.update({
            where: { id: newNote.id },
            data: {
              tags: tags,
            },
          });
        } catch (tagsError) {
          return next(
            AppError.create(
              "Erreur lors de l'ajout des tags, merci de réessayer plus tard",
              400,
              tagsError,
            ),
          );
        }
      }

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
      return next(
        AppError.create(
          "Erreur lors de la création de la note, merci de réessayer plus tard",
          400,
          error,
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

      const existingNote = await prisma.note.findFirst({
        where: {
          id: BigInt(id),
          userId,
        },
      });

      if (!existingNote) {
        return next(new AppError("Note non trouvée ou non autorisée", 404));
      }

      const updateFields: any = { ...updates };
      delete updateFields.summary; // Le résumé est géré séparément

      const updatedNote = await prisma.note.update({
        where: { id: BigInt(id) },
        data: updateFields,
      });

      if (updates.content && updates.content !== existingNote.content) {
        try {
          const summary = await generateSummary(updates.content);
          if (summary) {
            await prisma.$executeRaw`
              UPDATE notes 
              SET summary = ${Prisma.sql`${summary}`}
              WHERE id = ${BigInt(id)}
            `;
          }

          const tags = await generateTags(updates.content, existingNote.title);
          if (tags) {
            await prisma.note.update({
              where: { id: BigInt(id) },
              data: {
                tags: tags,
              },
            });
          }
        } catch (summaryError) {
          return next(
            AppError.create(
              "Erreur lors de la mise à jour du résumé ou des tags, merci de réessayer plus tard",
              400,
              summaryError,
            ),
          );
        }
      }

      const completeNote = await prisma.note.findUnique({
        where: { id: BigInt(id) },
      });

      res.status(200).json({
        status: "success",
        data: { note: formatNote(completeNote || updatedNote) },
      });
    } catch (error) {
      return next(
        AppError.create(
          `Erreur lors de la mise à jour de la note, merci de réessayer plus tard`,
          400,
          error,
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

      res.status(204).send();
    } catch (error) {
      return next(
        AppError.create(
          `Erreur lors de la suppression de la note, merci de réessayer plus tard`,
          400,
          error,
        ),
      );
    }
  }) as RequestHandler,

  getNotesByTag: (async (req, res, next) => {
    try {
      const { tag } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return next(
          new AppError("Veuillez vous connecter pour accéder à vos notes", 401),
        );
      }

      const notes = await prisma.note.findMany({
        where: {
          userId,
          tags: {
            has: tag,
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      res.status(200).json({
        status: "success",
        results: notes.length,
        data: {
          notes: notes.map(formatNote),
        },
      });
    } catch (error) {
      return next(
        AppError.create(
          `Erreur lors de la recherche des notes par tag, merci de réessayer plus tard`,
          400,
          error,
        ),
      );
    }
  }) as RequestHandler,

  getUserTags: (async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Veuillez vous connecter.", 401));
      }

      const allNotes = await prisma.note.findMany({
        where: { userId },
        select: { tags: true },
      });

      let allTags: string[] = [];
      for (const note of allNotes) {
        if (note.tags && note.tags.length > 0) {
          allTags.push(...note.tags);
        }
      }

      const uniqueTags = [...new Set(allTags)].sort();

      const tagCounts = uniqueTags.map((tag) => {
        const count = allNotes.filter(
          (note) => note.tags && note.tags.includes(tag),
        ).length;

        return { tag, count };
      });

      res.status(200).json({
        status: "success",
        results: uniqueTags.length,
        data: {
          tags: tagCounts,
        },
      });
    } catch (error) {
      return next(
        AppError.create("Erreur lors de la récupération des tags", 400, error),
      );
    }
  }) as RequestHandler,
};

export default noteController;
