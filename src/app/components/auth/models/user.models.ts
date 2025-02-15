export interface User {
  id: number;
  name: string;
  email: string;
  phone: number;
  created_at: string;
  role: RoleEnum;
  token?: string;
}

export enum RoleEnum {
  ADMIN = 1,
  MODERATOR = 2,
  CLIENT = 3
}
