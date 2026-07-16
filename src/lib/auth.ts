import { User, UserRole } from "../../types";

export const canReceiveAndDerive = (user?: User): boolean => {
  return !!user?.canReceiveAndDerive || user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;
};

export const canSupervise = (user?: User): boolean => {
  return !!user?.canSupervise || user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;
};
