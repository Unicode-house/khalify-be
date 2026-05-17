import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('👤 Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: `Registers a new user account with an email address. 
    The email must be unique — if a user with the same email already exists, a validation error is returned.`,
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        status: { code: 201, type: 'SUCCESS', message: 'User created successfully' },
        data: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          email: 'user@example.com',
          create_at: '2026-05-17T13:02:34.000Z',
          singedIn: '2026-05-17T13:02:34.000Z',
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Validation failed (e.g., invalid email format)',
    schema: {
      example: {
        status: { code: 422, type: 'ERROR', message: 'Validation failed. Please check the submitted data.' },
        data: {
          errorCode: 'VALIDATION_FAILED',
          errorType: 'VALIDATION_ERROR',
          message: 'Validation failed. Please check the submitted data.',
          fieldErrors: [{ field: 'email', code: 'INVALID_VALUE', message: 'email must be an email' }],
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a collection of all registered users with pagination metadata.',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection of users with pagination',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Users retrieved successfully' },
        data: {
          items: [
            { id: 'uuid-1', email: 'user1@example.com', create_at: '2026-05-17T13:02:34.000Z' },
            { id: 'uuid-2', email: 'user2@example.com', create_at: '2026-05-16T10:00:00.000Z' },
          ],
          count: 2,
        },
        meta: {
          requestId: 'uuid',
          timestamp: '2026-05-17T13:02:34.456Z',
          apiVersion: '2.0.0',
          pagination: { currentPage: 1, pageSize: 2, totalItems: 2, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        },
      },
    },
  })
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a single user by UUID, including their profile relation.',
  })
  @ApiParam({ name: 'id', description: 'User UUID (v4 format)', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({
    status: 200,
    description: 'User found with profile data',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'User retrieved successfully' },
        data: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          email: 'user@example.com',
          create_at: '2026-05-17T13:02:34.000Z',
          profile: { id: 'profile-uuid', name: 'John Doe', username: 'johndoe', isPro: true },
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        status: { code: 404, type: 'ERROR', message: 'User with ID a1b2c3d4-... not found' },
        data: { errorCode: 'RESOURCE_NOT_FOUND', errorType: 'RESOURCE_NOT_FOUND', message: 'User with ID a1b2c3d4-... not found' },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Partially updates user fields. Only provided fields will be updated.',
  })
  @ApiParam({ name: 'id', description: 'User UUID', format: 'uuid' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently deletes a user account by UUID. This action is **irreversible**.',
  })
  @ApiParam({ name: 'id', description: 'User UUID', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'User deleted successfully' },
        data: null,
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
