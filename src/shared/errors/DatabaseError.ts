import { AppError } from './AppError';

export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}
