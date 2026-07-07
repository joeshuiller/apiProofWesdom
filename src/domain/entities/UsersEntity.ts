import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm"
import { RolesEntity } from "./RolesEntity"
import { WalletEntity } from "./WalletEntity";
import { WalletHistoryEntity } from "./WalletHistoryEntity";

@Entity("users")
export class UsersEntity {
    @PrimaryColumn("uuid")
    id!: string;

    @Column()
    name!: string

    @Column()
    surName!: string

    @Column({ default: 'CC' })
    typeDocumentID!: string

    @Column({ unique: true })
    documentID!: string

    @Column({ unique: true })
    telephone!: string

    @Column({ unique: true })
    email!: string

    @Column()
    password!: string

    @Column({
        type: "text",
    })
    imgClients?: string

    @Column({
        default: true
    })
    active!: boolean

    @ManyToOne(() => RolesEntity, (roles) => roles.users, { nullable: false })
    rolesId!: RolesEntity

    @OneToMany(() => WalletEntity, tx => tx.usersId)
    usersId?: WalletEntity[];

    @OneToMany(() => WalletHistoryEntity, walletHistory => walletHistory.senderId)
    senderId?: WalletHistoryEntity[];

    @OneToMany(() => WalletHistoryEntity, walletHistory => walletHistory.receiverId)
    receiverId?: WalletHistoryEntity[];

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt?: Date;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updatedAt?: Date;

    @DeleteDateColumn({ type: "timestamp with time zone" })
    deletedAt?: Date;
}