import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { State } from '../state/state.entity';
import { PaymentMethod } from '../payment-method/payment-method.entity';
import { Unit } from '../unit/unit.entity';
import { EmployeeRole } from '../../employees/employee-role/employee-role.entity';
import { EMPLOYEE_ROLES } from '../../utilities/constants/business-constants';

/**
 * Seeds "static" / predefined rows into the database at application startup.
 *
 * How it works:
 * - Nest calls `onApplicationBootstrap()` once the app is fully initialized.
 * - We insert a predefined list of rows for State / PaymentMethod / Unit.
 * - The seeding is **idempotent**: you can restart the app many times and it
 *   will not create duplicates.
 *
 * Why this is safe to run on every boot:
 * - `PaymentMethod.name` and `Unit.name` have a UNIQUE constraint at DB level,
 *   so we can bulk-insert and ignore conflicts.
 * - `State` does NOT have a UNIQUE constraint in the entity, so we explicitly
 *   check "(scope, name) already exists" before inserting.
 */
@Injectable()
export class StartupSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupSeederService.name);

  constructor(
    // Repositories are provided by TypeOrmModule.forFeature(...) in SharedModule.
    // This lets us query/insert entities without manually instantiating anything.
    @InjectRepository(State) private readonly stateRepository: Repository<State>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(Unit) private readonly unitRepository: Repository<Unit>,
    @InjectRepository(EmployeeRole)
    private readonly employeeRoleRepository: Repository<EmployeeRole>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Runs once on app startup.
    // We keep each "seed" step independent to avoid one failure blocking all.
    await this.seedStates();
    await this.seedPaymentMethods();
    await this.seedUnits();
    await this.seedEmployeeRoles();
  }

  private async seedStates(): Promise<void> {
    // Desired rows for Purchase workflow.
    const desiredStates: Array<Pick<State, 'scope' | 'name'>> = [
      { scope: 'Compra', name: 'Pendiente' },
      { scope: 'Compra', name: 'Parcialmente pagado' },
      { scope: 'Compra', name: 'Pagado' },
    ];

    let created = 0;

    for (const desired of desiredStates) {
      // State doesn't have a DB uniqueness constraint, so we prevent duplicates
      // by checking if a row with the same (scope, name) already exists.
      const existing = await this.stateRepository.findOne({
        where: { scope: desired.scope, name: desired.name },
      });
      if (existing) continue;

      // Create + save the missing row.
      const entity = this.stateRepository.create({
        scope: desired.scope,
        name: desired.name,
      });
      await this.stateRepository.save(entity);
      created += 1;
    }

    if (created > 0) {
      this.logger.log(`Seeded ${created} State row(s)`);
    }
  }

  private async seedPaymentMethods(): Promise<void> {
    const desiredPaymentMethods: Array<Pick<PaymentMethod, 'name' | 'description'>> = [
      { name: 'Efectivo', description: null },
      { name: 'Transferencia', description: null },
      { name: 'Cuenta Corriente', description: null },
      { name: 'Cheque', description: null },
    ];

    // `PaymentMethod.name` has a UNIQUE constraint, so we can bulk insert and
    // ignore duplicates at the DB level.
    // Note: `.orIgnore()` turns this into "insert if not exists" behavior.
    await this.paymentMethodRepository
      .createQueryBuilder()
      .insert()
      .into(PaymentMethod)
      .values(desiredPaymentMethods)
      .orIgnore()
      .execute();
  }

  private async seedEmployeeRoles(): Promise<void> {
    const desiredRoles: Array<Pick<EmployeeRole, 'name' | 'description'>> = [
      { name: EMPLOYEE_ROLES.DIRECT_LABOR, description: null },
      { name: EMPLOYEE_ROLES.INDIRECT_LABOR, description: null },
      { name: EMPLOYEE_ROLES.MANAGEMENT, description: null },
      { name: EMPLOYEE_ROLES.SALES, description: null },
    ];

    await this.employeeRoleRepository
      .createQueryBuilder()
      .insert()
      .into(EmployeeRole)
      .values(desiredRoles)
      .orIgnore()
      .execute();
  }

  private async seedUnits(): Promise<void> {
    // Units are grouped by scope, but the entity enforces UNIQUE on `name`.
    // This works fine as long as unit names are globally unique.
    const desiredUnits: Array<Pick<Unit, 'scope' | 'name' | 'description'>> = [
      { scope: 'Alimento', name: 'Kilo', description: null },
      { scope: 'Alimento', name: 'Gramos', description: null },
      { scope: 'Liquido', name: 'Litro', description: null },
      { scope: 'Liquido', name: 'Mililitro', description: null },
      { scope: 'Frecuencia', name: 'Mensual', description: null },
      { scope: 'Frecuencia', name: 'Anual', description: null },
      { scope: 'Frecuencia', name: 'Semanal', description: null },
    ];

    // `Unit.name` has a UNIQUE constraint, so we can bulk insert and ignore
    // duplicates at DB level.
    await this.unitRepository
      .createQueryBuilder()
      .insert()
      .into(Unit)
      .values(desiredUnits)
      .orIgnore()
      .execute();
  }
}
