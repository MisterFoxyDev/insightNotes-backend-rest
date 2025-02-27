class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    // En production, on ne veut pas exposer les détails dans le message
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // Stockage des détails pour logs et environnement de développement
    if (details) {
      this.details = details;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  // Méthode statique pour créer une erreur avec le bon message selon l'environnement
  static create(
    baseMessage: string,
    statusCode: number,
    details?: any,
  ): AppError {
    const isDevelopment = process.env.NODE_ENV === "development";

    // En développement, on peut inclure les détails dans le message
    const message =
      isDevelopment && details ? `${baseMessage} (${details})` : baseMessage;

    return new AppError(message, statusCode, details);
  }
}

export default AppError;
