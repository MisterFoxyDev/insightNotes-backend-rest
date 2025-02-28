"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.server = void 0;
const app_1 = require("./app");
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
// Initialiser dotenv au début de l'application
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const port = process.env.PORT || 3000;
// Fonction pour tester la connexion à la base de données
function testDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userCount = yield prisma.user.count();
            const noteCount = yield prisma.note.count();
            console.log("✅ Connexion à la base de données réussie !");
            console.log(`📊 Nombre d'utilisateurs dans la base : ${userCount}`);
            console.log(`📊 Nombre de notes dans la base : ${noteCount}`);
        }
        catch (error) {
            console.error("❌ Erreur de connexion à la base de données :", error);
            process.exit(1);
        }
    });
}
// Stocker le serveur dans une variable pour pouvoir le fermer proprement
const server = app_1.app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`🚀 Serveur démarré sur le port ${port}`);
    yield testDatabaseConnection();
    // Test d'envoi d'email sur erreur avec la configuration port 587
    // if (process.env.NODE_ENV === "development") {
    //   console.log(
    //     "🧪 Test de notification par email (port 587) : une erreur sera générée dans 10 secondes...",
    //   );
    //   testErrorEmail(10000); // Générer une erreur après 10 secondes
    // }
}));
exports.server = server;
// Fonction d'arrêt gracieux
const gracefulShutdown = (signal) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield prisma.$disconnect();
        console.log("✅ Connexion à la base de données fermée");
        // 3. Autres nettoyages (cache Redis, files d'attente, etc.)
        // Ajoutez ici d'autres fermetures de connexions si nécessaire
        clearTimeout(forceExit);
        console.log("👋 Arrêt gracieux terminé avec succès");
        process.exit(0);
    }
    catch (err) {
        console.error("❌ Erreur lors de l'arrêt gracieux:", err);
        process.exit(1);
    }
});
// Gérer les signaux d'arrêt
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
