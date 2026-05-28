import { PlatformId } from './orders';

export interface Platform {
  id: PlatformId;
  displayName: string;
  color: string;
  icon: string;
  isConnected: boolean;
  lastSync: Date;
}
