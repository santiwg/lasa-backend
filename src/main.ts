import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GlobalExceptionFilter } from './utilities/filters/global-exception.filter';

async function bootstrap() {
  // Load environment variables from .env
  dotenv.config();
  // Enable NestJS internal logger levels.
  // This controls what gets printed to stdout/stderr (useful when running in Docker/systemd/PM2 on a VPS).
  // Levels:
  // - 'error': errores/excepciones (normalmente con stacktrace)
  // - 'warn': advertencias (situaciones inesperadas pero no fatales)
  // - 'log': logs informativos generales (arranque, eventos importantes)
  // - 'debug': detalles para depuración (normalmente sólo en dev)
  // - 'verbose': aún más detalle (trazas muy “chatter”, diagnóstico fino)
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  
  // Global Exception Filter - maneja todos los errores de forma consistente
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  app.useGlobalPipes(new ValidationPipe({
    // whitelist: true filtra silenciosamente propiedades extra del request
    // forbidNonWhitelisted: true rechaza el request si hay propiedades extra
    // Ambos son necesarios: whitelist identifica qué es "extra", forbidNonWhitelisted lo rechaza
    whitelist: true,
    forbidNonWhitelisted: true
  }));
  
  // Habilitar serialización global para que @Exclude() funcione
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  
  // Enable CORS using environment variable FRONTEND_URL, fallback to allow all
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  Logger.log(`Listening on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
