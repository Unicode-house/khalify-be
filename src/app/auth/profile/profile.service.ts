import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from '../../../database/entities/profile.entity';
import { ResponseHelper } from '../../../helper/base.response';

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
    const savedProfile = await this.profileRepo.save(profile);
    return ResponseHelper.created(savedProfile, 'Profile created successfully');
  }

  async findAll() {
    const profiles = await this.profileRepo.find({
      relations: ['user'],
    });
    return ResponseHelper.collection(profiles, 'Profiles retrieved successfully');
  }

  async findOne(id: string) {
    const profile = await this.profileRepo.findOne({
      where: { id },
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return ResponseHelper.success(profile, 'Profile retrieved successfully');
  }

  async update(id: string, dto: UpdateProfileDto) {
    const existing = await this.profileRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Profile not found');

    await this.profileRepo.update({ id }, dto);
    const updated = await this.profileRepo.findOne({ where: { id } });
    return ResponseHelper.success(updated, 'Profile updated successfully');
  }

  // Logika baru untuk mengupdate status isPro di database
  async updateProStatus(id: string, status: boolean) {
    const existing = await this.profileRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Profile not found');

    await this.profileRepo.update({ id }, { isPro: status });
    const updated = await this.profileRepo.findOne({ where: { id } });
    return ResponseHelper.success(
      updated,
      `PRO status ${status ? 'activated' : 'deactivated'} successfully`,
    );
  }

  async remove(id: string) {
    const profile = await this.profileRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Profile not found');
    await this.profileRepo.remove(profile);
    return ResponseHelper.noContent('Profile deleted successfully');
  }
}
