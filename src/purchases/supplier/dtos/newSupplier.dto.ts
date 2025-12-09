import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { HasOneOf } from '../../../utilities/validators/has-one-of.validator';



export class NewSupplierDto {

    @IsString()
    @IsNotEmpty()
    businessName: string;

    @IsString()
    @IsNotEmpty()
    //No pongo el decorador IsPhoneNumber porque complejiza un poco el input, 
    // obligando al usuario a incluir el código de país y puede traer algún problema si no lo ingreso especificamente como espera el validador
    phone: string;

    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    
    @IsString()
    @IsOptional()
    cuit: string | null;

    @IsString()
    @IsOptional()
    @HasOneOf(['cuit','cuil'])
    cuil: string | null;

}
