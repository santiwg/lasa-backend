import { ValueTransformer } from 'typeorm';

// Definimos los valores del enum localmente para evitar import circular
enum ComplexityFactorValues {
    SIMPLE = 1,
    MEDIUM = 1.5,
    COMPLEX = 2
}

export const ComplexityFactorTransformer: ValueTransformer = {
    to: (value: number): string => {
        // Al guardar en BD, convertir number a string
        return value?.toString();
    },
    from: (value: string): number => {
        // Al leer de BD, convertir string a number
        if (value === null || value === undefined) return ComplexityFactorValues.SIMPLE;
        
        const numValue = parseFloat(value);
        
        // Validar que sea uno de los valores permitidos
        switch (numValue) {
            case 1:
                return ComplexityFactorValues.SIMPLE;
            case 1.5:
                return ComplexityFactorValues.MEDIUM;
            case 2:
                return ComplexityFactorValues.COMPLEX;
            default:
                return ComplexityFactorValues.SIMPLE; // Default fallback
        }
    }
};
