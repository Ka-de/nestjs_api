import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ErrorResponse } from './errors/error.response';
import { JoiValidationPipe } from './pipes/joi-validation.pipe';
import { ResponseSchema } from './shared/response.schema';
import * as Joi from 'joi';
import { UsersService } from './domains/users/users.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
