// Fonction utilitaire pour convertir les BigInt en string
export const formatNote = (note: any) => ({
  ...note,
  id: note.id.toString(),
  userId: note.userId.toString(),
});

// Fonction utilitaire pour formater la réponse utilisateur
export const formatUserResponse = (user: any) => ({
  id: user.id.toString(),
  email: user.email,
  name: user.name,
  notesCount: user._count?.notes || 0,
});
