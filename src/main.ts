import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GlobalExceptionFilter } from './utilities/filters/global-exception.filter';
import { createAppLogger } from './logger/app-logger';

async function bootstrap() {
  // Custom logger:
  // - Console: keeps logs visible in the terminal (stdout/stderr)
  // - File (daily): writes ONLY error logs to ./logs/error-YYYY-MM-DD.log
  const app = await NestFactory.create(AppModule, { logger: createAppLogger() });
  
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
