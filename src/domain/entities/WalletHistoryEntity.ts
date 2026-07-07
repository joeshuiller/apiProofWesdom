import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne
} from "typeorm";
import { UsersEntity } from "./UsersEntity";

@Entity("wallets_history")
export class WalletHistoryEntity {
    @PrimaryColumn("uuid")
    id!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 0 })
    amount!: number;

    @Column({ type: 'enum', enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'], nullable: false, default: 'PENDING' })
    status!: string;

    @ManyToOne(() => UsersEntity, (users) => users.senderId, { nullable: false })
    senderId!: UsersEntity

    @ManyToOne(() => UsersEntity, (users) => users.receiverId, { nullable: false })
    receiverId!: UsersEntity

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt?: Date;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updatedAt?: Date;

    @DeleteDateColumn({ type: "timestamp with time zone" })
    deletedAt?: Date;
}