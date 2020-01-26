import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import Token from '../auth/tokens.entity';

@Entity()
export default class User {
  constructor(id?: number, email?: string, password?: string, tokens?: Token[]) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.tokens = tokens;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  email: string;

  @Column()
  password: string;

  @OneToMany(
    type => Token,
    token => token.user,
    {
      cascade: true,
    },
  )
  tokens: Token[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
