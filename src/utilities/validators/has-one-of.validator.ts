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
  validate(value: any, args: ValidationArguments): boolean {
    // Extraer los nombres de propiedades desde los argumentos del decorador
    const propertyNames = args.constraints;

    // Iterar sobre cada nombre de propiedad especificado
    for (const propertyName of propertyNames) {
      // Obtener el valor de la propiedad del objeto
      const propertyValue = value[propertyName];

      // Verificar si el valor es válido (no null, no undefined, no string vacío)
      if (propertyValue !== null && propertyValue !== undefined && propertyValue !== '') {
        // Si encontramos al menos un valor válido, la validación pasa
        return true;
      }
    }

    // Si llegamos aquí, ninguna de las propiedades tiene un valor válido
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
  return function (target: any, propertyName: string) {
    // Paso 1: Registrar el decorador con class-validator
    // target.constructor es la clase (NewSupplierDto)
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName, // 'cuil' - donde se aplicó el decorador
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