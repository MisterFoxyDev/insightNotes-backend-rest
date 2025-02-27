/**
 * Utilitaire pour tester l'envoi d'emails sur les erreurs non rattrapées
 *
 * Pour l'utiliser:
 * 1. Importez cette fonction dans le fichier de votre choix
 * 2. Appelez-la avec le délai souhaité (en ms)
 *
 * Exemple:
 * ```
 * import { testErrorEmail } from './utils/testErrorEmail';
 *
 * // Dans votre code
 * testErrorEmail(5000); // Déclenchera une erreur après 5 secondes
 * ```
 */
export const testErrorEmail = (delayMs = 3000) => {
  console.log(`🧪 Test d'erreur programmé dans ${delayMs}ms...`);

  setTimeout(() => {
    try {
      // Simuler une erreur de référence - un type d'erreur non rattrapée commun
      // @ts-ignore - Cette ligne génère intentionnellement une erreur
      const nonExistentVariable = undefinedVariable.someProperty;
    } catch (error) {
      // Pour tester unhandledRejection, on rejette une promesse sans la gérer
      Promise.reject(new Error("Test d'erreur de promesse non gérée"));

      // Pour tester uncaughtException, on lance une erreur en dehors d'un try/catch
      throw new Error("Test d'erreur non rattrapée pour l'envoi d'email");
    }
  }, delayMs);
};

/**
 * Test d'erreur asynchrone (pour tester unhandledRejection)
 */
export const testAsyncErrorEmail = async (delayMs = 3000) => {
  console.log(`🧪 Test d'erreur asynchrone programmé dans ${delayMs}ms...`);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("Test d'erreur de promesse rejetée"));
    }, delayMs);
  });
};
