export interface UserItem {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'user';
  status: 'active' | 'disabled';
  createdAt: string;
}
