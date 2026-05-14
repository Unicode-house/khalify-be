import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('widgets')
export class Widget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column({ unique: true, name: 'db_id' })
  dbID: string;

  @CreateDateColumn({ name: 'created_at' })
  create_at: Date;

  @Column({ name: 'profile_id' })
  profileId: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, name: 'custom_avatar' })
  customAvatar: string;

  @Column({ nullable: true, name: 'custom_bio', type: 'text' })
  customBio: string;

  @Column({ nullable: true, name: 'custom_link' })
  customLink: string;

  @Column({ nullable: true, name: 'custom_name' })
  customName: string;

  @Column({ nullable: true, name: 'custom_username' })
  customUsername: string;

  @ManyToOne(() => Profile, (profile) => profile.widgets)
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;
}
