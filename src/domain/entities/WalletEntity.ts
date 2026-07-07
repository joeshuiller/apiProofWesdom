import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    VersionColumn,
    DeleteDateColumn,
    ManyToOne
} from "typeorm";
import { UsersEntity } from "./UsersEntity";

@Entity("wallets")
export class WalletEntity {
    @PrimaryColumn("uuid")
    id!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 0 })
    availableBalance!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 0 })
    accountingBalance!: number;

    @VersionColumn()
    version!: number;

    @ManyToOne(() => UsersEntity, (users) => users.usersId, { nullable: false })
    usersId!: UsersEntity

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt?: Date;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updatedAt?: Date;

    @DeleteDateColumn({ type: "timestamp with time zone" })
    deletedAt?: Date;
}