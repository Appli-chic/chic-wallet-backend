import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import User from '../users/user.entity';

@Entity()
export default class Token {
  constructor(id?: number, key?: string, createdAt?: Date, updatedAt?: Date, user?: User) {
    this.id = id;
    this.key = key;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.user = user;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  key: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(
    type => User,
    user => user.tokens,
  )
  user: User;
}
