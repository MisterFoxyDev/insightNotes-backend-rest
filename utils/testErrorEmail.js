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
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAsyncErrorEmail = exports.testErrorEmail = void 0;
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
const testErrorEmail = (delayMs = 3000) => {
    console.log(`🧪 Test d'erreur programmé dans ${delayMs}ms...`);
    setTimeout(() => {
        try {
            // Simuler une erreur de référence - un type d'erreur non rattrapée commun
            // @ts-ignore - Cette ligne génère intentionnellement une erreur
            const nonExistentVariable = undefinedVariable.someProperty;
        }
        catch (error) {
            // Pour tester unhandledRejection, on rejette une promesse sans la gérer
            Promise.reject(new Error("Test d'erreur de promesse non gérée"));
            // Pour tester uncaughtException, on lance une erreur en dehors d'un try/catch
            throw new Error("Test d'erreur non rattrapée pour l'envoi d'email");
        }
    }, delayMs);
};
exports.testErrorEmail = testErrorEmail;
/**
 * Test d'erreur asynchrone (pour tester unhandledRejection)
 */
const testAsyncErrorEmail = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (delayMs = 3000) {
    console.log(`🧪 Test d'erreur asynchrone programmé dans ${delayMs}ms...`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error("Test d'erreur de promesse rejetée"));
        }, delayMs);
    });
});
exports.testAsyncErrorEmail = testAsyncErrorEmail;
