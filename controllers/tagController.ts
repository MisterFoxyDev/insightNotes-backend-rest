import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import AppError from "../utils/appError";
import { formatNote } from "../utils/utils";

const prisma = new PrismaClient();

const tagController = {
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

  updateTag: (async (req, res, next) => {
    try {
      const { oldTag, newTag } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Veuillez vous connecter.", 401));
      }

      if (!oldTag) {
        return next(
          new AppError(
            "Erreur dans la récupération du tag à modifier, veuillez rééssayer",
            400,
          ),
        );
      }

      if (!newTag) {
        return next(
          new AppError("Veuillez renseigner le nouveau nom du tag.", 400),
        );
      }

      const allNotes = await prisma.note.findMany({
        where: { userId },
        select: { id: true, tags: true },
      });

      // Mettre à jour les notes qui contiennent l'ancien tag
      let updatedCount = 0;

      for (const note of allNotes) {
        if (note.tags && note.tags.includes(oldTag)) {
          const updatedTags = note.tags.map((tag) =>
            tag === oldTag ? newTag : tag,
          );

          // Éviter les doublons si le nouveau tag existe déjà dans la note
          const uniqueTags = [...new Set(updatedTags)];

          await prisma.note.update({
            where: { id: note.id },
            data: { tags: uniqueTags },
          });

          updatedCount++;
        }
      }

      res.status(200).json({
        status: "success",
        message: `Tag '${oldTag}' renommé en '${newTag}' dans ${updatedCount} notes.`,
        data: {
          oldTag,
          newTag,
          updatedCount,
        },
      });
    } catch (error) {
      return next(
        AppError.create("Erreur lors de la mise à jour du tag", 400, error),
      );
    }
  }) as RequestHandler,

  deleteTag: (async (req, res, next) => {
    try {
      const { tag } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Veuillez vous connecter.", 401));
      }

      if (!tag) {
        return next(new AppError("Le nom du tag est requis.", 400));
      }

      // Récupérer toutes les notes qui contiennent ce tag
      const notesWithTag = await prisma.note.findMany({
        where: {
          userId,
          tags: {
            has: tag,
          },
        },
        select: { id: true, tags: true },
      });

      // Supprimer le tag de chaque note
      let updatedCount = 0;

      for (const note of notesWithTag) {
        if (note.tags && note.tags.includes(tag)) {
          const updatedTags = note.tags.filter((t) => t !== tag);

          await prisma.note.update({
            where: { id: note.id },
            data: { tags: updatedTags },
          });

          updatedCount++;
        }
      }

      res.status(200).json({
        status: "success",
        message: `Tag '${tag}' supprimé de ${updatedCount} notes.`,
        data: {
          tag,
          updatedCount,
        },
      });
    } catch (error) {
      return next(
        AppError.create("Erreur lors de la suppression du tag", 400, error),
      );
    }
  }) as RequestHandler,

  // Rechercher des notes par plusieurs tags (avec opérateur ET ou OU)
  searchByTags: (async (req, res, next) => {
    try {
      const { tags, operator = "OR" } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Veuillez vous connecter.", 401));
      }

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return next(
          new AppError("Au moins un tag est requis pour la recherche.", 400),
        );
      }

      let notes;

      if (operator.toUpperCase() === "AND") {
        // Recherche avec l'opérateur ET - toutes les notes qui contiennent TOUS les tags
        notes = await prisma.note.findMany({
          where: {
            userId,
            AND: tags.map((tag) => ({
              tags: {
                has: tag,
              },
            })),
          },
          orderBy: {
            created_at: "desc",
          },
        });
      } else {
        // Recherche avec l'opérateur OU (par défaut) - toutes les notes qui contiennent AU MOINS UN des tags
        notes = await prisma.note.findMany({
          where: {
            userId,
            tags: {
              hasSome: tags,
            },
          },
          orderBy: {
            created_at: "desc",
          },
        });
      }

      res.status(200).json({
        status: "success",
        results: notes.length,
        data: {
          operator: operator.toUpperCase(),
          tags,
          notes: notes.map(formatNote),
        },
      });
    } catch (error) {
      return next(
        AppError.create("Erreur lors de la recherche par tags", 400, error),
      );
    }
  }) as RequestHandler,
};

export default tagController;
