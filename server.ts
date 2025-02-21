import { app } from "./app";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Initialiser dotenv au début de l'application
dotenv.config();

const prisma = new PrismaClient();

const port = process.env.PORT || 3000;

// Fonction pour tester la connexion à la base de données
async function testDatabaseConnection() {
  try {
    const userCount = await prisma.user.count();
    const noteCount = await prisma.note.count();
    console.log("✅ Connexion à la base de données réussie !");
    console.log(`📊 Nombre d'utilisateurs dans la base : ${userCount}`);
    console.log(`📊 Nombre de notes dans la base : ${noteCount}`);
  } catch (error) {
    console.error("❌ Erreur de connexion à la base de données :", error);
    process.exit(1);
  }
}

app.listen(port, async () => {
  console.log(`🚀 Serveur démarré sur le port ${port}`);
  await testDatabaseConnection();
});
