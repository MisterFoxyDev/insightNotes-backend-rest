import { app } from "./app";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { testErrorEmail } from "./utils/testErrorEmail";

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

// Stocker le serveur dans une variable pour pouvoir le fermer proprement
const server = app.listen(port, async () => {
  console.log(`🚀 Serveur démarré sur le port ${port}`);
  await testDatabaseConnection();

  // Test d'envoi d'email sur erreur avec la configuration port 587
  // if (process.env.NODE_ENV === "development") {
  //   console.log(
  //     "🧪 Test de notification par email (port 587) : une erreur sera générée dans 10 secondes...",
  //   );
  //   testErrorEmail(10000); // Générer une erreur après 10 secondes
  // }
});

// Fonction d'arrêt gracieux
const gracefulShutdown = async (signal: string) => {
  console.log(`🛑 Signal ${signal} reçu. Arrêt gracieux en cours...`);

  const forceExit = setTimeout(() => {
    console.error("⚠️ Impossible de fermer les connexions, arrêt forcé");
    process.exit(1);
  }, 10000); // 10 secondes maximum

  try {
    // 1. Arrêter d'accepter de nouvelles requêtes HTTP
    server.close(() => {
      console.log("✅ Serveur HTTP arrêté");
    });

    // 2. Fermer les connexions à la base de données
    await prisma.$disconnect();
    console.log("✅ Connexion à la base de données fermée");

    // 3. Autres nettoyages (cache Redis, files d'attente, etc.)
    // Ajoutez ici d'autres fermetures de connexions si nécessaire

    clearTimeout(forceExit);
    console.log("👋 Arrêt gracieux terminé avec succès");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur lors de l'arrêt gracieux:", err);
    process.exit(1);
  }
};

// Gérer les signaux d'arrêt
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Exporter le serveur et le client Prisma pour les utiliser ailleurs si nécessaire
export { server, prisma };
