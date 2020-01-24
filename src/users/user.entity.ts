import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}
