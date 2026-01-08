import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProfileDto) {
    return this.prisma.client.profile.create({
      data: {
        name: dto.name,
        username: dto.username,
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        user: {
          connect: { id: dto.userId },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.client.profile.findMany({
      include: {
        user: true,
      },
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.client.profile.findUnique({
      where: { id },
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(id: string, dto: UpdateProfileDto) {
    await this.findOne(id); // validasi exist

    return this.prisma.client.profile.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.client.profile.delete({
      where: { id },
    });
  }
}
