import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from '../../../database/entities/profile.entity';
import { ResponseHelper } from 'src/helper/base.response';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {}

  async create(dto: CreateProfileDto) {
    const profile = this.profileRepo.create({
      name: dto.name,
      username: dto.username,
      avatarUrl: dto.avatarUrl,
      bio: dto.bio,
      userId: dto.userId,
    });
    return this.profileRepo.save(profile);
  }

  async findAll() {
    return this.profileRepo.find({
      relations: ['user'],
    });
  }

  async findOne(id: string) {
    const profile = await this.profileRepo.findOne({
      where: { id },
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(id: string, dto: UpdateProfileDto) {
    await this.findOne(id); // validasi exist

    await this.profileRepo.update({ id }, dto);
    return this.profileRepo.findOne({ where: { id } });
  }

  // Logika baru untuk mengupdate status isPro di database
  async updateProStatus(id: string, status: boolean) {
    await this.findOne(id); // Memastikan profil ditemukan sebelum update

    await this.profileRepo.update({ id }, { isPro: status });
    return this.profileRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    const profile = await this.findOne(id);
    return this.profileRepo.remove(profile);
  }
}
