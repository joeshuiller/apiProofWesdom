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
   rolesId!: string;
   createdAt?: Date;
   updatedAt?: Date;
   deletedAt?: Date;
}