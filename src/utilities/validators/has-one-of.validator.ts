import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * ValidatorConstraint que verifica si un objeto tiene al menos uno de los atributos especificados con un valor válido (no null, no undefined, no vacío)
 */
@ValidatorConstraint({ name: 'hasOneOf', async: false })
export class HasOneOfConstraint implements ValidatorConstraintInterface {
  /**
   * Ejecuta la validación
   * @param value - el valor del objeto siendo validado
   * @param args - argumentos de validación que incluyen los nombres de las propiedades a verificar
   * @returns true si al menos una propiedad tiene un valor válido, false en caso contrario
   */
  validate(_value: unknown, args: ValidationArguments): boolean {
    const propertyNames = args.constraints as string[];
    // `args.object` es el DTO completo (no el valor de una propiedad puntual).
    // Esto es clave porque `@HasOneOf(['cuit','cuil'])` se aplica en `cuil`,
    // pero la regla depende de ambas propiedades.
    const obj = args.object as Record<string, unknown> | undefined;

    if (!obj) {
      return false;
    }

    for (const propertyName of propertyNames) {
      const propertyValue = obj[propertyName];
      if (propertyValue === null || propertyValue === undefined) {
        continue;
      }

      if (typeof propertyValue === 'string') {
        if (propertyValue.trim().length > 0) {
          return true;
        }
        continue;
      }

      return true;
    }

    return false;
  }

  /**
   * Mensaje de error personalizado cuando la validación falla
   * @param args - argumentos de validación
   * @returns el mensaje de error
   */
  defaultMessage(args: ValidationArguments): string {
    // Obtener los nombres de las propiedades desde los argumentos
    const propertyNames = args.constraints;
    // Crear un mensaje legible listando las propiedades
    const properties = propertyNames.join(' or ');
    return `At least one of the following properties must have a valid value: ${properties}`;
  }
}

/**
 * Decorador personalizado que valida si un objeto tiene al menos uno de los atributos especificados con un valor válido
 * @param propertyNames - nombres de las propiedades a verificar (mínimo 2)
 * @param validationOptions - opciones de validación de class-validator (opcional)
 * @returns un decorador que se puede aplicar a propiedades de clase
 *
 * Ejemplo de uso:
 * export class NewSupplierDto {
 *   @IsString()
 *   @IsNotEmpty()
 *   businessName: string;
 *
 *   @IsString()
 *   @IsOptional()
 *   cuit: string | null;
 *
 *   @IsString()
 *   @IsOptional()
 *   @HasOneOf(['cuit', 'cuil'])  // Aplicar sobre la ÚLTIMA propiedad del grupo
 *   cuil: string | null;
 * }
 *
 */
export function HasOneOf(
  propertyNames: string[],
  validationOptions?: ValidationOptions,
) {
  // Soporta uso como:
  // - Decorador de clase: @HasOneOf(['cuit','cuil'])
  // - Decorador de propiedad (legacy): @HasOneOf(['cuit','cuil']) sobre 'cuil'
  return function (target: any, propertyName?: string) {
    // Si se usa a nivel clase, TS no provee propertyName.
    // Registramos un "pseudo-campo" para que class-validator ejecute el constraint.
    const isClassDecorator = typeof propertyName !== 'string';

    // - Si es decorador de clase, `target` ya es el constructor.
    // - Si es decorador de propiedad, `target` es el prototype y debemos usar `target.constructor`.
    const ctor: Function =
      typeof target === 'function' ? (target as Function) : (target.constructor as Function);

    const decoratorProperty = isClassDecorator ? 'hasOneOf' : propertyName;

    registerDecorator({
      target: ctor,
      propertyName: decoratorProperty!,
      options: validationOptions,
      constraints: propertyNames, // ['cuit', 'cuil'] - propiedades a validar
      validator: HasOneOfConstraint, // clase que ejecuta la validación
    });
  };
}
/* 

* Paso a paso de lo que hace:
 * 1. El decorador se aplica sobre la propiedad 'cuil' (última del grupo a validar)
 * 2. Retorna una función que recibe:
 *    - target: el prototipo de la clase (NewSupplierDto.prototype)
 *    - propertyName: el nombre de la propiedad donde se aplicó ('@HasOneOf(...)')
 * 3. registerDecorator registra el validador:
 *    - target.constructor: la clase misma (NewSupplierDto)
 *    - propertyName: el nombre de la propiedad donde se aplicó el decorador (cuil)
 *    - constraints: array ['cuit', 'cuil'] - los nombres a validar
 *    - validator: HasOneOfConstraint - la clase que ejecuta la validación
 * 4. Cuando class-validator valida el DTO:
 *    - Ejecuta HasOneOfConstraint.validate() pasando el objeto completo
 *    - HasOneOfConstraint itera sobre ['cuit', 'cuil'] y verifica si al menos uno tiene valor
 *    - Si ninguno tiene valor válido, lanza el error defaultMessage()
*/