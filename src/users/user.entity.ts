import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import Token from '../auth/tokens.entity';

@Entity()
export default class User {
  constructor(id?: number, email?: string, password?: string) {
    this.id = id;
    this.email = email;
    this.password = password;
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
}
