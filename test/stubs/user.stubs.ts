import { CreateUserDto } from "../../src/domains/users/dto/create-user.dto";
import { User } from "../../src/domains/users/entities/user.entity";

export const createUserStub: CreateUserDto = {
  email: 'any@mail.com',
  phone: '00000000000',
  firstname: 'any',
  lastname: 'user',
}

export const userStub: Partial<User> = {
  ...createUserStub,
  verified: false
}

