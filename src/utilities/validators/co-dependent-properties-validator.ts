import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Interface que define un conjunto de propiedades co-dependientes.
 * Si cualquiera de las propiedades en `anyOf` tiene un valor válido,
 * todas las propiedades listadas en `required` deben tenerlo también.
 */
export interface CoDependentGroup {
  /** Propiedades opcionales cuya presencia requiere otras propiedades. */
  anyOf: string[];
  /** Propiedades que se vuelven obligatorias cuando alguna de `anyOf` existe. */
  required: string[];
}

/**
 * Constraint reutilizable que valida co-dependencias entre propiedades de un DTO.
 */
@ValidatorConstraint({ name: 'CoDependentProperties', async: false })
export class CoDependentPropertiesConstraint
  implements ValidatorConstraintInterface
{
  /**
   * Realiza la validación: si alguna propiedad de `anyOf` tiene valor,
   * todas las propiedades `required` deben tenerlo también.
   */
  validate(_value: unknown, args: ValidationArguments): boolean {
    const groups: CoDependentGroup[] = args.constraints;
    const obj = args.object as Record<string, unknown> | undefined;

    if (!obj) {
      return false;
    }

    for (const group of groups) {
      const hasAny = group.anyOf.some((prop) => this.hasValue(obj[prop]));

      if (hasAny) {
        const missingRequired = group.required.filter(
          (prop) => !this.hasValue(obj[prop]),
        );

        if (missingRequired.length > 0) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Mensaje por defecto listo para listar las propiedades faltantes.
   */
  defaultMessage(args: ValidationArguments): string {
    const groups: CoDependentGroup[] = args.constraints;

    const descriptions = groups.map((group) => {
      const anyOf = group.anyOf.join(', ');
      const required = group.required.join(', ');
      return `if any of [${anyOf}] is provided, then [${required}] must also be provided`;
    });

    return descriptions.join('; ');
  }

  /**
   * Verifica si el valor se considera "presente": no null, no undefined y no string vacío.
   */
  private hasValue(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return true;
  }
}

/**
 * Decorador que aplica la validación de propiedades co-dependientes.
 *
 * @param groups Conjuntos de propiedades co-dependientes.
 * @param validationOptions Opciones de class-validator (mensaje personalizado, etc.).
 *
 * @example
 * ```ts
 * @CoDependentProperties([
 *   { anyOf: ['paidAmount'], required: ['paymentMethodId'] },
 * ])
 * export class NewPurchaseDto { ... }
 * ```
 */
export function CoDependentProperties(
  groups: CoDependentGroup[],
  validationOptions?: ValidationOptions,
) {
  return function (target: any) {
    const ctor: Function =
      typeof target === 'function' ? (target as Function) : (target.constructor as Function);

    registerDecorator({
      target: ctor,
      propertyName: 'coDependentProperties',
      options: validationOptions,
      constraints: groups,
      validator: CoDependentPropertiesConstraint,
    });
  };
}
