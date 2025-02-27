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

app.listen(port, async () => {
  console.log(`🚀 Serveur démarré sur le port ${port}`);
  await testDatabaseConnection();

  // Test d'envoi d'email sur erreur avec la configuration port 587
  if (process.env.NODE_ENV === "development") {
    console.log(
      "🧪 Test de notification par email (port 587) : une erreur sera générée dans 10 secondes...",
    );
    testErrorEmail(10000); // Générer une erreur après 10 secondes
  }

  // Commenter à nouveau après le test
  // if (process.env.NODE_ENV === "development") {
  //   console.log(
  //     "🧪 Test de notification par email : une erreur sera générée dans 10 secondes...",
  //   );
  //   testErrorEmail(10000); // Générer une erreur après 10 secondes
  // }
});
