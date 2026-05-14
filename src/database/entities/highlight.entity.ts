import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('highlights')
export class HighLight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'profile_id' })
  profileId: string;

  @ManyToOne(() => Profile, (profile) => profile.highLights)
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;
}
