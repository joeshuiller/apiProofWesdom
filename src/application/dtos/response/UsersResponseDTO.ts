import { RolesDTO } from "@app/dtos/request/RolesDTO";

export class UsersResponseDTO {
   id!: string;
   name!: string;
   surName!: string;
   typeDocumentID!: string;
   documentID!: string;
   email!: string;
   password!: string;
   imgClients?: string;
   telephone!: string;
   active!: boolean;
   roles?: RolesDTO;
   createdAt?: Date;
   updatedAt?: Date;
   deletedAt?: Date;
}