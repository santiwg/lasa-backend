import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
