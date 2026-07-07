import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm"
import { UsersEntity } from "./UsersEntity"

@Entity("roles")
export class RolesEntity {
    @PrimaryColumn("uuid")
    id!: string;

    @Column()
    name!: string

    @Column({
        default: true
    })
    active!: boolean

    @OneToMany(() => UsersEntity, (user) => user.rolesId)
    users?: UsersEntity[]

    // Automatically set when the entity is first created
    @CreateDateColumn()
    createdAt?: Date;

    // Automatically updated every time the entity is saved
    @UpdateDateColumn()
    updatedAt?: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}