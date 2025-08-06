import { LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export class FileLogger implements LoggerService {
    private logDir = path.join(process.cwd(), 'logs');

    constructor() {
        // Crear directorio de logs si no existe
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private writeToFile(level: string, message: string, trace?: string) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} [${level}] ${message}${trace ? '\n' + trace : ''}\n`;

        // Escribir a archivo específico del nivel
        const fileName = level.toLowerCase() === 'error' ? 'error.log' : 'combined.log';
        const filePath = path.join(this.logDir, fileName);
        
        fs.appendFileSync(filePath, logEntry);
        
        // También escribir a consola (para desarrollo)
        console.log(`[${level}] ${message}`);
        if (trace) console.log(trace);
    }

    log(message: string, context?: string) {
        this.writeToFile('LOG', `${context ? `[${context}] ` : ''}${message}`);
    }

    error(message: string, trace?: string, context?: string) {
        this.writeToFile('ERROR', `${context ? `[${context}] ` : ''}${message}`, trace);
    }

    warn(message: string, context?: string) {
        this.writeToFile('WARN', `${context ? `[${context}] ` : ''}${message}`);
    }

    debug(message: string, context?: string) {
        this.writeToFile('DEBUG', `${context ? `[${context}] ` : ''}${message}`);
    }

    verbose(message: string, context?: string) {
        this.writeToFile('VERBOSE', `${context ? `[${context}] ` : ''}${message}`);
    }
}
