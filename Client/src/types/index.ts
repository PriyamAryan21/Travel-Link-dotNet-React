export * from './auth';
export * from './users';
export * from './friends';
export * from './groups';
export * from './expenses';
export * from './itinerary';
export * from './location';

export interface ServiceResult<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}