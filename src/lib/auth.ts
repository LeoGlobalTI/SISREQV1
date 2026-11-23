import { User, UserRole } from "../../types";

export const canReceiveAndDerive = (user?: User): boolean => {
  if (!user) return false;
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN) return true;
  return user.role === UserRole.HEAD && !!user.canReceiveAndDerive;
};

export const canSupervise = (user?: User): boolean => {
  return !!user?.canSupervise && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN;
};
