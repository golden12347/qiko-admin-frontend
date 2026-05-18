import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import { isSuperAdminRole } from "@/lib/authRoles";
import type { AppDispatch, RootState } from "./index";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useIsSuperAdmin(): boolean {
  const roleName = useAppSelector((state) => state.auth.admin?.role_name);
  return isSuperAdminRole(roleName);
}
