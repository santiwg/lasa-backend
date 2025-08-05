export const EMPLOYEE_ROLES = {
    DIRECT_LABOR: 'Mano de Obra Directa',
    INDIRECT_LABOR: 'Mano de Obra Indirecta',
    MANAGEMENT: 'Gerencia',
    SALES: 'Ventas'
} as const;

export const COST_CALCULATION_CONFIG = {
    // Nombre del rol para búsqueda dinámica (más flexible)
    DIRECT_LABOR_ROLE_NAME: EMPLOYEE_ROLES.DIRECT_LABOR,
    
    // Respaldo: ID para casos donde la búsqueda por nombre falle
    // TODO: Configurar este ID según tu base de datos si es necesario
    DIRECT_LABOR_ROLE_ID: 1
} as const;
