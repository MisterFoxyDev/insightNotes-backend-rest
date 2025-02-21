import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { formatNote } from "../utils/utils";

const prisma = new PrismaClient();

const noteController = {
  createNote: (async (req, res) => {
    try {
      const { title, content } = req.body;

      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Utilisateur non authentifié",
        });
      }
      const newNote = await prisma.note.create({
        data: {
          title,
          content,
          user: {
            connect: { id: userId },
          },
        },
      });

      res.status(201).json({
        status: "success",
        data: {
          note: formatNote(newNote),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        status: "error",
        message: "Erreur lors de la création de la note",
      });
    }
  }) as RequestHandler,

  getUserNotes: (async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Utilisateur non authentifié",
        });
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
      res.status(400).json({
        status: "error",
        message: "Erreur lors de la récupération des notes",
      });
    }
  }) as RequestHandler,

  getNoteById: (async (req, res) => {
    try {
      const { id } = req.params;
      const note = await prisma.note.findUnique({
        where: { id: BigInt(id) },
      });

      if (!note) {
        return res.status(404).json({
          status: "error",
          message: "Note non trouvée",
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          note: formatNote(note),
        },
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: "Erreur lors de la récupération de la note",
      });
    }
  }) as RequestHandler,

  updateNote: (async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Utilisateur non authentifié",
        });
      }

      // Vérifie si la note existe et appartient à l'utilisateur
      const existingNote = await prisma.note.findFirst({
        where: {
          id: BigInt(id),
          userId,
        },
      });

      if (!existingNote) {
        return res.status(404).json({
          status: "error",
          message: "Note non trouvée ou non autorisée",
        });
      }

      const updatedNote = await prisma.note.update({
        where: { id: BigInt(id) },
        data: updates, // Applique uniquement les champs fournis
      });

      res.status(200).json({
        status: "success",
        data: { note: formatNote(updatedNote) },
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: "Erreur lors de la mise à jour de la note",
      });
    }
  }) as RequestHandler,
};

export default noteController;
