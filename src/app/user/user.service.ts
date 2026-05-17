import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../../database/entities/user.entity';
import { ResponseHelper } from '../../helper/base.response';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    return ResponseHelper.created(savedUser, 'User created successfully');
  }

  async findAll() {
    const users = await this.userRepository.find();
    const totalCount = await this.userRepository.count();

    return ResponseHelper.collection(
      users,
      'Users retrieved successfully',
      ResponseHelper.buildPagination(1, totalCount, totalCount),
    );
  }
  
  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return ResponseHelper.success(user, 'User retrieved successfully');
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Validate existence (will throw NotFoundException if not found)
    const existingUser = await this.userRepository.findOne({ where: { id }, relations: ['profile'] });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    Object.assign(existingUser, updateUserDto);
    const updatedUser = await this.userRepository.save(existingUser);
    return ResponseHelper.success(updatedUser, 'User updated successfully');
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.userRepository.remove(user);
    return ResponseHelper.noContent('User deleted successfully');
  }
}
