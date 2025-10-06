import { AppError } from '../../../shared/errors/AppError';

export class EntityNotFoundError extends AppError {
  constructor(message: string = 'Entity not found') {
    super(message);
    this.name = 'EntityNotFoundError';
  }
}

export class DuplicateEntityError extends AppError {
  constructor(message: string = 'Duplicate entity') {
    super(message);
    this.name = 'DuplicateEntityError';
  }
}
